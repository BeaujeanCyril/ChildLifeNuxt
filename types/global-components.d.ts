declare module 'vue' {
    export interface GlobalComponents {
        NuxtLayout: typeof import('nuxt/dist/app/components/nuxt-layout')['default']
        NuxtPage: typeof import('nuxt/dist/app/components/nuxt-page')['default']
    }
}
export {}
