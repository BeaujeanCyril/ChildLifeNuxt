import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const body = await readBody(event)
  const { pin } = body

  if (!code || !pin) {
    throw createError({
      statusCode: 400,
      message: 'Code famille et PIN requis'
    })
  }

  const family = await prisma.family.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      children: { orderBy: { position: 'asc' } },
      rewards: { orderBy: { cost: 'asc' } },
      config: true
    }
  })

  if (!family) {
    throw createError({
      statusCode: 404,
      message: 'Famille non trouvee'
    })
  }

  if (family.adminPin !== pin) {
    throw createError({
      statusCode: 401,
      message: 'PIN administrateur incorrect'
    })
  }

  // Recuperer les achats en attente
  const pendingPurchases = await prisma.rewardPurchase.findMany({
    where: {
      child: { familyId: family.id },
      status: 'pending'
    },
    include: {
      child: true,
      reward: true
    },
    orderBy: { createdAt: 'desc' }
  })

  // Calculer le debut de la semaine courante
  function getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
  }

  function formatWeekLabel(date: Date): string {
    const endOfWeek = new Date(date)
    endOfWeek.setDate(endOfWeek.getDate() + 6)
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
    return `${date.toLocaleDateString('fr-FR', options)} - ${endOfWeek.toLocaleDateString('fr-FR', options)}`
  }

  const weekStart = getWeekStart(new Date())

  // Recuperer la grille de semaine courante
  const weekGrids = await prisma.weekGrid.findMany({
    where: { familyId: family.id, weekStart }
  })

  // Calculer les infos de navigation
  const prevWeekStart = new Date(weekStart)
  prevWeekStart.setDate(prevWeekStart.getDate() - 7)
  const nextWeekStart = new Date(weekStart)
  nextWeekStart.setDate(nextWeekStart.getDate() + 7)

  return {
    family: {
      id: family.id,
      name: family.name,
      code: family.code
    },
    children: family.children,
    rewards: family.rewards,
    config: family.config,
    pendingPurchases,
    weekGrids,
    weekInfo: {
      weekStart: weekStart.toISOString(),
      weekLabel: formatWeekLabel(weekStart),
      prevWeek: prevWeekStart.toISOString(),
      nextWeek: nextWeekStart.toISOString(),
      isCurrentWeek: true,
      canGoNext: false
    }
  }
})
