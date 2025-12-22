import prisma from '~/server/utils/db'

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

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
    where: { code: code.toUpperCase() }
  })

  if (!family) {
    throw createError({
      statusCode: 404,
      message: 'Famille non trouvee'
    })
  }

  const weekStart = getWeekStart(new Date())

  // Mise a jour de la grille de la semaine
  if (body.weekGrids && Array.isArray(body.weekGrids)) {
    for (const grid of body.weekGrids) {
      await prisma.weekGrid.upsert({
        where: {
          dayIndex_childId_weekStart_familyId: {
            dayIndex: grid.dayIndex,
            childId: grid.childId,
            weekStart,
            familyId: family.id
          }
        },
        update: {
          lives: grid.lives
        },
        create: {
          dayIndex: grid.dayIndex,
          childId: grid.childId,
          lives: grid.lives,
          weekStart,
          familyId: family.id
        }
      })
    }
  }

  // Mise a jour des enfants
  if (body.children && Array.isArray(body.children)) {
    for (const child of body.children) {
      if (child.id) {
        const updateData: Record<string, unknown> = {}
        if (child.name !== undefined) updateData.name = child.name
        if (child.emoji !== undefined) updateData.emoji = child.emoji
        if (child.position !== undefined) updateData.position = child.position
        if (child.points !== undefined) updateData.points = child.points
        if (child.pin !== undefined) updateData.pin = child.pin

        await prisma.child.update({
          where: { id: child.id },
          data: updateData
        })
      }
    }
  }

  // Mise a jour de la config
  if (body.config && family.id) {
    await prisma.config.upsert({
      where: { familyId: family.id },
      update: {
        dailyBaseLives: body.config.dailyBaseLives,
        dailyMaxLives: body.config.dailyMaxLives,
        scale: body.config.scale,
        weekendBonus: body.config.weekendBonus
      },
      create: {
        familyId: family.id,
        dailyBaseLives: body.config.dailyBaseLives ?? 0,
        dailyMaxLives: body.config.dailyMaxLives ?? 2,
        scale: body.config.scale ?? 1.0,
        weekendBonus: body.config.weekendBonus ?? 0
      }
    })
  }

  // Mise a jour des tiers
  if (body.rewardTiers && Array.isArray(body.rewardTiers)) {
    for (const tier of body.rewardTiers) {
      if (tier.id) {
        await prisma.rewardTier.update({
          where: { id: tier.id },
          data: {
            threshold: tier.threshold,
            reward: tier.reward,
            unlocked: tier.unlocked
          }
        })
      }
    }
  }

  return { success: true }
})
