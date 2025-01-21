<template>
  <NuxtLayout>
    <template v-if="isInitialized">
      <NuxtLoadingIndicator color="#0EA5E9" />
      <NuxtPage />
    </template>
    <template v-else>
      <div class="min-h-screen flex items-center justify-center">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
const { initAuth, isInitialized, isAuthenticated } = useAuth()

// Initialize auth state before rendering the app
if (process.client) {
  onMounted(async () => {
    console.log('App mounted in browser, initializing auth...', {
      isInitialized: isInitialized.value,
      isAuthenticated: isAuthenticated.value
    })

    try {
      await initAuth()
      console.log('Auth initialization complete:', {
        isInitialized: isInitialized.value,
        isAuthenticated: isAuthenticated.value
      })
    } catch (error) {
      console.error('Auth initialization failed:', error)
    }
  })

  // Watch for auth state changes
  watch([isInitialized, isAuthenticated], ([newInit, newAuth]) => {
    console.log('Auth state changed:', {
      isInitialized: newInit,
      isAuthenticated: newAuth
    })
  })
} else {
  console.log('App initialized in SSR context')
}
</script>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.15s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(5px);
}
</style>
