import type { UseFetchOptions } from 'nuxt/app'

export function useApiFetch<T>(path: string, options: UseFetchOptions<T> = {}) {
  const config = useRuntimeConfig()
  const token = useState('token')

  const defaults: UseFetchOptions<T> = {
    baseURL: config.public.apiBaseUrl,
    key: path,
    
    // Add authorization header if token exists
    headers: token.value
      ? { Authorization: `Bearer ${token.value}`, ...options.headers as Record<string, string> }
      : options.headers as Record<string, string>,

    // Handle token refresh from response headers
    onResponse(_ctx) {
      const response = _ctx.response
      const newToken = response.headers.get('authorization')?.split(' ')[1]
      
      if (newToken) {
        token.value = newToken
        if (process.client) {
          localStorage.setItem('auth_token', newToken)
        }
      }
    },

    // Handle unauthorized errors
    onResponseError(_ctx) {
      const error = _ctx.response
      
      if (error.status === 401) {
        // Clear auth state on unauthorized
        token.value = null
        useState('user').value = null
        if (process.client) {
          localStorage.removeItem('auth_token')
        }
        navigateTo('/login')
      }
    },
  }

  // Merge defaults with provided options
  const params = {
    ...defaults,
    ...options,
    headers: {
      ...defaults.headers,
      ...(options.headers as Record<string, string>)
    }
  }

  return useFetch(path, params)
}