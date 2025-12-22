import prisma from '~/server/utils/db'

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

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

  // Recuperer les donnees de la semaine en cours
  const weekStart = getWeekStart(new Date())
  const weekGrids = await prisma.weekGrid.findMany({
    where: {
      familyId: family.id,
      weekStart
    }
  })

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
    adminPin: adminPin ? true : false, // Juste indiquer si un admin PIN existe
    weekGrids,
    monthProgress: monthProgress || { shared: 0 }
  }
})
