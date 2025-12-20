<template>
  <main class="wrap">
    <!-- Header -->
    <header class="text-center my-6">
      <h1 class="text-4xl font-black tracking-widest">
        <span class="text-primary drop-shadow">MISSION COOP</span>
      </h1>
      <p class="opacity-70">Étoiles partagées • Paliers mensuels</p>
    </header>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <template v-else>
      <!-- DaisyUI Theme -->
      <div class="flex items-center gap-3 mb-4">
        <select class="select select-bordered w-56" v-model="theme">
          <option>synthwave</option>
          <option>cyberpunk</option>
          <option>halloween</option>
          <option>retro</option>
          <option>dracula</option>
        </select>
      </div>

      <!-- Cartes enfants -->
      <section class="cards">
        <div v-for="(child, i) in state.children" :key="child.id || i" class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <div class="card-title flex items-center gap-3">
              <span class="avatar bg-base-100 text-2xl p-2 rounded-lg">{{ child.emoji }}</span>
              <input v-model="child.name" class="input input-bordered w-full" @blur="updateChild(child)" />
            </div>
            <p class="opacity-70">Renseigne les vies jour par jour dans le tableau plus bas.</p>
          </div>
        </div>
      </section>

      <!-- Tableau semaine -->
      <section class="my-4">
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <h2 class="card-title">Semaine en cours</h2>
              <div class="badge badge-accent">Total semaine: {{ weekShared }}</div>
            </div>

            <table class="table table-zebra w-full mt-2">
              <thead>
              <tr>
                <th>Jour</th>
                <th>{{ state.children[0]?.name || 'Enfant 1' }}</th>
                <th>{{ state.children[1]?.name || 'Enfant 2' }}</th>
                <th>Total</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="(label, i) in days" :key="i">
                <td class="font-bold">{{ label }}</td>
                <td>
                  <input type="number"
                         class="input input-bordered w-24"
                         v-model.number="state.week.grid[i].child0"
                         @change="state.week.grid[i].child0 = clampWeekCell(state.week.grid[i].child0)" />
                </td>
                <td>
                  <input type="number"
                         class="input input-bordered w-24"
                         v-model.number="state.week.grid[i].child1"
                         @change="state.week.grid[i].child1 = clampWeekCell(state.week.grid[i].child1)" />
                </td>
                <td class="font-extrabold">
                  {{ (state.week.grid[i].child0 || 0) + (state.week.grid[i].child1 || 0) }}
                </td>
              </tr>
              </tbody>
            </table>

            <div class="card-actions justify-end">
              <button class="btn btn-primary" @click="handleCloseWeek">Clôturer la semaine</button>
              <button class="btn" @click="resetWeek">Réinitialiser</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Mois -->
      <section class="my-4">
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <h2 class="card-title">Compteur mensuel partagé</h2>
              <div class="badge badge-outline">Total: {{ state.month.shared }}</div>
            </div>

            <StarProgress :value="state.month.shared" :max="nextTierThreshold || state.month.shared || 1" />

            <div class="mt-2 opacity-70">
              <template v-if="nextTier">
                Prochain palier à <span class="kbd kbd-md">{{ nextTier.threshold }}</span> — « {{ nextTier.reward }} »
              </template>
              <template v-else>
                Tous les paliers atteints !
              </template>
            </div>

            <RewardTiers :tiers="sortedTiers" :total="state.month.shared" />

            <div class="card-actions justify-end">
              <button class="btn" @click="resetMonth">Réinit. mois</button>
              <button class="btn btn-error" @click="hardReset">Réinit. totale</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Gestion des récompenses -->
      <section class="my-4">
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Gestion des récompenses</h2>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <thead>
                <tr>
                  <th>Seuil</th>
                  <th>Récompense</th>
                  <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="tier in sortedTiers" :key="tier.id">
                  <td>
                    <input type="number" class="input input-bordered input-sm w-20"
                           v-model.number="tier.threshold" @blur="updateTier(tier)" />
                  </td>
                  <td>
                    <input type="text" class="input input-bordered input-sm w-full"
                           v-model="tier.reward" @blur="updateTier(tier)" />
                  </td>
                  <td>
                    <button class="btn btn-error btn-sm" @click="deleteTier(tier.id)">×</button>
                  </td>
                </tr>
                </tbody>
              </table>
            </div>

            <div class="flex gap-2 mt-4">
              <input type="number" class="input input-bordered w-24" v-model.number="newTier.threshold" placeholder="Seuil" />
              <input type="text" class="input input-bordered flex-1" v-model="newTier.reward" placeholder="Récompense" />
              <button class="btn btn-primary" @click="addTier">Ajouter</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Settings -->
      <section class="my-4">
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Réglages</h2>
            <div class="grid grid-cols-2 gap-3">
              <label class="form-control">
                <span class="label-text">Base / jour</span>
                <input type="number" v-model.number="state.config.dailyBaseLives" class="input input-bordered w-24" />
              </label>
              <label class="form-control">
                <span class="label-text">Max / jour</span>
                <input type="number" v-model.number="state.config.dailyMaxLives" class="input input-bordered w-24" />
              </label>
              <label class="form-control">
                <span class="label-text">Multiplicateur</span>
                <input type="number" step="0.1" v-model.number="settings.scale" class="input input-bordered w-24" />
              </label>
              <label class="form-control">
                <span class="label-text">Bonus week-end</span>
                <input type="number" v-model.number="settings.weekendBonus" class="input input-bordered w-24" />
              </label>
            </div>
          </div>
        </div>
      </section>
    </template>
  </main>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import StarProgress from "../components/StarProgress.vue"
