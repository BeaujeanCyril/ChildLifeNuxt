import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const body = await readBody(event)
  const { adminPin } = body

  if (!code || !adminPin || adminPin.length !== 4) {
    throw createError({
      statusCode: 400,
      message: 'Code famille et PIN 4 chiffres requis'
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

  // Ne permet de configurer que si pas deja configure
  if (family.adminPin) {
    throw createError({
      statusCode: 400,
      message: 'PIN admin deja configure'
    })
  }

  await prisma.family.update({
    where: { id: family.id },
    data: { adminPin }
  })

  return { success: true }
})
