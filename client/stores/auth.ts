import { defineStore } from 'pinia'
import type { User } from '~/types/api'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  isInitialized: boolean
  refreshInterval: number | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    isLoading: false,
    error: null,
    isInitialized: false,
    refreshInterval: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.user && !!state.token
  },

  actions: {
    async initAuth() {
      if (this.isInitialized) return true
      
      this.isLoading = true
      try {
        // Check for existing token
        if (process.client) {
          const storedToken = localStorage.getItem('auth_token')
          if (storedToken) {
            const success = await this.refreshSession()
            if (success) {
              this.setupAutoRefresh()
            }
            return success
          }
        }
        return false
      } catch (error) {
        console.error('Auth initialization error:', error)
        return false
      } finally {
        this.isLoading = false
        this.isInitialized = true
      }
    },

    async refreshSession() {
      try {
        const { data, error } = await useApiFetch<{ user: User; token: string }>('/api/auth/refresh', {
          method: 'GET',
          credentials: 'include'
        })

        if (error.value) {
          throw new Error(error.value.message || 'Session refresh failed')
        }

        if (data.value) {
          this.setSession(data.value.user, data.value.token)
          return true
        }
        return false
      } catch (error) {
        console.error('Session refresh error:', error)
        this.clearSession()
        throw error
      }
    },

    setSession(user: User, token: string) {
      this.user = user
      this.token = token
      
      if (process.client) {
        localStorage.setItem('auth_token', token)
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 14)
        localStorage.setItem('auth_token_expiry', expiryDate.toISOString())
      }
    },

    clearSession() {
      this.user = null
      this.token = null
      if (process.client) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_token_expiry')
      }
    },

    async login(credentials: { email: string; password: string }) {
      this.isLoading = true
      this.error = null

      try {
        const { data, error } = await useApiFetch<{ user: User; token: string }>('/api/auth/login', {
          method: 'POST',
          body: credentials,
          credentials: 'include'
        })

        if (error.value) {
          throw new Error(error.value.message || 'Login failed')
        }

        if (data.value) {
          this.setSession(data.value.user, data.value.token)
          return data.value
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Login failed'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async logout() {
      this.isLoading = true
      try {
        await useApiFetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        })
        this.clearSession()
      } finally {
        this.isLoading = false
      }
    },

    setupAutoRefresh() {
      if (this.refreshInterval) return
      
      this.refreshInterval = window.setInterval(async () => {
        if (!this.isAuthenticated) return
        try {
          await this.refreshSession()
        } catch (error) {
          console.error('Auto-refresh failed:', error)
          this.stopAutoRefresh()
        }
      }, 14 * 60 * 1000) // 14 minutes
    },

    stopAutoRefresh() {
      if (this.refreshInterval) {
        window.clearInterval(this.refreshInterval)
        this.refreshInterval = null
      }
    }
  }
})
