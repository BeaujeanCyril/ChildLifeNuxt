import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { name, cost, description, adminPin } = body

  if (!code || !id || !adminPin || !name || cost === undefined || cost === null) {
    throw createError({
      statusCode: 400,
      message: 'Donnees manquantes'
    })
  }

  const family = await prisma.family.findUnique({
    where: { code: code.toUpperCase() }
  })

  if (!family || family.adminPin !== adminPin) {
    throw createError({
      statusCode: 401,
      message: 'Non autorise'
    })
  }

  const reward = await prisma.reward.update({
    where: { id: parseInt(id) },
    data: {
      name,
      cost: parseInt(cost),
      description: description || null
    }
  })

  return reward
})
