import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'

export default defineNuxtRouteMiddleware(async (to: RouteLocationNormalized) => {
  const { isInitialized } = useAuth()
  const user = useState('user')
  const token = useState('token')

  // Wait for auth to be initialized
  if (!isInitialized.value) {
    await new Promise(resolve => setTimeout(resolve, 100))
    return
  }
  
  // Allow access to auth pages
  if (to.path === '/login' || to.path === '/register') {
    if (user.value && token.value) {
      // If already authenticated, redirect to dashboard
      return navigateTo('/dashboard')
    }
    return
  }

  // Check if user is authenticated
  if (!user.value || !token.value) {
    // Save the intended destination
    useState('redirect').value = to.fullPath
    return navigateTo('/login')
  }
})