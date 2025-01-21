import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'

export default defineNuxtRouteMiddleware(async (to: RouteLocationNormalized) => {
  const { isInitialized, isAuthenticated, initAuth } = useAuth()

  console.log('Auth middleware running:', {
    path: to.path,
    isSSR: !process.client,
    isInitialized: isInitialized.value,
    isAuthenticated: isAuthenticated.value
  })

  // Skip full auth check during SSR for non-critical pages
  if (!process.client && !to.meta.requiresAuth) {
    console.log('Skipping auth check during SSR for non-critical page')
    return
  }

  // Initialize auth state if needed
  if (!isInitialized.value) {
    console.log('Auth not initialized, initializing...')
    try {
      await initAuth()
    } catch (error) {
      console.error('Auth initialization failed:', error)
      // Only redirect to login if we're in the browser
      if (process.client) {
        return navigateTo('/login')
      }
    }
  }

  // Handle auth pages (login/register)
  if (to.path === '/login' || to.path === '/register') {
    if (isAuthenticated.value && process.client) {
      console.log('Already authenticated, redirecting to dashboard')
      return navigateTo('/dashboard')
    }
    return
  }

  // Handle protected routes
  if (!isAuthenticated.value && process.client) {
    console.log('Not authenticated, redirecting to login')
    // Save the intended destination
    useState('redirect').value = to.fullPath
    return navigateTo('/login')
  }

  console.log('Auth check passed, allowing navigation to:', to.path)
})