import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')

  if (!code) {
    throw createError({
      statusCode: 400,
      message: 'Code famille requis'
    })
  }

  const family = await prisma.family.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      children: {
        orderBy: { position: 'asc' }
      }
    }
  })

  if (!family) {
    throw createError({
      statusCode: 404,
      message: 'Famille non trouvee'
    })
  }

  // Recuperer toutes les semaines avec des donnees (tri par date)
  const allWeekGrids = await prisma.weekGrid.findMany({
    where: { familyId: family.id },
    orderBy: { weekStart: 'asc' }
  })

  // Grouper par semaine
  const weeklyData: Record<string, { weekStart: string; children: Record<number, number> }> = {}

  for (const entry of allWeekGrids) {
    const weekKey = entry.weekStart.toISOString().split('T')[0]
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        weekStart: entry.weekStart.toISOString(),
        children: {}
      }
    }
    if (!weeklyData[weekKey].children[entry.childId]) {
      weeklyData[weekKey].children[entry.childId] = 0
    }
    weeklyData[weekKey].children[entry.childId] += entry.lives
  }

  // Transformer en tableau pour le graphique
  const weeks = Object.values(weeklyData).map(week => {
    const weekDate = new Date(week.weekStart)
    const endOfWeek = new Date(weekDate)
    endOfWeek.setDate(endOfWeek.getDate() + 6)
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }

    return {
      weekStart: week.weekStart,
      label: `${weekDate.toLocaleDateString('fr-FR', options)}`,
      children: week.children,
      total: Object.values(week.children).reduce((sum, val) => sum + val, 0)
    }
  })

  // Recuperer les progres mensuels
  const monthlyProgress = await prisma.monthProgress.findMany({
    where: { familyId: family.id },
    orderBy: [{ year: 'asc' }, { month: 'asc' }]
  })

  const months = monthlyProgress.map(mp => {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aout', 'Sep', 'Oct', 'Nov', 'Dec']
    return {
      month: mp.month,
      year: mp.year,
      label: `${monthNames[mp.month - 1]} ${mp.year}`,
      shared: mp.shared
    }
  })

  return {
    children: family.children.map(c => ({ id: c.id, name: c.name, emoji: c.emoji })),
    weeks,
    months
  }
})
