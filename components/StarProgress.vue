<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ value: number; max: number }>()
const pct = computed(() => Math.min(100, Math.round((props.value / Math.max(1, props.max)) * 100)))
const filled = computed(() => Math.round((pct.value / 100) * 5))
</script>


<template>
  <div class="sp">
    <div class="sp-track">
      <div class="sp-fill" :style="{ width: pct + '%' }" />
      <div class="sp-stars">
        <span v-for="i in 5" :key="i" class="star" :class="{ on: i <= filled }">★</span>
      </div>
    </div>
    <div class="sp-label">{{ value }} / {{ max }} ({{ pct }}%)</div>
  </div>
</template>


<style scoped>
.sp { display:grid; gap:.4rem; }
.sp-track{ position:relative; height:22px; background:linear-gradient(90deg,#fff 0,#f5f7ff 100%); border:2px solid #7aa2ff; border-radius:14px; overflow:hidden; box-shadow:0 2px 0 #cfe0ff inset; }
.sp-fill{ position:absolute; inset:0 0 0 0; width:0; background:repeating-linear-gradient(45deg,#ffd54f 0 12px,#ffe082 12px 24px); transition:width .6s cubic-bezier(.2,.8,.2,1); box-shadow:0 0 10px rgba(255,208,0,.6) inset; }
.sp-stars{ position:absolute; inset:0; display:flex; align-items:center; justify-content:space-between; padding:0 .6rem; pointer-events:none; }
.star{ font-size:16px; opacity:.35; filter:drop-shadow(0 1px 0 #fff); }
.star.on{ opacity:1; color:#ffb300; animation:pop .3s ease; }
@keyframes pop{ 0%{ transform:scale(.6) } 100%{ transform:scale(1) } }
.sp-label{ font-size:.8rem; color:#324; }
</style>