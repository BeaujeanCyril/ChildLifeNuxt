<template>
  <main class="wrap">
    <header class="text-center my-6">
      <NuxtLink :to="'/family/' + code" class="btn btn-ghost btn-sm mb-2">← Retour</NuxtLink>
      <h1 class="text-3xl font-black">
        <span class="text-primary">Administration</span>
      </h1>
    </header>

    <!-- Setup PIN admin (premiere fois) -->
    <div v-if="needsSetup" class="max-w-sm mx-auto">
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Configuration initiale</h2>
          <p class="opacity-70">Choisissez un code PIN admin (4 chiffres)</p>

          <input
            type="text"
            maxlength="4"
            class="input input-bordered text-center text-2xl tracking-widest"
            v-model="setupPin"
            placeholder="0000"
          />

          <button
            class="btn btn-primary"
            @click="setupAdmin"
            :disabled="setupPin.length !== 4 || isLoading"
          >
            Configurer
          </button>
        </div>
      </div>
    </div>

    <!-- Login -->
    <div v-else-if="!isLoggedIn" class="max-w-sm mx-auto">
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Connexion admin</h2>
          <p class="opacity-70">Entrez le code PIN administrateur</p>

          <input
            type="password"
            maxlength="4"
            class="input input-bordered text-center text-2xl tracking-widest"
            v-model="adminPin"
            placeholder="****"
            @keyup.enter="login"
          />

          <div v-if="loginError" class="alert alert-error">{{ loginError }}</div>

          <button
            class="btn btn-primary"
            @click="login"
            :disabled="adminPin.length !== 4 || isLoading"
          >
            <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
            Entrer
          </button>
        </div>
      </div>
    </div>

    <!-- Dashboard admin -->
    <template v-else>
      <div class="max-w-2xl mx-auto space-y-6">
        <!-- Navigation semaine -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <h2 class="card-title">Vies de la semaine</h2>
              <div class="flex items-center gap-2">
                <button class="btn btn-sm btn-ghost" @click="goToPrevWeek">
                  ← Precedente
                </button>
                <span class="badge badge-lg">{{ weekLabel }}</span>
                <button
                  class="btn btn-sm btn-ghost"
                  @click="goToNextWeek"
                  :disabled="isCurrentWeek"
                >
                  Suivante →
                </button>
                <button
                  v-if="!isCurrentWeek"
                  class="btn btn-sm btn-primary"
                  @click="goToCurrentWeek"
                >
                  Aujourd'hui
                </button>
              </div>
              <div class="badge badge-accent">Total: {{ weekTotal }}</div>
            </div>

            <div class="overflow-x-auto">
              <table class="table table-zebra w-full mt-2">
                <thead>
                  <tr>
                    <th>Jour</th>
                    <th v-for="child in children" :key="child.id">{{ child.name }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(label, dayIndex) in days" :key="dayIndex">
                    <td class="font-bold">{{ label }}</td>
                    <td v-for="child in children" :key="child.id">
                      <div class="flex items-center gap-1">
                        <template v-if="isCurrentWeek">
                          <button
                            class="btn btn-xs btn-ghost"
                            @click="decrementLives(dayIndex, child.id)"
                            :disabled="getLives(dayIndex, child.id) <= 0"
                          >-</button>
                          <span class="badge badge-lg min-w-[2rem]" :class="getLives(dayIndex, child.id) > 0 ? 'badge-success' : 'badge-ghost'">
                            {{ getLives(dayIndex, child.id) }}
                          </span>
                          <button
                            class="btn btn-xs btn-success"
                            @click="incrementLives(dayIndex, child.id, 1)"
                          >+1</button>
                          <button
                            class="btn btn-xs btn-primary"
                            @click="incrementLives(dayIndex, child.id, 2)"
                          >+2</button>
                        </template>
                        <template v-else>
                          <span class="badge badge-lg min-w-[2rem]" :class="getLives(dayIndex, child.id) > 0 ? 'badge-success' : 'badge-ghost'">
                            {{ getLives(dayIndex, child.id) }}
                          </span>
                        </template>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="isCurrentWeek" class="flex gap-2 mt-4">
              <button class="btn btn-warning btn-sm" @click="closeWeek">
                Cloturer la semaine
              </button>
              <button class="btn btn-ghost btn-sm" @click="resetWeek">
                Reinitialiser
              </button>
            </div>
            <div v-else class="alert alert-info mt-4">
              Semaine passee - Consultation uniquement
            </div>
          </div>
        </div>

        <!-- Statistiques -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Statistiques</h2>

            <div v-if="statsLoading" class="flex justify-center py-8">
              <span class="loading loading-spinner loading-lg"></span>
            </div>

            <template v-else-if="stats">
              <!-- Graphique par semaine -->
              <div class="mb-6">
                <h3 class="font-bold mb-2">Points par semaine</h3>
                <div class="h-64">
                  <Line v-if="weeklyChartData" :data="weeklyChartData" :options="chartOptions" />
                </div>
              </div>

              <!-- Graphique mensuel -->
              <div>
                <h3 class="font-bold mb-2">Total mensuel</h3>
                <div class="h-64">
                  <Bar v-if="monthlyChartData" :data="monthlyChartData" :options="chartOptions" />
                </div>
              </div>
            </template>

            <button class="btn btn-sm btn-ghost mt-4" @click="loadStats">
              Actualiser les stats
            </button>
          </div>
        </div>

        <!-- Demandes en attente -->
        <div v-if="pendingPurchases.length > 0" class="card bg-warning/20 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Demandes en attente</h2>

            <div class="space-y-3">
              <div
                v-for="purchase in pendingPurchases"
                :key="purchase.id"
                class="flex items-center justify-between p-3 bg-base-100 rounded-lg"
              >
                <div>
                  <span class="font-bold">{{ purchase.child.name }}</span>
                  demande
                  <span class="font-bold">{{ purchase.reward.name }}</span>
                  <span class="text-sm opacity-70 ml-2">({{ purchase.pointsSpent }} pts)</span>
                </div>
                <div class="flex gap-2">
                  <button class="btn btn-sm btn-success" @click="approvePurchase(purchase.id, 'approve')">
                    Approuver
                  </button>
                  <button class="btn btn-sm btn-error" @click="approvePurchase(purchase.id, 'reject')">
                    Refuser
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Gestion des enfants -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Enfants</h2>

            <div class="overflow-x-auto">
              <table class="table">
                <thead>
                  <tr>
                    <th>Enfant</th>
                    <th>Points</th>
                    <th>PIN</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="child in children" :key="child.id">
                    <td>
                      <span class="text-xl mr-2">{{ child.emoji }}</span>
                      {{ child.name }}
                    </td>
                    <td>
                      <input
                        type="number"
                        class="input input-bordered input-sm w-24"
                        :value="child.points"
                        @change="updateChildPoints(child, $event)"
                      />
                    </td>
                    <td>
                      <input
                        type="password"
                        maxlength="4"
                        class="input input-bordered input-sm w-20 text-center"
                        :value="child.pin || ''"
                        placeholder="****"
                        @change="updateChildPin(child, $event)"
                      />
                    </td>
                    <td>
                      <button class="btn btn-sm btn-ghost" @click="addPoints(child, 1)">+1</button>
                      <button class="btn btn-sm btn-ghost" @click="addPoints(child, 5)">+5</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Gestion des recompenses -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Recompenses ({{ rewards.length }})</h2>

            <div v-if="rewards.length === 0" class="text-center py-4 opacity-70">
              Aucune recompense configuree. Ajoutez-en ci-dessous.
            </div>

            <div v-else class="overflow-x-auto">
              <table class="table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Description</th>
                    <th>Cout</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="reward in rewards" :key="reward.id">
                    <td>{{ reward.name }}</td>
                    <td class="opacity-70">{{ reward.description || '-' }}</td>
                    <td>{{ reward.cost }} pts</td>
                    <td>
                      <button class="btn btn-sm btn-error" @click="deleteReward(reward.id)">
                        Supprimer
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="divider">Ajouter une recompense</div>

            <div class="space-y-2">
              <div class="flex gap-2 flex-wrap">
                <input
                  type="text"
                  class="input input-bordered flex-1"
                  v-model="newReward.name"
                  placeholder="Nom de la recompense"
                />
                <input
                  type="number"
                  class="input input-bordered w-24"
                  v-model.number="newReward.cost"
                  placeholder="Cout"
                />
              </div>
              <div class="flex gap-2">
                <input
                  type="text"
                  class="input input-bordered flex-1"
                  v-model="newReward.description"
                  placeholder="Description (optionnel)"
                />
                <button
                  class="btn btn-primary"
                  @click="addReward"
                  :disabled="!newReward.name || !newReward.cost"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>

        <button class="btn btn-ghost w-full" @click="logout">Deconnexion</button>
      </div>
    </template>
  </main>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Line, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, LineElement, BarElement, CategoryScale, LinearScale, PointElement)

