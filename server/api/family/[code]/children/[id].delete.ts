import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const id = getRouterParam(event, 'id')

  if (!code || !id) {
    throw createError({
      statusCode: 400,
      message: 'Code famille et ID enfant requis'
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

  // Vérifier que l'enfant appartient à cette famille
  const child = await prisma.child.findFirst({
    where: {
      id: parseInt(id),
      familyId: family.id
    }
  })

  if (!child) {
    throw createError({
      statusCode: 404,
      message: 'Enfant non trouvé'
    })
  }

  await prisma.child.delete({
    where: { id: parseInt(id) }
  })

  return { success: true }
})
