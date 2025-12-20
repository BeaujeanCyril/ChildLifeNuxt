import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaultTiers = [
  { threshold: 5, reward: 'Plaque de Lego' },
  { threshold: 8, reward: 'Acheter des chewing-gum' },
  { threshold: 10, reward: 'Moment télé' },
  { threshold: 10, reward: 'Jouer à un jeu de société' },
  { threshold: 10, reward: 'Moment foot tous les 4' },
  { threshold: 15, reward: 'Ballade dans les bois' },
  { threshold: 18, reward: 'Session de dessins à 4' },
  { threshold: 18, reward: 'Jouer à la switch' },
  { threshold: 20, reward: 'Jouer au foot avec papa' },
  { threshold: 20, reward: 'Acheter un livre ou un manga' },
  { threshold: 22, reward: 'Aller manger une glace' },
  { threshold: 25, reward: 'Jouer à un jeu de voiture (luna park)' },
  { threshold: 30, reward: 'Takeaway' },
  { threshold: 35, reward: 'Cinéma' },
  { threshold: 35, reward: 'Fast-food' },
  { threshold: 45, reward: 'Restaurant' },
  { threshold: 50, reward: 'Journée à Bruxelles' },
  { threshold: 65, reward: 'Faire de l\'escalade' },
  { threshold: 70, reward: 'Laser game (à 4)' },
  { threshold: 80, reward: 'Aller voir un match de foot' },
  { threshold: 85, reward: 'Parc aquatique' },
  { threshold: 90, reward: 'Journée en famille à l\'expo LEGO' },
  { threshold: 95, reward: 'Nouvelle manette Switch' },
  { threshold: 100, reward: 'Acheter de nouvelles chaussures' },
  { threshold: 100, reward: 'Acheter une vareuse de foot' },
  { threshold: 115, reward: 'Acheter une vareuse (Lamine Yamal)' },
  { threshold: 120, reward: 'Parc d\'attraction' }
]

const defaultChildren = [
  { name: 'Renard', emoji: '🦊' },
  { name: 'Panda', emoji: '🐼' }
]

async function main() {
  console.log('Seeding database...')

  // Create default children if none exist
  const childCount = await prisma.child.count()
  if (childCount === 0) {
    await prisma.child.createMany({ data: defaultChildren })
    console.log(`Created ${defaultChildren.length} default children`)
  } else {
    console.log(`${childCount} children already exist`)
  }

  // Create default tiers if none exist
  const tierCount = await prisma.rewardTier.count()
  if (tierCount === 0) {
    await prisma.rewardTier.createMany({ data: defaultTiers })
    console.log(`Created ${defaultTiers.length} default tiers`)
  } else {
    console.log(`${tierCount} tiers already exist`)
  }

  // Create default config if none exists
  const configCount = await prisma.config.count()
  if (configCount === 0) {
    await prisma.config.create({
      data: { dailyBaseLives: 0, dailyMaxLives: 2, scale: 1.0, weekendBonus: 0 }
    })
    console.log('Created default config')
  } else {
    console.log('Config already exists')
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
