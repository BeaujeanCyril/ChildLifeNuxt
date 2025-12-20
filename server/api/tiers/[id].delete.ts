import prisma from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') as string)

  await prisma.rewardTier.delete({ where: { id } })

  return { success: true }
})
