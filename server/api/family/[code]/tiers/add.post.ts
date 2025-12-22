import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const body = await readBody(event)

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

  const tier = await prisma.rewardTier.create({
    data: {
      threshold: body.threshold || 10,
      reward: body.reward || 'Nouvelle récompense',
      unlocked: false,
      familyId: family.id
    }
  })

  return tier
})
