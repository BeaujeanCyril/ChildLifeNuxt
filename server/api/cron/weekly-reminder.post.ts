import prisma from '~/server/utils/db'
import { sendMail } from '~/server/utils/mail'

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export default defineEventHandler(async (event) => {
  // Protection par clé secrète
  const body = await readBody(event)
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || body.secret !== cronSecret) {
    throw createError({ statusCode: 403, message: 'Accès refusé' })
  }

  const weekStart = getWeekStart(new Date())

  // Récupérer toutes les familles avec un email de notification
  const families = await prisma.family.findMany({
    where: {
      notificationEmail: { not: null }
    },
    include: {
      children: true
    }
  })

  const results = []

  for (const family of families) {
    if (!family.notificationEmail || family.children.length === 0) continue

    // Vérifier si la semaine a des vies saisies
    const weekGrids = await prisma.weekGrid.findMany({
      where: {
        familyId: family.id,
        weekStart
      }
    })

    const weekTotal = weekGrids.reduce((sum, grid) => sum + grid.lives, 0)

    if (weekTotal === 0) {
      // Aucune vie saisie cette semaine -> envoyer rappel
      try {
        const childNames = family.children.map(c => `${c.emoji} ${c.name}`).join(', ')

        await sendMail(
          family.notificationEmail,
          `Rappel Mission Coop - Famille ${family.name}`,
          `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #6419e6; text-align: center;">Mission Coop</h1>
            <h2>Bonjour famille ${family.name} !</h2>
            <p>Cette semaine, aucune vie n'a encore été saisie pour vos enfants :</p>
            <p style="font-size: 1.2em; text-align: center;">${childNames}</p>
            <p>Pensez à remplir la grille de la semaine avant de la clôturer !</p>
            <div style="text-align: center; margin-top: 20px;">
              <a href="https://childlife.cyriongames.fr/family/${family.code}/admin"
                 style="background: #6419e6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
                Ouvrir l'administration
              </a>
            </div>
            <p style="opacity: 0.6; font-size: 0.85em; margin-top: 30px; text-align: center;">
              Pour ne plus recevoir ces rappels, retirez votre email dans les paramètres de l'administration.
            </p>
          </div>
          `
        )

        results.push({ family: family.name, status: 'sent' })
      } catch (e: any) {
        results.push({ family: family.name, status: 'error', error: e.message })
      }
    } else {
      results.push({ family: family.name, status: 'skipped', weekTotal })
    }
  }

  return { processed: families.length, results }
})
