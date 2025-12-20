import prisma from '../utils/db'

export default defineEventHandler(async () => {
  const children = await prisma.child.findMany({ orderBy: { id: 'asc' } })
  return children
})
