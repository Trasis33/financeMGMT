import { defineNuxtRouteMiddleware, navigateTo } from '#app'

export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuth()

  // If user is authenticated and tries to access guest pages (login, register)
  // redirect them to dashboard
  if (isAuthenticated.value) {
    return navigateTo('/dashboard')
  }
})
