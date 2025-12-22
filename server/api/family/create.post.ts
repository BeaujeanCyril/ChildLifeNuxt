import prisma from '~/server/utils/db'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, children } = body

  if (!name || !children || !Array.isArray(children) || children.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Nom de famille et au moins un enfant requis'
    })
  }

  // Générer un code unique
  let code = generateCode()
  let existing = await prisma.family.findUnique({ where: { code } })
  while (existing) {
    code = generateCode()
    existing = await prisma.family.findUnique({ where: { code } })
  }

  // Créer la famille avec les enfants, config et tiers par défaut
  const family = await prisma.family.create({
    data: {
      name,
      code,
      children: {
        create: children.map((child: { name: string; emoji: string }, index: number) => ({
          name: child.name,
          emoji: child.emoji || '🦊',
          position: index
        }))
      },
      config: {
        create: {
          dailyBaseLives: 0,
          dailyMaxLives: 2,
          scale: 1.0,
          weekendBonus: 0
        }
      },
      rewardTiers: {
        create: [
          { threshold: 5, reward: '🍬 Bonbon' },
          { threshold: 10, reward: '🍪 Gâteau' },
          { threshold: 15, reward: '🎮 30min jeux vidéo' },
          { threshold: 20, reward: '🍕 Pizza maison' },
          { threshold: 25, reward: '🎬 Film au choix' },
          { threshold: 30, reward: '🛒 Petit jouet (5€)' },
          { threshold: 40, reward: '🎢 Sortie parc' },
          { threshold: 50, reward: '🎁 Cadeau moyen (15€)' },
          { threshold: 60, reward: '🍔 Restaurant fast-food' },
          { threshold: 75, reward: '🎪 Activité spéciale' },
          { threshold: 90, reward: '🎮 Nouveau jeu vidéo' },
          { threshold: 100, reward: '🎉 Grande récompense' }
        ]
      }
    },
    include: {
      children: true,
      config: true,
      rewardTiers: true
    }
  })

  return family
})
