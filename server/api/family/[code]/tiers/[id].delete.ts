import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const id = getRouterParam(event, 'id')

  if (!code || !id) {
    throw createError({
      statusCode: 400,
      message: 'Code famille et ID tier requis'
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

  const tier = await prisma.rewardTier.findFirst({
    where: {
      id: parseInt(id),
      familyId: family.id
    }
  })

  if (!tier) {
    throw createError({
      statusCode: 404,
      message: 'Tier non trouvé'
    })
  }

  await prisma.rewardTier.delete({
    where: { id: parseInt(id) }
  })

  return { success: true }
})
