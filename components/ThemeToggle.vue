<template>
  <div class="dropdown dropdown-end">
    <label tabindex="0" class="btn btn-ghost btn-circle">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    </label>
    <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow-lg bg-base-200 rounded-box w-52 mt-2">
      <li v-for="t in themes" :key="t.value">
        <button
          @click="setTheme(t.value)"
          :class="{ 'active': theme === t.value }"
        >
          {{ t.label }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '~/composables/useTheme'

const { theme } = useTheme()

const themes = [
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
  { value: 'cyberpunk', label: 'Cyberpunk' },
  { value: 'cupcake', label: 'Cupcake' },
  { value: 'forest', label: 'Forest' },
  { value: 'synthwave', label: 'Synthwave' },
  { value: 'retro', label: 'Retro' },
  { value: 'valentine', label: 'Valentine' },
  { value: 'aqua', label: 'Aqua' }
]

function setTheme(newTheme: string) {
  theme.value = newTheme
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }
}
</script>
