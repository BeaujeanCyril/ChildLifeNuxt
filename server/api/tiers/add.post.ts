import prisma from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { threshold, reward } = body

  if (threshold === undefined || !reward) {
    throw createError({ statusCode: 400, statusMessage: 'Threshold and reward are required' })
  }

  const tier = await prisma.rewardTier.create({
    data: { threshold, reward, unlocked: false }
  })

  return tier
})
