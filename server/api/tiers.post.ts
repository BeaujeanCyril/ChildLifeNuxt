import prisma from '../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { tiers } = body

  if (!tiers || !Array.isArray(tiers)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid tiers data' })
  }

  // Delete all existing tiers and recreate
  await prisma.rewardTier.deleteMany()

  if (tiers.length > 0) {
    await prisma.rewardTier.createMany({
      data: tiers.map((t: { threshold: number; reward: string; unlocked?: boolean }) => ({
        threshold: t.threshold,
        reward: t.reward,
        unlocked: t.unlocked || false
      }))
    })
  }

  const newTiers = await prisma.rewardTier.findMany({ orderBy: { threshold: 'asc' } })

  return { success: true, tiers: newTiers }
})
