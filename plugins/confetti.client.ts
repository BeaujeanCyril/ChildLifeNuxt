import { defineNuxtPlugin } from 'nuxt/app'
import confetti from 'canvas-confetti'

export default defineNuxtPlugin(() => {
    return { provide: { confetti } }
})
