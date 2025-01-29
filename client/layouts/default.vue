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
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <ClientOnly>
          <div v-if="isInitialized" class="max-w-7xl mx-auto">
            <slot />
          </div>
          <div v-else class="max-w-7xl mx-auto">
            <slot />
          </div>
        </ClientOnly>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import AuthProvider from '@/components/AuthProvider.vue'
const { isAuthenticated, isInitialized } = useAuth()
</script>
