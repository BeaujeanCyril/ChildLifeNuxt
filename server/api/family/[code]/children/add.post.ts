import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const body = await readBody(event)

  if (!code) {
    throw createError({
      statusCode: 400,
      message: 'Code famille requis'
    })
  }

  const family = await prisma.family.findUnique({
    where: { code: code.toUpperCase() },
    include: { children: true }
  })

  if (!family) {
    throw createError({
      statusCode: 404,
      message: 'Famille non trouvée'
    })
  }

  const maxPosition = family.children.reduce((max, c) => Math.max(max, c.position), -1)

  const child = await prisma.child.create({
    data: {
      name: body.name || 'Nouvel enfant',
      emoji: body.emoji || '🦊',
      position: maxPosition + 1,
      familyId: family.id
    }
  })

  return child
})