const route = useRoute()
const code = route.params.code as string

const needsSetup = ref(false)
const setupPin = ref('')
const adminPin = ref('')
const isLoading = ref(false)
const loginError = ref('')
const isLoggedIn = ref(false)

const familyData = reactive({ id: 0, name: '', code: '' })
const children = ref<any[]>([])
const rewards = ref<any[]>([])
const pendingPurchases = ref<any[]>([])
const weekGrids = ref<any[]>([])

// Navigation semaines
const weekLabel = ref('')
const isCurrentWeek = ref(true)
const currentWeekParam = ref<string | null>(null)
const weekInfo = ref<any>(null)

// Stats
const stats = ref<any>(null)
const statsLoading = ref(false)

const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const newReward = reactive({ name: '', cost: 0, description: '' })

// Options graphiques
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const
    }
  }
}

// Couleurs pour les enfants
const childColors = [
  'rgb(255, 99, 132)',
  'rgb(54, 162, 235)',
  'rgb(255, 205, 86)',
  'rgb(75, 192, 192)',
  'rgb(153, 102, 255)',
  'rgb(255, 159, 64)'
]

// Graphique hebdomadaire
const weeklyChartData = computed(() => {
  if (!stats.value?.weeks?.length) return null

  const labels = stats.value.weeks.map((w: any) => w.label)
  const datasets = stats.value.children.map((child: any, index: number) => ({
    label: `${child.emoji} ${child.name}`,
    data: stats.value.weeks.map((w: any) => w.children[child.id] || 0),
    borderColor: childColors[index % childColors.length],
    backgroundColor: childColors[index % childColors.length].replace('rgb', 'rgba').replace(')', ', 0.5)'),
    tension: 0.3
  }))

  return { labels, datasets }
})

