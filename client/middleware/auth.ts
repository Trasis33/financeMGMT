import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'

export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated, isInitialized } = useAuth()
  console.log('Auth middleware:', { 
    path: to.path, 
    isAuthenticated: isAuthenticated.value, 
    isInitialized: isInitialized.value 
  })

  // Only run on client side after auth initialization
  if (process.client && isInitialized.value) {
    const publicPages = ['/login', '/register']
    const isPublicPage = publicPages.includes(to.path)

    if (!isPublicPage && !isAuthenticated.value) {
      console.log('Redirecting to login - not authenticated')
      return navigateTo('/login')
    }
    
    if (isPublicPage && isAuthenticated.value) {
      console.log('Redirecting to dashboard - already authenticated')
      return navigateTo('/dashboard')
    }
  }
})
