import prisma from '~/server/utils/db'

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

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const query = getQuery(event)

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
      },
      config: true,
      rewardTiers: {
        orderBy: { threshold: 'asc' }
      }
    }
  })

  if (!family) {
    throw createError({
      statusCode: 404,
      message: 'Famille non trouvee'
    })
  }

  // Determiner quelle semaine afficher (par defaut: semaine courante)
  let weekStart: Date
  const currentWeekStart = getWeekStart(new Date())

  if (query.week) {
    weekStart = new Date(query.week as string)
    weekStart.setHours(0, 0, 0, 0)
  } else {
    weekStart = currentWeekStart
  }

  const weekGrids = await prisma.weekGrid.findMany({
    where: {
      familyId: family.id,
      weekStart
    }
  })

  // Calculer semaine precedente et suivante
  const prevWeekStart = new Date(weekStart)
  prevWeekStart.setDate(prevWeekStart.getDate() - 7)
  const nextWeekStart = new Date(weekStart)
  nextWeekStart.setDate(nextWeekStart.getDate() + 7)

  // Verifier si on est sur la semaine courante
  const isCurrentWeek = weekStart.getTime() === currentWeekStart.getTime()

  // Recuperer le progres du mois en cours
  const now = new Date()
  const monthProgress = await prisma.monthProgress.findUnique({
    where: {
      month_year_familyId: {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        familyId: family.id
      }
    }
  })

  // Ne pas exposer les PINs dans la reponse GET publique
  const { adminPin, ...familyData } = family
  const childrenWithoutPin = familyData.children.map(({ pin, ...child }) => child)

  return {
    ...familyData,
    children: childrenWithoutPin,
    adminPin: adminPin ? true : false,
    weekGrids,
    monthProgress: monthProgress || { shared: 0 },
    // Infos navigation semaine
    weekInfo: {
      weekStart: weekStart.toISOString(),
      weekLabel: formatWeekLabel(weekStart),
      prevWeek: prevWeekStart.toISOString(),
      nextWeek: nextWeekStart.toISOString(),
      isCurrentWeek,
      canGoNext: !isCurrentWeek // Ne pas naviguer au-dela de la semaine courante
    }
  }
})
