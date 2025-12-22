import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Paliers de récompenses mensuels (débloqués par le total de la famille)
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

// Récompenses individuelles (achetables par les enfants avec leurs points)
const defaultRewards = [
  { name: '🍬 Bonbon', cost: 5, description: 'Un bonbon au choix' },
  { name: '🍪 Gâteau', cost: 10, description: 'Un gâteau ou biscuit' },
  { name: '🎮 30min jeux vidéo', cost: 15, description: '30 minutes de jeux vidéo supplémentaires' },
  { name: '📺 Episode série', cost: 15, description: 'Un épisode de série au choix' },
  { name: '🍕 Pizza maison', cost: 20, description: 'Une pizza maison pour le dîner' },
  { name: '🎬 Film au choix', cost: 25, description: 'Choisir le film du soir' },
  { name: '🛒 Petit jouet (5€)', cost: 30, description: 'Un petit jouet jusqu\'à 5€' },
  { name: '⏰ Coucher tardif', cost: 30, description: 'Se coucher 30min plus tard' },
  { name: '🎢 Sortie parc', cost: 40, description: 'Une sortie au parc' },
  { name: '🎁 Cadeau moyen (15€)', cost: 50, description: 'Un cadeau jusqu\'à 15€' },
  { name: '🍔 Restaurant fast-food', cost: 60, description: 'Un repas au fast-food' },
  { name: '🎪 Activité spéciale', cost: 75, description: 'Une activité spéciale au choix' },
  { name: '🎮 Nouveau jeu vidéo', cost: 90, description: 'Un nouveau jeu vidéo' },
  { name: '🎉 Grande récompense', cost: 100, description: 'Une grande récompense à définir' }
]

const defaultChildren = [
  { name: 'Renard', emoji: '🦊', position: 0 },
  { name: 'Panda', emoji: '🐼', position: 1 }
]

async function main() {
  console.log('Seeding database...')

  // Vérifier si une famille de demo existe déjà
  const demoFamily = await prisma.family.findUnique({ where: { code: '123456' } })

  if (!demoFamily) {
    console.log('Creating demo family...')

    const family = await prisma.family.create({
      data: {
        name: 'Famille Demo',
        code: '123456',
        adminPin: '0000',
        children: {
          create: defaultChildren
        },
        config: {
          create: {
            dailyBaseLives: 0,
            dailyMaxLives: 2,
            scale: 1.0,
            weekendBonus: 0
          }
        },
        rewardTiers: {
          create: defaultTiers
        },
        rewards: {
          create: defaultRewards
        }
      },
      include: {
        children: true,
        rewards: true,
        rewardTiers: true
      }
    })

    console.log(`Created demo family "${family.name}" with code: ${family.code}`)
    console.log(`- ${family.children.length} children`)
    console.log(`- ${family.rewards.length} rewards`)
    console.log(`- ${family.rewardTiers.length} reward tiers`)
    console.log(`- Admin PIN: 0000`)
  } else {
    console.log(`Demo family already exists (code: ${demoFamily.code})`)
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