// Graphique mensuel
const monthlyChartData = computed(() => {
  if (!stats.value?.months?.length) return null

  return {
    labels: stats.value.months.map((m: any) => m.label),
    datasets: [{
      label: 'Total mensuel',
      data: stats.value.months.map((m: any) => m.shared),
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      borderColor: 'rgb(75, 192, 192)',
      borderWidth: 1
    }]
  }
})

// Computed pour le total de la semaine
const weekTotal = computed(() =>
  weekGrids.value.reduce((sum, entry) => sum + (entry.lives || 0), 0)
)

// Fonction pour obtenir les vies d'un jour/enfant
function getLives(dayIndex: number, childId: number): number {
  const entry = weekGrids.value.find(w => w.dayIndex === dayIndex && w.childId === childId)
  return entry?.lives || 0
}

// Incrementer les vies
async function incrementLives(dayIndex: number, childId: number, amount: number) {
  const currentLives = getLives(dayIndex, childId)
  const newLives = currentLives + amount

  // Mettre a jour localement
  const existing = weekGrids.value.find(w => w.dayIndex === dayIndex && w.childId === childId)
  if (existing) {
    existing.lives = newLives
  } else {
    weekGrids.value.push({ dayIndex, childId, lives: newLives })
  }

  // Sauvegarder sur le serveur
  try {
    await $fetch(`/api/family/${code}`, {
      method: 'POST',
      body: { weekGrids: weekGrids.value }
    })
  } catch (e) {
    console.error('Erreur sauvegarde vies:', e)
  }
}

