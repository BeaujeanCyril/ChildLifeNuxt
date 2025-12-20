import prisma from '../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // Update children names
  if (body.children) {
    for (const child of body.children) {
      if (child.id) {
        await prisma.child.update({
          where: { id: child.id },
          data: { name: child.name, emoji: child.emoji }
        })
      }
    }
  }

  // Update week grid
  if (body.week?.grid) {
    const monday = getMonday(now)
    for (let i = 0; i < body.week.grid.length; i++) {
      await prisma.weekGrid.upsert({
        where: { dayIndex_weekStart: { dayIndex: i, weekStart: monday } },
        update: {
          child0: body.week.grid[i].child0 || 0,
          child1: body.week.grid[i].child1 || 0
        },
        create: {
          dayIndex: i,
          weekStart: monday,
          child0: body.week.grid[i].child0 || 0,
          child1: body.week.grid[i].child1 || 0
        }
      })
    }
  }

  // Update month progress
  if (body.month?.shared !== undefined) {
    await prisma.monthProgress.upsert({
      where: { month_year: { month: currentMonth, year: currentYear } },
      update: { shared: body.month.shared },
      create: { month: currentMonth, year: currentYear, shared: body.month.shared }
    })
  }

  // Update config
  if (body.config || body.settings) {
    const config = await prisma.config.findFirst()
    if (config) {
      await prisma.config.update({
        where: { id: config.id },
        data: {
          dailyBaseLives: body.config?.dailyBaseLives ?? config.dailyBaseLives,
          dailyMaxLives: body.config?.dailyMaxLives ?? config.dailyMaxLives,
          scale: body.settings?.scale ?? config.scale,
          weekendBonus: body.settings?.weekendBonus ?? config.weekendBonus
        }
      })
    }
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
