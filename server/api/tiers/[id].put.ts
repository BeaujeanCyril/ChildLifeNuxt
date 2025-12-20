import prisma from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') as string)
  const body = await readBody(event)
  const { threshold, reward, unlocked } = body

  const tier = await prisma.rewardTier.update({
    where: { id },
    data: {
      ...(threshold !== undefined && { threshold }),
      ...(reward !== undefined && { reward }),
      ...(unlocked !== undefined && { unlocked })
    }
  })

  return tier
})
