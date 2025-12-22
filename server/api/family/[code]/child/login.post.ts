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
      children: {
        where: { pin: pin },
        include: {
          purchases: {
            include: { reward: true },
            orderBy: { createdAt: 'desc' }
          }
        }
      },
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

  if (family.children.length === 0) {
    throw createError({
      statusCode: 401,
      message: 'PIN incorrect'
    })
  }

  const child = family.children[0]

  return {
    child: {
      id: child.id,
      name: child.name,
      emoji: child.emoji,
      points: child.points
    },
    purchases: child.purchases,
    rewards: family.rewards
  }
})