// Decrementer les vies
async function decrementLives(dayIndex: number, childId: number) {
  const currentLives = getLives(dayIndex, childId)
  if (currentLives <= 0) return

  const newLives = currentLives - 1

  const existing = weekGrids.value.find(w => w.dayIndex === dayIndex && w.childId === childId)
  if (existing) {
    existing.lives = newLives
  }

  try {
    await $fetch(`/api/family/${code}`, {
      method: 'POST',
      body: { weekGrids: weekGrids.value }
    })
  } catch (e) {
    console.error('Erreur sauvegarde vies:', e)
  }
}

// Cloturer la semaine
async function closeWeek() {
  if (!confirm('Cloturer la semaine et ajouter les points au total mensuel ?')) return

  try {
    const response = await $fetch(`/api/family/${code}/week/close`, {
      method: 'POST'
    }) as any
    alert(`Semaine cloturee ! ${response.weekTotal} points ajoutes. Total mensuel: ${response.monthTotal}`)
    weekGrids.value = []
  } catch (e: any) {
    alert(e.data?.message || 'Erreur')
  }
}

// Reinitialiser la semaine
async function resetWeek() {
  if (!confirm('Reinitialiser la grille de la semaine ?')) return

  weekGrids.value = []
  try {
    await $fetch(`/api/family/${code}`, {
      method: 'POST',
      body: { weekGrids: [] }
    })
  } catch (e) {
    console.error('Erreur reset semaine:', e)
  }
}

// Navigation entre semaines
async function loadWeekData(weekParam?: string) {
  try {
    const url = weekParam
      ? `/api/family/${code}?week=${weekParam}`
      : `/api/family/${code}`
    const family = await $fetch(url) as any

    weekGrids.value = family.weekGrids || []
    if (family.weekInfo) {
      weekInfo.value = family.weekInfo
      weekLabel.value = family.weekInfo.weekLabel
      isCurrentWeek.value = family.weekInfo.isCurrentWeek
      currentWeekParam.value = family.weekInfo.weekStart
    }
  } catch (e) {
    console.error('Erreur chargement semaine:', e)
  }
}

async function goToPrevWeek() {
  if (weekInfo.value?.prevWeek) {
    await loadWeekData(weekInfo.value.prevWeek)
  }
}

async function goToNextWeek() {
  if (weekInfo.value?.canGoNext && weekInfo.value?.nextWeek) {
    await loadWeekData(weekInfo.value.nextWeek)
  }
}

async function goToCurrentWeek() {
  await loadWeekData()
}

// Charger les statistiques
async function loadStats() {
  statsLoading.value = true
  try {
    stats.value = await $fetch(`/api/family/${code}/stats`)
  } catch (e) {
    console.error('Erreur chargement stats:', e)
  } finally {
    statsLoading.value = false
  }
}

onMounted(async () => {
  // Verifier si la famille a un admin PIN configure
  try {
    const family = await $fetch(`/api/family/${code}`) as any
    if (!family.adminPin) {
      needsSetup.value = true
    }
  } catch (e) {
    // Famille non trouvee
  }
})

async function setupAdmin() {
  if (setupPin.value.length !== 4) return

  isLoading.value = true
  try {
    await $fetch(`/api/family/${code}/admin/setup`, {
      method: 'POST',
      body: { adminPin: setupPin.value }
    })
    adminPin.value = setupPin.value
    needsSetup.value = false
    await login()
  } catch (e: any) {
    alert(e.data?.message || 'Erreur')
  } finally {
    isLoading.value = false
  }
}

