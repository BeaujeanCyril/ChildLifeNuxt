<template>
  <NuxtLayout>
    <div class="min-h-screen bg-base-100 text-base-content">
      <NuxtPage />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useTheme } from './composables/useTheme'
const { theme } = useTheme()

onMounted(() => {
  const saved = localStorage.getItem('theme')
  if (saved) theme.value = saved
})
</script>
