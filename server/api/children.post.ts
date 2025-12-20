import prisma from '../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, emoji } = body

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Name is required' })
  }

  const child = await prisma.child.create({
    data: { name, emoji: emoji || '👶' }
  })

  return child
})
