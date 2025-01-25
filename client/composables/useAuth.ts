import type { User, LoginCredentials, RegisterCredentials, AuthResponse } from '~/types/auth'

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

      // Set the token before attempting refresh
      token.value = storedToken
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
      const config = useRuntimeConfig()
      const response = await $fetch<AuthResponse>('/api/auth/refresh', {
        baseURL: config.public.apiBaseUrl,
        method: 'GET',
        credentials: 'include',
        headers: token.value
          ? { Authorization: `Bearer ${token.value}` }
          : undefined
      });

      console.log('Refresh response:', response);

      const userData = response.data?.user || response.user;
      const authToken = response.data?.token || response.token;

      if (!userData || !authToken) {
        console.error('Invalid refresh response format');
        clearSession();
        return false;
      }

      console.log('Setting session with refreshed data:', { userData, authToken });
      setSession(userData, authToken);
      return true;
    } catch (err) {
      console.error('Session refresh error:', err);
      clearSession();
      return false;
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
      console.log('Attempting login...')
      const config = useRuntimeConfig()
      
      const response = await $fetch<AuthResponse>('/api/auth/login', {
        baseURL: config.public.apiBaseUrl,
        method: 'POST',
        body: credentials,
        credentials: 'include'
      })

      console.log('Login response:', response)

      // Changed this check to handle both nested and direct response formats
      const userData = response.data?.user || response.user
      const authToken = response.data?.token || response.token

      if (!userData || !authToken) {
        throw new Error('Invalid response format')
      }

      console.log('Setting session with:', { userData, authToken })
      setSession(userData, authToken)

      // Initialize auth state immediately after login
      isInitialized.value = true
      
      // Get redirect path or default to dashboard
      const redirect = useState<string>('redirect')
      const redirectPath = redirect.value || '/dashboard'
      redirect.value = '' // Clear stored redirect
      
      console.log('Redirecting to:', redirectPath)
      // Force a full page reload to reset all states
      if (process.client) {
        window.location.replace(redirectPath)
      }
    } catch (err) {
      console.error('Login error:', err)
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

      if (data.value && data.value.data) {
        const { user: userData, token: authToken } = data.value.data;
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
    const isRefreshing = ref(false)
  
    const startRefresh = () => {
      // Only run in browser and if not already running
      if (!process.client || refreshInterval.value) return
    
      refreshInterval.value = window.setInterval(async () => {
        // Skip if already refreshing or not authenticated
        if (isRefreshing.value || !isAuthenticated.value) return
      
        isRefreshing.value = true
        try {
          await refreshSession()
        } catch (error) {
          console.error('Auto-refresh failed:', error)
          stopRefresh()
        } finally {
          isRefreshing.value = false
        }
      }, 14 * 60 * 1000) // 14 minutes
    }

    const stopRefresh = () => {
      if (refreshInterval.value) {
        window.clearInterval(refreshInterval.value)
        refreshInterval.value = undefined
      }
    }

    // Cleanup interval when auth composable is no longer used
    onUnmounted(() => {
      stopRefresh()
    })

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
