import prisma from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') as string)
  const body = await readBody(event)
  const { name, emoji } = body

  const child = await prisma.child.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(emoji && { emoji })
    }
  })

  return child
})
