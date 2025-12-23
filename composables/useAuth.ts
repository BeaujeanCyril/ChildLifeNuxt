import Keycloak from 'keycloak-js'

const keycloakConfig = {
  url: 'https://auth.cyriongames.fr',
  realm: 'cyriongames',
  clientId: 'childlife'
}

let keycloakInstance: Keycloak | null = null

export const useAuth = () => {
  const isAuthenticated = useState<boolean>('isAuthenticated', () => false)
  const user = useState<{ name: string; email: string } | null>('user', () => null)
  const isLoading = useState<boolean>('authLoading', () => true)
  const hasAccess = useState<boolean>('hasAccess', () => false)

  const initKeycloak = async () => {
    if (typeof window === 'undefined') {
      isLoading.value = false
      return
    }

    if (!keycloakInstance) {
      keycloakInstance = new Keycloak(keycloakConfig)
    }

    try {
      const authenticated = await keycloakInstance.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        checkLoginIframe: false
      })

      isAuthenticated.value = authenticated

      if (authenticated && keycloakInstance.tokenParsed) {
        user.value = {
          name: keycloakInstance.tokenParsed.preferred_username || keycloakInstance.tokenParsed.name || 'Utilisateur',
          email: keycloakInstance.tokenParsed.email || ''
        }

        // Vérifier l'accès à cette app
        const isSuperAdmin = keycloakInstance.hasRealmRole('superadmin')
        const hasAppRole = keycloakInstance.hasRealmRole('childlife.access')
        hasAccess.value = isSuperAdmin || hasAppRole
      }
    } catch (error) {
      console.error('Keycloak init error:', error)
      isAuthenticated.value = false
      hasAccess.value = false
    } finally {
      isLoading.value = false
    }
  }

  const login = () => {
    if (keycloakInstance) {
      keycloakInstance.login()
    }
  }

  const logout = () => {
    if (keycloakInstance) {
      keycloakInstance.logout({ redirectUri: 'https://cyriongames.fr' })
    }
  }

  const redirectToPortal = () => {
    window.location.href = 'https://cyriongames.fr'
  }

  return {
    isAuthenticated: readonly(isAuthenticated),
    user: readonly(user),
    isLoading: readonly(isLoading),
    hasAccess: readonly(hasAccess),
    initKeycloak,
    login,
    logout,
    redirectToPortal
  }
}
