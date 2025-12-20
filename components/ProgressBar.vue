<script setup lang="ts">
import { computed } from 'vue'   // ← ajout
const props = defineProps<{ value: number; max: number }>()
const pct = computed(() => {
  const m = Math.max(1, props.max)
  return Math.min(100, Math.round((props.value / m) * 100))
})
</script>


<template>
  <div style="width:100%;height:12px;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
    <div :style="{ height:'100%', width: pct + '%', background:'#cfe3ff' }" />
  </div>
</template>