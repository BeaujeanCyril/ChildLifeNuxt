<script setup lang="ts">
defineProps<{ tiers: { id?: number; threshold: number; reward: string }[]; total: number }>()
</script>

<template>
  <div class="tiers">
    <div v-for="t in tiers" :key="t.id || t.threshold" class="tier" :class="{ ok: total >= t.threshold }">
      <div class="badge">{{ t.threshold }}</div>
      <div class="label">{{ t.reward || '—' }}</div>
      <div class="state">{{ total >= t.threshold ? 'Atteint' : 'En cours' }}</div>
    </div>
  </div>
</template>

<style scoped>
.tiers{ display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:.6rem; }
.tier{ display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:.6rem; padding:.6rem .8rem; border:2px dashed #cfd8ff; border-radius:14px; background:#fff; box-shadow:0 3px 0 #eef3ff; }
.tier.ok{ border-style:solid; border-color:#62d26f; background:linear-gradient(0deg,#f0fff4,#ffffff); box-shadow:0 3px 0 #c9f2cf; }
.badge{ background:#7aa2ff; color:#fff; font-weight:700; padding:.2rem .55rem; border-radius:999px; box-shadow:0 2px 0 #4c79e6; }
.tier.ok .badge{ background:#2bb673; box-shadow:0 2px 0 #1f8e58; }
.label{ font-weight:600; color:#253051; }
.state{ font-size:.8rem; opacity:.75; }
</style>
