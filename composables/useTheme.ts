import { useState } from 'nuxt/app'
import { watch, onMounted } from 'vue'

export const useTheme = () => {
  const theme = useState<string>('theme', () => 'cyberpunk')

  // Appliquer le theme au document HTML
  function applyTheme(themeName: string) {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', themeName)
      localStorage.setItem('theme', themeName)
    }
  }

  // Charger le theme sauvegarde
  onMounted(() => {
    if (typeof localStorage !== 'undefined') {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) {
        theme.value = savedTheme
      }
    }
    applyTheme(theme.value)
  })

  // Appliquer quand le theme change
  watch(theme, (newTheme) => {
    applyTheme(newTheme)
  })

  return { theme }
}
