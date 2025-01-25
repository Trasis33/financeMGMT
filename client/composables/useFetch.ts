import { navigateTo, useFetch, useRuntimeConfig, useState, type UseFetchOptions } from 'nuxt/app'
import type { AuthResponse } from '../types/auth'

export function useApiFetch<T = AuthResponse>(path: string, options: UseFetchOptions<T> = {}) {
  const config = useRuntimeConfig()
  const token = useState('token')

  // Ensure path starts with /api
  const apiPath = path.startsWith('/api') ? path : `/api${path}`
  
  const defaults: UseFetchOptions<T> = {
    baseURL: config.public.apiBaseUrl,
    key: apiPath,
    credentials: 'include',
    
    // Add authorization header if token exists
    headers: token.value
      ? { 
          Authorization: `Bearer ${token.value}`,
          ...options.headers as Record<string, string>
        }
      : options.headers as Record<string, string>,

    // Handle token refresh from response headers
    onResponse(_ctx) {
      const response = _ctx.response
      console.log('API Response:', apiPath, response.status)
      
      // Check for token in response body first
      const responseData = response._data
      if (responseData?.token) {
        console.log('New token received in response body')
        token.value = responseData.token
        if (process.client) {
          localStorage.setItem('auth_token', responseData.token)
        }
      }
      
      // Then check headers
      const newToken = response.headers.get('authorization')?.split(' ')[1]
      if (newToken && newToken !== token.value) {
        console.log('New token received in headers')
        token.value = newToken
        if (process.client) {
          localStorage.setItem('auth_token', newToken)
        }
      }
    },

    // Handle errors
    onResponseError(_ctx) {
      const error = _ctx.response
      console.error('API Error:', path, error.status, error.statusText)
      
      if (error.status === 401) {
        console.log('Unauthorized, clearing auth state')
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
