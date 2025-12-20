<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
const root = ref<HTMLDivElement|null>(null)
const emit = defineEmits<{ (e:'done'):void }>()
let timer:number|undefined

onMounted(() => {
  console.log('[Confetti] mounted')                 // ← DOIT apparaître en console
  if (!root.value) return
  const n = 120
  let maxDur = 0
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span')
    s.className = 'p d' + (1 + Math.floor(Math.random()*5))
    s.style.left = Math.random()*100 + '%'
    const dur = 2 + Math.random()*1.8
    maxDur = Math.max(maxDur, dur)
    s.style.animationDuration = dur + 's'
    const h = Math.floor(Math.random()*360)
    s.style.background = `hsl(${h} 95% 55%)`
    if (i % 3 === 0) { s.style.width = '14px'; s.style.height = '14px'; s.style.borderRadius = '50%' }
    if (i % 5 === 0) { s.style.width = '16px'; s.style.height = '8px' }
    root.value.appendChild(s)
  }
  timer = window.setTimeout(() => { emit('done'); root.value?.remove() }, (maxDur*1000)+400)
})

onBeforeUnmount(() => { if (timer) clearTimeout(timer) })
</script>

<template>
  <!-- overlay volontairement teinté pour vérification -->
  <div class="confetti" ref="root"><div class="bgcheck"></div></div>
</template>

<style scoped>
.confetti{ position:fixed; inset:0; z-index:99999; pointer-events:none; overflow:hidden; }
.bgcheck{ position:absolute; inset:0; background:rgba(0,0,0,.08); } /* ← doit VOIR un voile gris */
.p{ position:absolute; top:-12px; width:10px; height:12px; border-radius:2px;
  box-shadow:0 0 0 2px rgba(255,255,255,.35) inset;
  animation-name:fall,spin; animation-timing-function:ease-in,linear;
  animation-fill-mode:forwards; animation-iteration-count:1,infinite; }
@keyframes fall{ to{ transform:translateY(110vh); opacity:.95 } }
@keyframes spin{ from{ rotate:0deg } to{ rotate:720deg } }
.d1{ animation-name:fall,spin,drift1 } .d2{ animation-name:fall,spin,drift2 }
.d3{ animation-name:fall,spin,drift3 } .d4{ animation-name:fall,spin,drift4 }
.d5{ animation-name:fall,spin,drift5 }
@keyframes drift1{ to{ transform:translate(-80px,110vh) } }
@keyframes drift2{ to{ transform:translate( 60px,110vh) } }
@keyframes drift3{ to{ transform:translate(-120px,110vh) } }
@keyframes drift4{ to{ transform:translate(100px,110vh) } }
@keyframes drift5{ to{ transform:translate(-40px,110vh) } }
</style>
