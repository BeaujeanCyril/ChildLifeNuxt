import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { adminPin, action } = body // action: 'approve' | 'reject'

  if (!code || !id || !adminPin || !action) {
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

  const purchase = await prisma.rewardPurchase.findFirst({
    where: { id: parseInt(id), child: { familyId: family.id } },
    include: { child: true }
  })

  if (!purchase) {
    throw createError({
      statusCode: 404,
      message: 'Achat non trouve'
    })
  }

  if (action === 'reject') {
    // Rembourser les points
    await prisma.$transaction([
      prisma.rewardPurchase.update({
        where: { id: purchase.id },
        data: { status: 'rejected' }
      }),
      prisma.child.update({
        where: { id: purchase.childId },
        data: { points: { increment: purchase.pointsSpent } }
      })
    ])
  } else {
    await prisma.rewardPurchase.update({
      where: { id: purchase.id },
      data: { status: 'approved' }
    })
  }

  return { success: true }
})
