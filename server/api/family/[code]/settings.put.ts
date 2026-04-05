import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const body = await readBody(event)

  if (!code) {
    throw createError({ statusCode: 400, message: 'Code famille requis' })
  }

  if (!body.adminPin) {
    throw createError({ statusCode: 400, message: 'PIN admin requis' })
  }

  const family = await prisma.family.findUnique({
    where: { code: code.toUpperCase() }
  })

  if (!family) {
    throw createError({ statusCode: 404, message: 'Famille non trouvée' })
  }

  if (family.adminPin !== body.adminPin) {
    throw createError({ statusCode: 403, message: 'PIN admin incorrect' })
  }

  const email = body.notificationEmail?.trim() || null

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, message: 'Adresse email invalide' })
  }

  const updated = await prisma.family.update({
    where: { id: family.id },
    data: { notificationEmail: email },
    select: { notificationEmail: true }
  })

  return updated
})
