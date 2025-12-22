import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const childId = getRouterParam(event, 'childId')
  const body = await readBody(event)
  const { rewardId } = body

  if (!code || !childId || !rewardId) {
    throw createError({
      statusCode: 400,
      message: 'Donnees manquantes'
    })
  }

  const family = await prisma.family.findUnique({
    where: { code: code.toUpperCase() }
  })

  if (!family) {
    throw createError({
      statusCode: 404,
      message: 'Famille non trouvee'
    })
  }

  const child = await prisma.child.findFirst({
    where: { id: parseInt(childId), familyId: family.id }
  })

  if (!child) {
    throw createError({
      statusCode: 404,
      message: 'Enfant non trouve'
    })
  }

  const reward = await prisma.reward.findFirst({
    where: { id: rewardId, familyId: family.id, available: true }
  })

  if (!reward) {
    throw createError({
      statusCode: 404,
      message: 'Recompense non trouvee'
    })
  }

  if (child.points < reward.cost) {
    throw createError({
      statusCode: 400,
      message: 'Points insuffisants'
    })
  }

  // Creer l'achat et deduire les points
  const [purchase] = await prisma.$transaction([
    prisma.rewardPurchase.create({
      data: {
        childId: child.id,
        rewardId: reward.id,
        pointsSpent: reward.cost,
        status: 'pending'
      },
      include: { reward: true }
    }),
    prisma.child.update({
      where: { id: child.id },
      data: { points: { decrement: reward.cost } }
    })
  ])

  return {
    success: true,
    purchase,
    newPoints: child.points - reward.cost
  }
})
