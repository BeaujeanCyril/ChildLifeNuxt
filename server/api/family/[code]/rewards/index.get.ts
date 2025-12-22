import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')

  if (!code) {
    throw createError({
      statusCode: 400,
      message: 'Code famille requis'
    })
  }

  const family = await prisma.family.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      rewards: {
        where: { available: true },
        orderBy: { cost: 'asc' }
      }
    }
  })

  if (!family) {
    throw createError({
      statusCode: 404,
      message: 'Famille non trouvee'
    })
  }

  return family.rewards
})
