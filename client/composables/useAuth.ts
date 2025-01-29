import type { User, LoginCredentials, RegisterCredentials, AuthResponse } from '~/types/auth'
import { jwtDecode } from 'jwt-decode';

export const useAuth = () => {
  const user = useState<User | null>('user', () => null)
  const token = useState<string | null>('token', () => null)
  const isAuthenticated = useState<boolean>('isAuthenticated', () => false)
  const isLoading = useState<boolean>('auth-loading', () => false)
  const error = useState<string | null>('auth-error', () => null)
  const isInitialized = useState<boolean>('auth-initialized', () => false)
  const registrationSuccess = useState<string | null>('registration-success', () => null)

  const config = useRuntimeConfig()
  const API_BASE = config.public.apiBase

  // Validate current session
  const validateSession = (): boolean => {
    if (!token.value || !user.value) {
      console.log('Session invalid: no token or user');
      return false;
    }

    try {
      const payload = jwtDecode<{ exp?: number }>(token.value);
      if (!payload || !payload.exp) {
        console.log('Session invalid: invalid token payload');
        return false;
      }

      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        console.log('Session invalid: token expired');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  }

  // Initialize auth state
  const initAuth = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      await initSession();
    } catch (err) {
      console.error('Auth initialization error:', err);
      error.value = err instanceof Error ? err.message : 'Failed to initialize auth';
    } finally {
      isLoading.value = false;
      isInitialized.value = true;
    }
  };

  // Initialize session
  const initSession = async () => {
    console.log('Initializing session...');
    
    if (process.server) {
      console.log('Skipping session initialization during SSR');
      return;
    }

    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      console.log('Found stored token');
      
      try {
        // Set initial state from storage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          token.value = storedToken;
          user.value = userData;
          
          // Validate the token
          if (!validateSession()) {
            console.log('Stored token is invalid or expired');
            clearSession();
            return;
          }
          
          isAuthenticated.value = true;
          // Start auto-refresh if token is valid
          setupAuthAutoRefresh().startRefresh();
        }
      } catch (error) {
        console.error('Error initializing session:', error);
        clearSession();
      }
    }
  };

  // Login user
  const login = async (email: string, password: string) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch<{ user: User; token?: string }>(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        body: { email, password },
        headers: {
          'Content-Type': 'application/json'
        },
        onResponse({ response }) {
          const authHeader = response.headers.get('Authorization');
          if (authHeader) {
            const token = authHeader.split(' ')[1];
            if (token) {
              response._data.token = token;
            }
          }
        }
      });

      if (!response.user || !response.token) {
        throw new Error('Invalid response from server');
      }

      await setSession({
        userData: response.user,
        authToken: response.token
      });

      return true;
    } catch (err) {
      console.error('Login error:', err);
      if (err instanceof Error) {
        error.value = err.message;
      } else if (err && typeof err === 'object' && 'data' in err) {
        const data = err.data as { message?: string };
        error.value = data.message || 'Login failed';
      } else {
        error.value = 'Failed to login';
      }
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // Set session data
  const setSession = async ({ userData, authToken }: { userData: User; authToken: string }) => {
    try {
      // Update state
      token.value = authToken;
      user.value = userData;
      isAuthenticated.value = true;

      // Update storage
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));

      console.log('Session set successfully');
    } catch (err) {
      console.error('Error setting session:', err);
      clearSession();
      throw err;
    }
  };

  // Clear session data
  const clearSession = () => {
    user.value = null;
    token.value = null;
    isAuthenticated.value = false;
    if (process.client) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  // Refresh session
  const refreshSession = async (): Promise<boolean> => {
    console.log('Attempting to refresh session');
    if (!token.value) {
      console.log('No token to refresh');
      return false;
    }

    try {
      console.log('Current token:', token.value);
      const response = await $fetch<AuthResponse>(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.token) {
        console.log('New token received:', response.token);
        await setSession({ userData: response.user, authToken: response.token });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to refresh session:', error);
      clearSession();
      return false;
    }
  }

  // Register
  const register = async (credentials: RegisterCredentials) => {
    isLoading.value = true
    error.value = null
    registrationSuccess.value = null

    try {
      let newToken: string | null = null;
      const { data, error: apiError } = await useApiFetch<AuthResponse>(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        body: credentials,
        credentials: 'include',
        onResponse({ response }) {
          const authHeader = response.headers.get('Authorization');
          if (authHeader) {
            const headerToken = authHeader.split(' ')[1];
            if (headerToken) {
              newToken = headerToken;
            }
          }
        }
      });

      if (apiError.value) {
        throw new Error(apiError.value.message || 'Registration failed');
      }

      if (data.value?.data?.user && newToken) {
        const userData = data.value.data.user;
        try {
          await setSession({ userData, authToken: newToken });
          if (!validateSession()) {
            throw new Error('Session validation failed after registration')
          }
          await navigateTo('/dashboard')
        } catch (e) {
          // If auto-login fails, redirect to login page with success message
          registrationSuccess.value = 'Account created successfully! Please log in.'
          await navigateTo('/login')
        }
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
      await useApiFetch(`${API_BASE}/api/auth/logout`, {
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
      await useApiFetch(`${API_BASE}/api/auth/revoke-all`, {
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
          if (!validateSession()) {
            console.error('Invalid session detected during auto-refresh')
            stopRefresh()
            return
          }
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

  // Get auth token
  const getAuthToken = (): string => {
    if (!token.value || !validateSession()) {
      clearSession();
      return '';
    }
    return token.value;
  };

  return {
    setupAuthAutoRefresh,
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    isInitialized,
    registrationSuccess,
    initAuth,
    login,
    register,
    logout,
    updateProfile: async (updates: { name: string }) => {
      isLoading.value = true
      error.value = null

      try {
        const { data, error: apiError } = await useApiFetch<{ user: User }>(`${API_BASE}/api/auth/profile`, {
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
    refreshSession,
    validateSession,
    getAuthToken
  }
}