async function login() {
  if (adminPin.value.length !== 4) return

  isLoading.value = true
  loginError.value = ''

  try {
    const response = await $fetch(`/api/family/${code}/admin/login`, {
      method: 'POST',
      body: { pin: adminPin.value }
    }) as any

    familyData.id = response.family.id
    familyData.name = response.family.name
    familyData.code = response.family.code
    children.value = response.children
    rewards.value = response.rewards
    pendingPurchases.value = response.pendingPurchases
    weekGrids.value = response.weekGrids || []

    // Charger les infos de semaine
    if (response.weekInfo) {
      weekInfo.value = response.weekInfo
      weekLabel.value = response.weekInfo.weekLabel
      isCurrentWeek.value = response.weekInfo.isCurrentWeek
    } else {
      // Charger les infos de semaine separement
      await loadWeekData()
    }

    isLoggedIn.value = true

    // Charger les stats
    loadStats()
  } catch (e: any) {
    loginError.value = e.data?.message || 'Erreur de connexion'
  } finally {
    isLoading.value = false
  }
}

async function approvePurchase(purchaseId: number, action: string) {
  try {
    await $fetch(`/api/family/${code}/purchases/${purchaseId}/approve`, {
      method: 'POST',
      body: { adminPin: adminPin.value, action }
    })
    pendingPurchases.value = pendingPurchases.value.filter(p => p.id !== purchaseId)

    // Recharger les enfants pour mettre a jour les points
    const response = await $fetch(`/api/family/${code}/admin/login`, {
      method: 'POST',
      body: { pin: adminPin.value }
    }) as any
    children.value = response.children
  } catch (e: any) {
    alert(e.data?.message || 'Erreur')
  }
}

async function updateChildPoints(child: any, event: Event) {
  const input = event.target as HTMLInputElement
  const newPoints = parseInt(input.value) || 0

  try {
    await $fetch(`/api/family/${code}`, {
      method: 'POST',
      body: {
        children: [{ ...child, points: newPoints }]
      }
    })
    child.points = newPoints
  } catch (e) {
    console.error(e)
  }
}

async function updateChildPin(child: any, event: Event) {
  const input = event.target as HTMLInputElement
  const newPin = input.value

  if (newPin.length !== 4 && newPin.length !== 0) {
    alert('Le PIN doit contenir 4 chiffres')
    input.value = child.pin || ''
    return
  }

  try {
    await $fetch(`/api/family/${code}/child/${child.id}/setpin`, {
      method: 'POST',
      body: { pin: newPin, adminPin: adminPin.value }
    })
    child.pin = newPin
  } catch (e: any) {
    alert(e.data?.message || 'Erreur')
    input.value = child.pin || ''
  }
}

async function addPoints(child: any, amount: number) {
  const newPoints = (child.points || 0) + amount
  try {
    await $fetch(`/api/family/${code}`, {
      method: 'POST',
      body: {
        children: [{ ...child, points: newPoints }]
      }
    })
    child.points = newPoints
  } catch (e) {
    console.error(e)
  }
}

async function addReward() {
  if (!newReward.name || !newReward.cost) return

  try {
    const reward = await $fetch(`/api/family/${code}/rewards/add`, {
      method: 'POST',
      body: {
        name: newReward.name,
        cost: newReward.cost,
        description: newReward.description || null,
        adminPin: adminPin.value
      }
    })
    rewards.value.push(reward)
    newReward.name = ''
    newReward.cost = 0
    newReward.description = ''
  } catch (e: any) {
    alert(e.data?.message || 'Erreur')
  }
}

async function deleteReward(rewardId: number) {
  if (!confirm('Supprimer cette recompense ?')) return

  try {
    await $fetch(`/api/family/${code}/rewards/${rewardId}`, {
      method: 'DELETE',
      body: { adminPin: adminPin.value }
    })
    rewards.value = rewards.value.filter(r => r.id !== rewardId)
  } catch (e: any) {
    alert(e.data?.message || 'Erreur')
  }
}

function logout() {
  isLoggedIn.value = false
  adminPin.value = ''
}
</script>

<style>
.wrap {
  min-height: 100vh;
  padding: 1rem 1.25rem;
}
</style>
