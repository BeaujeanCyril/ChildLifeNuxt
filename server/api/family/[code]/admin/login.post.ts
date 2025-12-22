import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const body = await readBody(event)
  const { pin } = body

  if (!code || !pin) {
    throw createError({
      statusCode: 400,
      message: 'Code famille et PIN requis'
    })
  }

  const family = await prisma.family.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      children: { orderBy: { position: 'asc' } },
      rewards: { orderBy: { cost: 'asc' } },
      config: true
    }
  })

  if (!family) {
    throw createError({
      statusCode: 404,
      message: 'Famille non trouvee'
    })
  }

  if (family.adminPin !== pin) {
    throw createError({
      statusCode: 401,
      message: 'PIN administrateur incorrect'
    })
  }

  // Recuperer les achats en attente
  const pendingPurchases = await prisma.rewardPurchase.findMany({
    where: {
      child: { familyId: family.id },
      status: 'pending'
    },
    include: {
      child: true,
      reward: true
    },
    orderBy: { createdAt: 'desc' }
  })

  return {
    family: {
      id: family.id,
      name: family.name,
      code: family.code
    },
    children: family.children,
    rewards: family.rewards,
    config: family.config,
    pendingPurchases
  }
})
