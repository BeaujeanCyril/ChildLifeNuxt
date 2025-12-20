import { useHead, useState } from 'nuxt/app'
import { watchEffect } from 'vue'
import {process} from "std-env";

export const useTheme = () => {
    const theme = useState<string>('theme', () => 'cyberpunk')

    watchEffect(() => {
        useHead({ htmlAttrs: { 'data-theme': theme.value } })
        if (process.client) localStorage.setItem('theme', theme.value)
    })

    return { theme }
}
