<template>
  <main class="wrap">
    <!-- Header -->
    <header class="text-center my-6">
      <div class="flex items-center justify-center gap-2 mb-2">
        <NuxtLink to="/" class="btn btn-ghost btn-sm">← Accueil</NuxtLink>
      </div>
      <h1 class="text-4xl font-black tracking-widest">
        <span class="text-primary drop-shadow">Famille {{ state.name || '' }}</span>
      </h1>
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
      <!-- Cartes enfants (lecture seule) -->
      <section class="cards">
        <div v-for="child in state.children" :key="child.id" class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <div class="card-title flex items-center gap-3">
              <span class="avatar bg-base-100 text-2xl p-2 rounded-lg">{{ child.emoji }}</span>
              <div class="flex flex-col">
                <span class="text-xl">{{ child.name }}</span>
                <span class="text-sm badge badge-primary">{{ child.points || 0 }} pts</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Tableau semaine (lecture seule) -->
      <section class="my-4">
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <h2 class="card-title">Semaine en cours</h2>
              <div class="badge badge-accent">Total semaine : {{ weekTotal }}</div>
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
                      <span class="badge badge-lg" :class="getLives(dayIndex, child.id) > 0 ? 'badge-success' : 'badge-ghost'">
                        {{ getLives(dayIndex, child.id) }}
                      </span>
                    </td>
                    <td class="font-extrabold">
                      {{ getDayTotal(dayIndex) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <!-- Progression -->
      <section class="my-4">
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <h2 class="card-title">Progression</h2>
              <div class="badge badge-outline">Total : {{ state.monthProgress.shared }}</div>
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

      <!-- Liste des récompenses (lecture seule) -->
      <section class="my-4">
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Paliers de récompenses</h2>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Seuil</th>
                    <th>Récompense</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="tier in sortedTiers" :key="tier.id">
                    <td class="font-bold">{{ tier.threshold }}</td>
                    <td>{{ tier.reward }}</td>
                    <td>
                      <span v-if="state.monthProgress.shared >= tier.threshold" class="badge badge-success">Débloqué</span>
                      <span v-else class="badge badge-ghost">{{ tier.threshold - state.monthProgress.shared }} restants</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </template>
  </main>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import StarProgress from "~/components/StarProgress.vue"
import RewardTiers from "~/components/RewardTiers.vue"
import { useFamilyState } from '~/composables/useFamilyState'

const route = useRoute()
const code = route.params.code as string

const {
  state,
  isLoading,
  error,
  sortedTiers,
  nextTier,
  nextTierThreshold,
  weekTotal,
  getLives
} = useFamilyState(code)

const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function getDayTotal(dayIndex: number): number {
  return state.children.reduce((sum, child) => sum + getLives(dayIndex, child.id), 0)
}
</script>

<style>
* { box-sizing: border-box; }
.wrap { min-height: 100vh; padding: 1rem 1.25rem; }
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
