import prisma from '~/server/utils/db'

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')

  if (!code) {
    throw createError({
      statusCode: 400,
      message: 'Code famille requis'
    })
  }

  const family = await prisma.family.findUnique({
    where: { code: code.toUpperCase() }
  })

  if (!family) {
    throw createError({
      statusCode: 404,
      message: 'Famille non trouvée'
    })
  }

  const weekStart = getWeekStart(new Date())

  // Calculer le total de la semaine
  const weekGrids = await prisma.weekGrid.findMany({
    where: {
      familyId: family.id,
      weekStart
    }
  })

  const weekTotal = weekGrids.reduce((sum, grid) => sum + grid.lives, 0)

  // Ajouter au mois en cours
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  await prisma.monthProgress.upsert({
    where: {
      month_year_familyId: {
        month,
        year,
        familyId: family.id
      }
    },
    update: {
      shared: { increment: weekTotal }
    },
    create: {
      month,
      year,
      shared: weekTotal,
      familyId: family.id
    }
  })

  // Réinitialiser la grille de la semaine
  await prisma.weekGrid.deleteMany({
    where: {
      familyId: family.id,
      weekStart
    }
  })

  // Récupérer le nouveau total mensuel
  const monthProgress = await prisma.monthProgress.findUnique({
    where: {
      month_year_familyId: {
        month,
        year,
        familyId: family.id
      }
    }
  })

  return {
    weekTotal,
    monthTotal: monthProgress?.shared || 0
  }
})
