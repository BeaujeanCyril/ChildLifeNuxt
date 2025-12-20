import prisma from '../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { type } = body // 'week', 'month', or 'all'

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const monday = getMonday(now)

  if (type === 'week' || type === 'all') {
    await prisma.weekGrid.updateMany({
      where: { weekStart: monday },
      data: { child0: 0, child1: 0 }
    })
  }

  if (type === 'month' || type === 'all') {
    await prisma.monthProgress.upsert({
      where: { month_year: { month: currentMonth, year: currentYear } },
      update: { shared: 0 },
      create: { month: currentMonth, year: currentYear, shared: 0 }
    })
  }

  return { success: true }
})

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}
