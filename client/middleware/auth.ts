import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'

export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated, isInitialized } = useAuth()

  // Only run on client side after auth initialization
  if (process.client && isInitialized.value) {
    if (to.path !== '/login' && !isAuthenticated.value) {
      return navigateTo('/login');
    }
    
    if (to.path === '/login' && isAuthenticated.value) {
      return navigateTo('/dashboard');
    }
  }
})
