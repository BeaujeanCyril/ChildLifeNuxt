import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const childId = getRouterParam(event, 'childId')
  const body = await readBody(event)
  const { pin, adminPin } = body

  if (!code || !childId || !pin || pin.length !== 4) {
    throw createError({
      statusCode: 400,
      message: 'PIN 4 chiffres requis'
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

  // Verifier PIN admin si famille a un admin
  if (family.adminPin && family.adminPin !== adminPin) {
    throw createError({
      statusCode: 401,
      message: 'PIN admin requis'
    })
  }

  // Verifier que le PIN n'est pas deja utilise par un autre enfant
  const existingChild = await prisma.child.findFirst({
    where: {
      familyId: family.id,
      pin: pin,
      id: { not: parseInt(childId) }
    }
  })

  if (existingChild) {
    throw createError({
      statusCode: 400,
      message: 'Ce PIN est deja utilise par un autre enfant'
    })
  }

  await prisma.child.update({
    where: { id: parseInt(childId) },
    data: { pin }
  })

  return { success: true }
})
