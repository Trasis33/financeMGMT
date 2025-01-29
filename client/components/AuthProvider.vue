<script setup lang="ts">
import { onMounted } from 'vue'
const { initAuth, isAuthenticated, isInitialized } = useAuth()
const { setupAuthAutoRefresh } = useAuth()
const { startRefresh, stopRefresh } = setupAuthAutoRefresh()

onMounted(async () => {
  await initAuth()
  console.log('AuthProvider mounted, current auth state:', {
    isAuthenticated: isAuthenticated.value,
    isInitialized: isInitialized.value
  })

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
  <div>
    <slot v-if="isInitialized" />
    <div v-else class="min-h-screen flex items-center justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
    </div>
  </div>
</template>
