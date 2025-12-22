<template>
  <main class="wrap">
    <!-- Header -->
    <header class="text-center my-8">
      <h1 class="text-4xl font-black tracking-widest mb-2">
        <span class="text-primary drop-shadow">MISSION COOP</span>
      </h1>
      <p class="opacity-70">Étoiles partagées - Paliers mensuels</p>
    </header>

    <div class="max-w-md mx-auto space-y-6">
      <!-- Créer une famille -->
      <section class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-2xl">Créer une famille</h2>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Nom de la famille</span>
            </label>
            <input
              type="text"
              v-model="familyName"
              class="input input-bordered"
              placeholder="Ex: Famille Dupont"
            />
          </div>

          <div class="divider">Enfants</div>

          <div v-for="(child, i) in newChildren" :key="i" class="flex gap-2 items-center">
            <button class="btn btn-circle btn-sm" @click="pickEmoji(i)">{{ child.emoji }}</button>
            <input
              type="text"
              v-model="child.name"
              class="input input-bordered flex-1"
              :placeholder="'Prénom enfant ' + (i + 1)"
            />
            <button
              v-if="newChildren.length > 1"
              class="btn btn-error btn-sm btn-circle"
              @click="removeChild(i)"
            >x</button>
          </div>

          <button class="btn btn-ghost btn-sm mt-2" @click="addChild">
            + Ajouter un enfant
          </button>

          <div class="card-actions justify-end mt-4">
            <button
              class="btn btn-primary"
              @click="createFamily"
              :disabled="isCreating || !familyName.trim()"
            >
              <span v-if="isCreating" class="loading loading-spinner loading-sm"></span>
              Créer la famille
            </button>
          </div>

          <div v-if="createError" class="alert alert-error mt-2">
            {{ createError }}
          </div>
        </div>
      </section>

      <!-- Rejoindre une famille -->
      <section class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-2xl">Rejoindre une famille</h2>
          <p class="opacity-70">Entrez le code à 6 caractères de votre famille</p>

          <div class="form-control">
            <input
              type="text"
              v-model="joinCode"
              class="input input-bordered text-center text-2xl tracking-widest uppercase"
              placeholder="ABC123"
              maxlength="6"
              @keyup.enter="joinFamily"
            />
          </div>

          <div class="card-actions justify-end mt-2">
            <button
              class="btn btn-secondary"
              @click="joinFamily"
              :disabled="isJoining || joinCode.length !== 6"
            >
              <span v-if="isJoining" class="loading loading-spinner loading-sm"></span>
              Rejoindre
            </button>
          </div>

          <div v-if="joinError" class="alert alert-error mt-2">
            {{ joinError }}
          </div>
        </div>
      </section>
    </div>

    <!-- Emoji Picker Modal -->
    <dialog ref="emojiModal" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Choisir un emoji</h3>
        <div class="grid grid-cols-8 gap-2">
          <button
            v-for="emoji in emojis"
            :key="emoji"
            class="btn btn-ghost text-2xl"
            @click="selectEmoji(emoji)"
          >
            {{ emoji }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>fermer</button>
      </form>
    </dialog>
  </main>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Create family
const familyName = ref('')
const newChildren = reactive([
  { name: '', emoji: '🦊' },
  { name: '', emoji: '🐼' }
])
const isCreating = ref(false)
const createError = ref('')

// Join family
const joinCode = ref('')
const isJoining = ref(false)
const joinError = ref('')

// Emoji picker
const emojiModal = ref<HTMLDialogElement | null>(null)
const selectedChildIndex = ref(0)
const emojis = [
  '🦊', '🐼', '🦁', '🐯', '🐰', '🐻', '🐨', '🐸',
  '🦄', '🐶', '🐱', '🐵', '🦋', '🐢', '🦖', '🐙',
  '🌟', '⭐', '🌈', '🎈', '🎀', '🎨', '⚽', '🎮'
]

function addChild() {
  newChildren.push({ name: '', emoji: '🦊' })
}

function removeChild(index: number) {
  newChildren.splice(index, 1)
}

function pickEmoji(index: number) {
  selectedChildIndex.value = index
  emojiModal.value?.showModal()
}

function selectEmoji(emoji: string) {
  newChildren[selectedChildIndex.value].emoji = emoji
  emojiModal.value?.close()
}

async function createFamily() {
  if (!familyName.value.trim()) return

  const validChildren = newChildren.filter(c => c.name.trim())
  if (validChildren.length === 0) {
    createError.value = 'Ajoutez au moins un enfant avec un prénom'
    return
  }

  isCreating.value = true
  createError.value = ''

  try {
    const family = await $fetch('/api/family/create', {
      method: 'POST',
      body: {
        name: familyName.value.trim(),
        children: validChildren.map(c => ({
          name: c.name.trim(),
          emoji: c.emoji
        }))
      }
    }) as { code: string }

    router.push('/family/' + family.code)
  } catch (e: any) {
    createError.value = e.data?.message || 'Erreur lors de la création'
  } finally {
    isCreating.value = false
  }
}

async function joinFamily() {
  if (joinCode.value.length !== 6) return

  isJoining.value = true
  joinError.value = ''

  const code = joinCode.value.toUpperCase()

  try {
    await $fetch('/api/family/' + code)
    router.push('/family/' + code)
  } catch (e: any) {
    if (e.status === 404) {
      joinError.value = 'Famille non trouvée. Vérifiez le code.'
    } else {
      joinError.value = e.data?.message || 'Erreur lors de la recherche'
    }
  } finally {
    isJoining.value = false
  }
}
</script>

<style>
.wrap {
  min-height: 100vh;
  padding: 1rem 1.25rem;
}
</style>
