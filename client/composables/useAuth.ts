import type { User } from '~/types/api'

interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

interface RegisterCredentials {
  email: string
  password: string
  name: string
}

interface AuthResponse {
  user: User
  token: string
}

export const useAuth = () => {
  const user = useState<User | null>('user', () => null)
  const token = useState<string | null>('token', () => null)
  const isLoading = useState<boolean>('auth-loading', () => false)
  const error = useState<string | null>('auth-error', () => null)
  const isInitialized = useState<boolean>('auth-initialized', () => false)

  // Check if user is authenticated
  const isAuthenticated = computed(() => !!user.value && !!token.value)

  // Initialize auth state
  const initAuth = async (): Promise<boolean> => {
    isLoading.value = true
    try {
      return await initSession()
    } catch (err) {
      console.error('Auth initialization failed:', err)
      return false
    } finally {
      isInitialized.value = true
      isLoading.value = false
    }
  }

  // Initialize session from stored token
  const initSession = async (): Promise<boolean> => {
    console.log('Initializing session...')
    
    // Clear any expired tokens
    if (process.client) {
      const tokenExpiry = localStorage.getItem('auth_token_expiry')
      if (tokenExpiry && new Date(tokenExpiry) < new Date()) {
        console.log('Clearing expired token')
        clearSession()
        return false
      }
    }

    // Skip token check during SSR
    if (!process.client) {
      console.log('Skipping session initialization during SSR')
      return false
    }

    try {
      const storedToken = localStorage.getItem('auth_token')
      if (!storedToken) {
        console.log('No stored token found')
        return false
      }

      console.log('Found stored token, attempting to refresh session')
      return await refreshSession()
    } catch (error) {
      console.error('Session initialization error:', error)
      if (process.client) {
        clearSession()
      }
      return false
    }
  }

  // Refresh session
  const refreshSession = async () => {
    console.log('Attempting to refresh session');
    try {
      const { data, error: apiError } = await useApiFetch<AuthResponse>('/api/auth/refresh', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (apiError.value) {
        console.error('Session refresh failed:', apiError.value);
        if (apiError.value.status === 401) {
          clearSession();
        } else if (apiError.value.status === 500) {
          console.error('Server configuration error during refresh');
        }
        throw new Error(apiError.value.data?.message || 'Session refresh failed');
      }

      if (data.value) {
        console.log('Session refresh successful');
        const { user: userData, token: authToken } = data.value;
        setSession(userData, authToken);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Session refresh error:', err);
      clearSession();
      throw new Error('Failed to refresh session');
    }
  }

  // Set session data
  const setSession = (userData: User, authToken: string) => {
    user.value = userData
    token.value = authToken
    if (process.client) {
      try {
        localStorage.setItem('auth_token', authToken)
        // Store token expiry (14 days from now)
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 14)
        localStorage.setItem('auth_token_expiry', expiryDate.toISOString())
        
        // Force update headers for immediate API access
        useApiFetch('/api/_', { method: 'HEAD' }) // Dummy request to update headers
      } catch (e) {
        console.error('Failed to store auth token:', e)
        clearSession()
        throw new Error('Failed to persist authentication')
      }
    }
  }

  // Clear session data
  const clearSession = () => {
    user.value = null
    token.value = null
    if (process.client) {
      localStorage.removeItem('auth_token')
    }
  }

  // Check if we're in a browser environment
  const isBrowser = () => {
    return process.client && window !== undefined
  }

  // Login
  const login = async (credentials: LoginCredentials) => {
    isLoading.value = true
    error.value = null

    try {
      const { data, error: apiError } = await useApiFetch<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: credentials,
        credentials: 'include'
      })

      if (apiError.value) {
        throw new Error(apiError.value.message || 'Login failed')
      }

      if (data.value) {
        const { user: userData, token: authToken } = data.value
        setSession(userData, authToken)

        // Get redirect path or default to dashboard
        const redirect = useState<string>('redirect')
        const redirectPath = redirect.value || '/dashboard'
        redirect.value = '' // Clear stored redirect
        
        // Navigate to the redirect path
        await navigateTo(redirectPath)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Register
  const register = async (credentials: RegisterCredentials) => {
    isLoading.value = true
    error.value = null

    try {
      const { data, error: apiError } = await useApiFetch<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: credentials,
        credentials: 'include'
      })

      if (apiError.value) {
        throw new Error(apiError.value.message || 'Registration failed')
      }

      if (data.value) {
        const { user: userData, token: authToken } = data.value
        setSession(userData, authToken)
        await navigateTo('/dashboard')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Registration failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Logout
  const logout = async () => {
    isLoading.value = true
    error.value = null

    try {
      await useApiFetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      clearSession()
      isLoading.value = false
      await navigateTo('/login')
    }
  }

  // Revoke all sessions
  const revokeAllSessions = async () => {
    isLoading.value = true
    error.value = null

    try {
      await useApiFetch('/api/auth/revoke-all', {
        method: 'POST',
        credentials: 'include'
      })
      clearSession()
      await navigateTo('/login')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to revoke sessions'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const setupAuthAutoRefresh = () => {
    const refreshInterval = ref<number>()
    
    const startRefresh = () => {
      if (!process.client) return
      if (refreshInterval.value) return
      
      refreshInterval.value = window.setInterval(async () => {
        try {
          await refreshSession()
        } catch (error) {
          console.error('Auto-refresh failed, stopping interval')
          stopRefresh()
        }
      }, 14 * 60 * 1000) // 14 minutes
    }

    const stopRefresh = () => {
      if (refreshInterval.value) {
        window.clearInterval(refreshInterval.value)
        refreshInterval.value = undefined
      }
    }

    return { startRefresh, stopRefresh }
  }

  return {
    setupAuthAutoRefresh,
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    isInitialized,
    initAuth,
    login,
    register,
    logout,
    updateProfile: async (updates: { name: string }) => {
      isLoading.value = true
      error.value = null

      try {
        const { data, error: apiError } = await useApiFetch<{ user: User }>('/api/auth/profile', {
          method: 'PUT',
          body: updates,
          credentials: 'include'
        })

        if (apiError.value) {
          throw new Error(apiError.value.message || 'Failed to update profile')
        }

        if (data.value?.user) {
          user.value = data.value.user
        }
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to update profile'
        throw err
      } finally {
        isLoading.value = false
      }
    },
    revokeAllSessions,
    refreshSession
  }
}
