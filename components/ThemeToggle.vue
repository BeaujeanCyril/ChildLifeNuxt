<template>
  <div class="dropdown dropdown-end">
    <label tabindex="0" class="btn btn-ghost btn-sm gap-1">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
      <span class="hidden sm:inline text-xs">Theme</span>
    </label>
    <ul tabindex="0" class="dropdown-content z-[50] menu p-2 shadow-lg bg-base-200 rounded-box w-56 mt-2 max-h-80 overflow-y-auto">
      <li v-for="t in themes" :key="t.value">
        <button
          @click="setTheme(t.value)"
          class="flex items-center gap-2"
          :class="{ 'active': theme === t.value }"
        >
          <span>{{ t.emoji }}</span>
          <span>{{ t.label }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '~/composables/useTheme'

const { theme } = useTheme()

const themes = [
  { value: 'cupcake', label: 'Cupcake', emoji: '🧁' },
  { value: 'bumblebee', label: 'Abeille', emoji: '🐝' },
  { value: 'emerald', label: 'Emeraude', emoji: '💎' },
  { value: 'valentine', label: 'Amour', emoji: '💕' },
  { value: 'garden', label: 'Jardin', emoji: '🌸' },
  { value: 'aqua', label: 'Ocean', emoji: '🌊' },
  { value: 'pastel', label: 'Pastel', emoji: '🎨' },
  { value: 'fantasy', label: 'Fantaisie', emoji: '🦄' },
  { value: 'lemonade', label: 'Citronnade', emoji: '🍋' },
  { value: 'autumn', label: 'Automne', emoji: '🍂' },
  { value: 'winter', label: 'Hiver', emoji: '❄️' },
  { value: 'forest', label: 'Foret', emoji: '🌲' },
  { value: 'retro', label: 'Retro', emoji: '📺' },
  { value: 'synthwave', label: 'Synthwave', emoji: '🌆' },
  { value: 'cyberpunk', label: 'Cyberpunk', emoji: '🤖' },
  { value: 'dracula', label: 'Vampire', emoji: '🧛' },
  { value: 'halloween', label: 'Halloween', emoji: '🎃' },
  { value: 'coffee', label: 'Cafe', emoji: '☕' },
  { value: 'nord', label: 'Nord', emoji: '🏔️' },
  { value: 'sunset', label: 'Coucher de soleil', emoji: '🌅' },
  { value: 'light', label: 'Clair', emoji: '☀️' },
  { value: 'dark', label: 'Sombre', emoji: '🌙' }
]

function setTheme(newTheme: string) {
  theme.value = newTheme
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }
}
</script>
