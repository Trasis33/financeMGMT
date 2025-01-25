<script setup lang="ts">
const { initAuth, isAuthenticated, isInitialized } = useAuth()
const { setupAuthAutoRefresh } = useAuth()
const { startRefresh, stopRefresh } = setupAuthAutoRefresh()

onMounted(async () => {
  console.log('AuthProvider mounted, current auth state:', {
    isAuthenticated: isAuthenticated.value,
    isInitialized: isInitialized.value
  })
  
  if (!isInitialized.value) {
    await initAuth()
    console.log('Auth initialization completed:', {
      isAuthenticated: isAuthenticated.value,
      isInitialized: isInitialized.value
    })
  }

  if (isAuthenticated.value) {
    startRefresh()
  }
})

// Watch for authentication changes
watch([isAuthenticated, isInitialized], ([authenticated, initialized]) => {
  console.log('Auth state changed:', { authenticated, initialized })
  
  if (authenticated && initialized) {
    startRefresh()
  } else {
    stopRefresh()
  }
})

onUnmounted(() => {
  stopRefresh()
})
</script>

<template>
  <slot v-if="isInitialized" />
  <div v-else class="h-16 flex items-center justify-center">
    <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-600"></div>
  </div>
</template>
