import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'

export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated, isInitialized } = useAuth()

  // Only run on client side after auth initialization
  if (process.client && isInitialized.value) {
    const publicPages = ['/login', '/register']
    const isPublicPage = publicPages.includes(to.path)

    if (!isPublicPage && !isAuthenticated.value) {
      return navigateTo('/login')
    }
    
    if (isPublicPage && isAuthenticated.value) {
      return navigateTo('/dashboard')
    }
  }
})
