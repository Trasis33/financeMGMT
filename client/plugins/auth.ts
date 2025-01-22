export default defineNuxtPlugin(() => {
  // Only run in client
  if (import.meta.server) return

  const { initAuth } = useAuth()
  
  // Initialize auth on app start
  initAuth()
})