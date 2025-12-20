import prisma from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { weeklyTotal, scale, weekendBonus } = body

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // Calculate adjusted total
  const adjusted = Math.round(weeklyTotal * scale) + weekendBonus

  // Update month progress
  const monthProgress = await prisma.monthProgress.upsert({
    where: { month_year: { month: currentMonth, year: currentYear } },
    update: { shared: { increment: Math.max(0, adjusted) } },
    create: { month: currentMonth, year: currentYear, shared: Math.max(0, adjusted) }
  })

  // Reset week grid
  const monday = getMonday(now)
  await prisma.weekGrid.updateMany({
    where: { weekStart: monday },
    data: { child0: 0, child1: 0 }
  })

  return {
    success: true,
    newTotal: monthProgress.shared,
    added: adjusted
  }
})

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}
