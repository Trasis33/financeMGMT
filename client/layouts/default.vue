<template>
  <div class="min-h-screen bg-gray-50">
    <ClientOnly fallback-tag="div">
      <AuthProvider>
        <AppNavigation v-if="isAuthenticated" />
      </AuthProvider>
      <template #fallback>
        <div class="h-16"></div>
      </template>
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
const { isAuthenticated } = useAuth()
</script>
