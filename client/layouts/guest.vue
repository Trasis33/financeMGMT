<template>
  <div class="min-h-screen bg-gray-50">
    <ClientOnly>
      <AuthProvider>
        <template v-if="isInitialized">
          <div v-if="!isAuthenticated" class="h-16"></div>
        </template>
      </AuthProvider>
    </ClientOnly>
    <main class="py-10">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <ClientOnly>
          <div v-if="isInitialized" :class="containerClass">
            <slot />
          </div>
          <div v-else class="max-w-md mx-auto">
            <slot />
          </div>
        </ClientOnly>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AuthProvider from '@/components/AuthProvider.vue'
import { useAuth } from '@/composables/useAuth'

const { isAuthenticated, isInitialized } = useAuth()

const containerClass = computed(() => ({
  'max-w-md': !isAuthenticated.value,
  'max-w-7xl': isAuthenticated.value
}))

// Debug auth state changes
watch([isAuthenticated, isInitialized], ([auth, init]) => {
  console.log('Guest layout auth state changed:', { auth, init })
})
</script>
