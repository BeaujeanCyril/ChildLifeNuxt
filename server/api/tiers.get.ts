import prisma from '../utils/db'

export default defineEventHandler(async () => {
  const tiers = await prisma.rewardTier.findMany({ orderBy: { threshold: 'asc' } })
  return tiers
})
