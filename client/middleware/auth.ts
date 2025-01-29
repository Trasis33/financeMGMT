import { defineNuxtRouteMiddleware, navigateTo } from '#app'

// Define public pages that don't require authentication
const publicPages = ['/login', '/register', '/forgot-password']

export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated, isInitialized, initAuth } = useAuth()

  // Initialize auth if not already initialized
  if (!isInitialized.value) {
    await initAuth()
  }

  const path = to.path
  const isPublicPage = publicPages.includes(path)
  const needsAuth = !isPublicPage

  console.log('Auth middleware:', { path, isAuthenticated: isAuthenticated.value, isPublicPage, needsAuth })

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
