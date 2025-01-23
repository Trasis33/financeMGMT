import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  
  // Skip auth check for registration page
  if (to.path === '/register') {
    return
  }

  // Ensure auth is initialized
  await authStore.initAuth()

  // Only run on client side
  if (process.client) {
    // Redirect to login if not authenticated
    if (to.path !== '/login' && !authStore.isAuthenticated) {
      return navigateTo('/login');
    }
    
    // Redirect to dashboard if already authenticated
    if (to.path === '/login' && authStore.isAuthenticated) {
      return navigateTo('/dashboard');
    }
  }
})