import RewardTiers from "../components/RewardTiers.vue"
import { useNuxtApp } from 'nuxt/app'
import { useTheme } from '../composables/useTheme'
import { useChildLifeState } from '../composables/useChildLifeState'

const { theme } = useTheme()
const {
  state,
  settings,
  isLoading,
  sortedTiers,
  nextTier,
  nextTierThreshold,
  weekShared,
  clampWeekCell,
  closeWeek,
  resetWeek,
  resetMonth,
  hardReset
} = useChildLifeState()

const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

// New tier form
const newTier = reactive({ threshold: 0, reward: '' })

// Confetti via plugin canvas-confetti
const { $confetti } = useNuxtApp()

function celebrate() {
  $confetti({ particleCount: 80, spread: 70, startVelocity: 45, gravity: 1.05, ticks: 200, origin: { y: 0.2 } })
  setTimeout(() => $confetti({
    particleCount: 120,
    spread: 100,
    startVelocity: 55,
    gravity: 0.9,
    ticks: 220,
    origin: { y: 0.2 }
  }), 180)
  setTimeout(() => {
    $confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0 }, startVelocity: 45 })
    $confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1 }, startVelocity: 45 })
  }, 120)
}

async function handleCloseWeek() {
  const crossed = await closeWeek()
  if (crossed) celebrate()
}

async function updateChild(child: { id?: number; name: string; emoji: string }) {
  if (!child.id) return
  try {
    await $fetch(`/api/children/${child.id}`, {
      method: 'PUT',
      body: { name: child.name, emoji: child.emoji }
    })
  } catch (e) {
    console.error('Failed to update child:', e)
  }
}

async function updateTier(tier: { id?: number; threshold: number; reward: string }) {
  if (!tier.id) return
  try {
    await $fetch(`/api/tiers/${tier.id}`, {
      method: 'PUT',
      body: { threshold: tier.threshold, reward: tier.reward }
    })
  } catch (e) {
    console.error('Failed to update tier:', e)
  }
}

async function deleteTier(id?: number) {
  if (!id) return
  try {
    await $fetch(`/api/tiers/${id}`, { method: 'DELETE' })
    const idx = state.config.monthlyTiers.findIndex(t => t.id === id)
    if (idx !== -1) state.config.monthlyTiers.splice(idx, 1)
  } catch (e) {
    console.error('Failed to delete tier:', e)
  }
}

async function addTier() {
  if (!newTier.threshold || !newTier.reward) return
  try {
    const tier = await $fetch('/api/tiers/add', {
      method: 'POST',
      body: { threshold: newTier.threshold, reward: newTier.reward }
    }) as { id: number; threshold: number; reward: string; unlocked: boolean }
    state.config.monthlyTiers.push(tier)
    newTier.threshold = 0
    newTier.reward = ''
  } catch (e) {
    console.error('Failed to add tier:', e)
  }
}
</script>

<style>
* { box-sizing: border-box; }
.wrap { min-height: 100vh; padding: 1rem 1.25rem; }
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}
.avatar {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  font-size: 20px;
  border-radius: 12px;
}
</style>
