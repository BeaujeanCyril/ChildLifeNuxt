import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const body = await readBody(event)
  const { name, cost, description, adminPin } = body

  if (!code || !name || !cost || !adminPin) {
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

  if (family.adminPin !== adminPin) {
    throw createError({
      statusCode: 401,
      message: 'PIN admin incorrect'
    })
  }

  const reward = await prisma.reward.create({
    data: {
      name,
      cost: parseInt(cost),
      description: description || null,
      familyId: family.id
    }
  })

  return reward
})
