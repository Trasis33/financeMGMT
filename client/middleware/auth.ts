import { defineNuxtRouteMiddleware, navigateTo } from '#app'

// Define public pages that don't require authentication
const publicPages = ['/login', '/register', '/forgot-password']

export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated, isInitialized, initAuth, validateSession, refreshSession } = useAuth()

  // Initialize auth if not already initialized
  if (!isInitialized.value) {
    await initAuth()
  }

  // Wait for auth to be initialized
  if (!isInitialized.value) {
    console.log('Auth not initialized yet, waiting...')
    return
  }

  const path = to.path
  const isPublicPage = publicPages.includes(path)
  const needsAuth = !isPublicPage

  console.log('Auth middleware:', { path, isAuthenticated: isAuthenticated.value, isPublicPage, needsAuth })

  // For protected routes, validate the session
  if (needsAuth && isAuthenticated.value) {
    // If token is invalid, try to refresh
    if (!validateSession()) {
      console.log('Session invalid, attempting refresh...')
      const refreshed = await refreshSession()
      if (!refreshed) {
        console.log('Refresh failed, redirecting to login')
        return navigateTo('/login')
      }
    }
  }

  // If page requires auth and user is not authenticated
  if (needsAuth && !isAuthenticated.value) {
    console.log('Redirecting to login - authentication required')
    return navigateTo('/login')
  }

  // If user is authenticated and tries to access login/register
  if (isAuthenticated.value && isPublicPage) {
    console.log('Redirecting to dashboard - already authenticated')
    return navigateTo('/dashboard')
  }
})
