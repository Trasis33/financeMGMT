<template>
  <div class="min-h-screen bg-gray-50">
    <ClientOnly>
      <AuthProvider />
    </ClientOnly>
    <main class="py-10">
      <div class="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <slot />
      </div>
    </main>
  </div>
</template>
<script setup lang="ts">
import AuthProvider from '@/components/AuthProvider.vue'
</script>
