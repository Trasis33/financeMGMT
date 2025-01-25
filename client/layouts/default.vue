<template>
  <div class="min-h-screen bg-gray-50">
    <ClientOnly>
      <AuthProvider>
        <template v-if="isInitialized">
          <AppNavigation v-if="isAuthenticated" />
          <template v-else>
            <div class="h-16"></div>
          </template>
        </template>
      </AuthProvider>
    </ClientOnly>
    <main class="py-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import AuthProvider from '@/components/AuthProvider.vue'
const { isAuthenticated, isInitialized } = useAuth()

// Debug auth state changes
watch([isAuthenticated, isInitialized], ([auth, init]) => {
  console.log('Layout auth state changed:', { auth, init })
})
</script>
