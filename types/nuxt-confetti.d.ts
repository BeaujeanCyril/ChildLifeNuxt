import type confetti from 'canvas-confetti'
declare module 'nuxt/app' {
    interface NuxtApp { $confetti: typeof confetti }
}
declare module 'vue' {
    interface ComponentCustomProperties { $confetti: typeof confetti }
}
export {}
