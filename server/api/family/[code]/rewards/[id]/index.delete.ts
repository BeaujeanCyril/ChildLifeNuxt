import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { adminPin } = body

  if (!code || !id || !adminPin) {
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

  await prisma.reward.delete({
    where: { id: parseInt(id) }
  })

  return { success: true }
})
