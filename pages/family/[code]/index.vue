<template>
  <main class="wrap">
    <!-- Header -->
    <header class="text-center my-6">
      <div class="flex items-center justify-center gap-2 mb-2">
        <NuxtLink to="/" class="btn btn-ghost btn-sm">← Accueil</NuxtLink>
      </div>
      <h1 class="text-4xl font-black tracking-widest">
        <span class="text-primary drop-shadow">{{ state.name || 'MISSION COOP' }}</span>
      </h1>
      <p class="opacity-70">
        Code famille: <span class="kbd kbd-sm">{{ state.code }}</span>
      </p>
      <div class="flex justify-center gap-2 mt-4">
        <NuxtLink :to="`/family/${code}/child`" class="btn btn-secondary btn-sm">
          Espace Enfant
        </NuxtLink>
        <NuxtLink :to="`/family/${code}/admin`" class="btn btn-accent btn-sm">
          Administration
        </NuxtLink>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="max-w-md mx-auto">
      <div class="alert alert-error">
        {{ error }}
      </div>
      <div class="text-center mt-4">
        <NuxtLink to="/" class="btn btn-primary">Retour à l'accueil</NuxtLink>
      </div>
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
        <div v-for="child in state.children" :key="child.id" class="card bg-base-200 shadow-xl">
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
              <div class="badge badge-accent">Total semaine: {{ weekTotal }}</div>
            </div>

            <div class="overflow-x-auto">
              <table class="table table-zebra w-full mt-2">
                <thead>
                  <tr>
                    <th>Jour</th>
                    <th v-for="child in state.children" :key="child.id">{{ child.name }}</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(label, dayIndex) in days" :key="dayIndex">
                    <td class="font-bold">{{ label }}</td>
                    <td v-for="child in state.children" :key="child.id">
                      <input
                        type="number"
                        class="input input-bordered w-20"
                        :value="getLives(dayIndex, child.id)"
                        @change="(e) => setLives(dayIndex, child.id, parseInt((e.target as HTMLInputElement).value) || 0)"
                        min="0"
                        :max="state.config.dailyMaxLives"
                      />
                    </td>
                    <td class="font-extrabold">
                      {{ getDayTotal(dayIndex) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

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
              <div class="badge badge-outline">Total: {{ state.monthProgress.shared }}</div>
            </div>

            <StarProgress :value="state.monthProgress.shared" :max="nextTierThreshold || state.monthProgress.shared || 1" />

            <div class="mt-2 opacity-70">
              <template v-if="nextTier">
                Prochain palier à <span class="kbd kbd-md">{{ nextTier.threshold }}</span> — « {{ nextTier.reward }} »
              </template>
              <template v-else>
                Tous les paliers atteints !
              </template>
            </div>

            <RewardTiers :tiers="sortedTiers" :total="state.monthProgress.shared" />
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
                      <button class="btn btn-error btn-sm" @click="removeTier(tier.id)">x</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="flex gap-2 mt-4">
              <input type="number" class="input input-bordered w-24" v-model.number="newTierData.threshold" placeholder="Seuil" />
              <input type="text" class="input input-bordered flex-1" v-model="newTierData.reward" placeholder="Récompense" />
              <button class="btn btn-primary" @click="handleAddTier">Ajouter</button>
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
                <input type="number" step="0.1" v-model.number="state.config.scale" class="input input-bordered w-24" />
              </label>
              <label class="form-control">
                <span class="label-text">Bonus week-end</span>
                <input type="number" v-model.number="state.config.weekendBonus" class="input input-bordered w-24" />
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
import { useRoute } from 'vue-router'
import { useNuxtApp } from 'nuxt/app'
import StarProgress from "~/components/StarProgress.vue"
import RewardTiers from "~/components/RewardTiers.vue"
import { useTheme } from '~/composables/useTheme'
import { useFamilyState } from '~/composables/useFamilyState'

const route = useRoute()
const code = route.params.code as string

const { theme } = useTheme()
const {
  state,
  isLoading,
  error,
  sortedTiers,
  nextTier,
  nextTierThreshold,
  weekTotal,
  setLives,
  getLives,
  closeWeek,
  resetWeek,
  updateChild,
  updateTier,
  addTier,
  removeTier
} = useFamilyState(code)

const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

// New tier form
const newTierData = reactive({ threshold: 0, reward: '' })

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

function getDayTotal(dayIndex: number): number {
  return state.children.reduce((sum, child) => sum + getLives(dayIndex, child.id), 0)
}

async function handleAddTier() {
  if (!newTierData.threshold || !newTierData.reward) return
  await addTier(newTierData.threshold, newTierData.reward)
  newTierData.threshold = 0
  newTierData.reward = ''
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
