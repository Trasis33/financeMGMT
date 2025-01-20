import type { LoginCredentials, RegisterData, User } from '~/types/auth'
import type { AuthResponse, ProfileResponse } from '~/types/api'

export const useAuth = () => {
  const user = useState<User | null>('user', () => null)
  const token = useState<string | null>('token', () => null)
  const isInitialized = useState<boolean>('auth_initialized', () => false)

  // Initialize auth state from localStorage
  const initAuth = async () => {
    if (process.client) {
      const storedToken = localStorage.getItem('auth_token')
      if (storedToken) {
        token.value = storedToken
        await fetchUser()
      }
    }
    isInitialized.value = true
  }

  // Fetch current user
  const fetchUser = async () => {
    try {
      const { data, error } = await useApiFetch<ProfileResponse>('/api/auth/profile')
      
      if (error.value) {
        throw error.value
      }
      
      if (data.value) {
        user.value = data.value.user
        return data.value.user
      }
      return null
    } catch (error) {
      console.error('Error fetching user:', error)
      user.value = null
      token.value = null
      if (process.client) {
        localStorage.removeItem('auth_token')
      }
      return null
    }
  }

  // Login
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      const { data, error } = await useApiFetch<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: credentials
      })

      if (error.value) {
        throw error.value
      }

      if (data.value) {
        user.value = data.value.user
        token.value = data.value.token

        if (process.client) {
          localStorage.setItem('auth_token', data.value.token)
        }

        // Navigate to saved redirect path or dashboard
        const redirectPath = useState('redirect').value || '/dashboard'
        useState('redirect').value = '/dashboard' // Reset redirect
        navigateTo(redirectPath)
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  // Register
  const register = async (userData: RegisterData) => {
    try {
      const { data, error } = await useApiFetch<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: userData
      })

      if (error.value) {
        throw error.value
      }

      if (data.value) {
        user.value = data.value.user
        token.value = data.value.token

        if (process.client) {
          localStorage.setItem('auth_token', data.value.token)
        }

        return navigateTo('/dashboard')
      }
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  // Logout
  const logout = () => {
    user.value = null
    token.value = null
    if (process.client) {
      localStorage.removeItem('auth_token')
    }
    return navigateTo('/login')
  }

  // Update profile
  const updateProfile = async (updates: Partial<User>) => {
    try {
      const { data, error } = await useApiFetch<ProfileResponse>('/api/auth/profile', {
        method: 'PUT',
        body: updates
      })

      if (error.value) {
        throw error.value
      }

      if (data.value) {
        user.value = data.value.user
        return data.value.user
      }
      return null
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    }
  }

  return {
    user,
    token,
    isInitialized,
    initAuth,
    login,
    register,
    logout,
    updateProfile
  }
}