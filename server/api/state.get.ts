import prisma from '../utils/db'

export default defineEventHandler(async () => {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // Get or create current month progress
  let monthProgress = await prisma.monthProgress.findUnique({
    where: { month_year: { month: currentMonth, year: currentYear } }
  })

  if (!monthProgress) {
    monthProgress = await prisma.monthProgress.create({
      data: { month: currentMonth, year: currentYear, shared: 0 }
    })
  }

  // Get children
  let children = await prisma.child.findMany({ orderBy: { id: 'asc' } })

  if (children.length === 0) {
    // Create default children
    await prisma.child.createMany({
      data: [
        { name: 'Renard', emoji: '🦊' },
        { name: 'Panda', emoji: '🐼' }
      ]
    })
    children = await prisma.child.findMany({ orderBy: { id: 'asc' } })
  }

  // Get current week grid
  const monday = getMonday(now)
  let weekGrid = await prisma.weekGrid.findMany({
    where: { weekStart: monday },
    orderBy: { dayIndex: 'asc' }
  })

  if (weekGrid.length === 0) {
    // Create empty week grid
    const days = [0, 1, 2, 3, 4, 5, 6]
    await prisma.weekGrid.createMany({
      data: days.map(dayIndex => ({
        dayIndex,
        weekStart: monday,
        child0: 0,
        child1: 0
      }))
    })
    weekGrid = await prisma.weekGrid.findMany({
      where: { weekStart: monday },
      orderBy: { dayIndex: 'asc' }
    })
  }

  // Get reward tiers
  let tiers = await prisma.rewardTier.findMany({ orderBy: { threshold: 'asc' } })

  // Get config
  let config = await prisma.config.findFirst()
  if (!config) {
    config = await prisma.config.create({
      data: { dailyBaseLives: 0, dailyMaxLives: 2, scale: 1.0, weekendBonus: 0 }
    })
  }

  return {
    children,
    week: {
      grid: weekGrid.map(row => ({ child0: row.child0, child1: row.child1 })),
      weekStart: monday.toISOString()
    },
    month: { shared: monthProgress.shared },
    config: {
      dailyBaseLives: config.dailyBaseLives,
      dailyMaxLives: config.dailyMaxLives,
      monthlyTiers: tiers
    },
    settings: {
      scale: config.scale,
      weekendBonus: config.weekendBonus
    }
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
