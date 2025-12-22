<template>
  <main class="wrap">
    <header class="text-center my-6">
      <NuxtLink :to="'/family/' + code" class="btn btn-ghost btn-sm mb-2">← Retour</NuxtLink>
      <h1 class="text-3xl font-black">
        <span class="text-primary">Mon espace</span>
      </h1>
    </header>

    <!-- Login -->
    <div v-if="!isLoggedIn" class="max-w-sm mx-auto">
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Connexion enfant</h2>
          <p class="opacity-70">Entre ton code PIN</p>

          <div class="flex justify-center gap-2 my-4">
            <input
              v-for="i in 4"
              :key="i"
              type="text"
              maxlength="1"
              class="input input-bordered w-14 h-14 text-center text-2xl"
              :ref="el => pinInputs[i-1] = el"
              @input="handlePinInput($event, i-1)"
              @keydown.backspace="handleBackspace($event, i-1)"
            />
          </div>

          <div v-if="loginError" class="alert alert-error">{{ loginError }}</div>

          <button
            class="btn btn-primary"
            @click="login"
            :disabled="pin.length !== 4 || isLoading"
          >
            <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
            Entrer
          </button>
        </div>
      </div>
    </div>

    <!-- Dashboard enfant -->
    <template v-else>
      <div class="max-w-lg mx-auto space-y-6">
        <!-- Profil -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body text-center">
            <div class="text-6xl mb-2">{{ childData.emoji }}</div>
            <h2 class="text-2xl font-bold">{{ childData.name }}</h2>
            <div class="stat">
              <div class="stat-title">Mes points</div>
              <div class="stat-value text-primary">{{ childData.points }}</div>
            </div>
          </div>
        </div>

        <!-- Recompenses disponibles -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Recompenses disponibles</h2>

            <div v-if="rewards.length === 0" class="text-center py-4 opacity-70">
              Aucune recompense disponible pour le moment
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="reward in rewards"
                :key="reward.id"
                class="flex items-center justify-between p-3 bg-base-100 rounded-lg"
              >
                <div>
                  <div class="font-bold">{{ reward.name }}</div>
                  <div v-if="reward.description" class="text-sm opacity-70">{{ reward.description }}</div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="badge badge-primary">{{ reward.cost }} pts</span>
                  <button
                    class="btn btn-sm btn-success"
                    :disabled="childData.points < reward.cost || purchasing"
                    @click="purchaseReward(reward)"
                  >
                    Choisir
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Historique -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Mes demandes</h2>

            <div v-if="purchases.length === 0" class="text-center py-4 opacity-70">
              Aucune demande
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="purchase in purchases"
                :key="purchase.id"
                class="flex items-center justify-between p-2 bg-base-100 rounded"
              >
                <div>
                  <span class="font-medium">{{ purchase.reward.name }}</span>
                  <span class="text-sm opacity-70 ml-2">-{{ purchase.pointsSpent }} pts</span>
                </div>
                <span :class="statusClass(purchase.status)">
                  {{ statusLabel(purchase.status) }}
                </span>
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
import { ref, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const code = route.params.code as string

const pin = ref('')
const pinInputs = ref<(HTMLInputElement | null)[]>([])
const isLoading = ref(false)
const loginError = ref('')
const isLoggedIn = ref(false)
const purchasing = ref(false)

const childData = reactive({
  id: 0,
  name: '',
  emoji: '',
  points: 0
})

const rewards = ref<any[]>([])
const purchases = ref<any[]>([])

function handlePinInput(event: Event, index: number) {
  const input = event.target as HTMLInputElement
  const value = input.value.replace(/\D/g, '')
  input.value = value

  // Update pin
  const pinArray = pin.value.split('')
  pinArray[index] = value
  pin.value = pinArray.join('').slice(0, 4)

  // Move to next input
  if (value && index < 3) {
    pinInputs.value[index + 1]?.focus()
  }
}

function handleBackspace(event: KeyboardEvent, index: number) {
  const input = event.target as HTMLInputElement
  if (!input.value && index > 0) {
    pinInputs.value[index - 1]?.focus()
  }
}

async function login() {
  if (pin.value.length !== 4) return

  isLoading.value = true
  loginError.value = ''

  try {
    const response = await $fetch(`/api/family/${code}/child/login`, {
      method: 'POST',
      body: { pin: pin.value }
    }) as any

    childData.id = response.child.id
    childData.name = response.child.name
    childData.emoji = response.child.emoji
    childData.points = response.child.points
    rewards.value = response.rewards
    purchases.value = response.purchases
    isLoggedIn.value = true
  } catch (e: any) {
    loginError.value = e.data?.message || 'Erreur de connexion'
    pin.value = ''
    pinInputs.value.forEach(input => {
      if (input) input.value = ''
    })
    pinInputs.value[0]?.focus()
  } finally {
    isLoading.value = false
  }
}

async function purchaseReward(reward: any) {
  if (childData.points < reward.cost) return

  purchasing.value = true
  try {
    const response = await $fetch(`/api/family/${code}/child/${childData.id}/purchase`, {
      method: 'POST',
      body: { rewardId: reward.id }
    }) as any

    childData.points = response.newPoints
    purchases.value.unshift(response.purchase)
  } catch (e: any) {
    alert(e.data?.message || 'Erreur')
  } finally {
    purchasing.value = false
  }
}

function logout() {
  isLoggedIn.value = false
  pin.value = ''
  pinInputs.value.forEach(input => {
    if (input) input.value = ''
  })
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'En attente',
    approved: 'Approuve',
    rejected: 'Refuse',
    claimed: 'Recupere'
  }
  return labels[status] || status
}

function statusClass(status: string) {
  const classes: Record<string, string> = {
    pending: 'badge badge-warning',
    approved: 'badge badge-success',
    rejected: 'badge badge-error',
    claimed: 'badge badge-info'
  }
  return classes[status] || 'badge'
}
</script>

<style>
.wrap {
  min-height: 100vh;
  padding: 1rem 1.25rem;
}
</style>
