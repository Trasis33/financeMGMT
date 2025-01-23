<template>
  <NuxtLayout>
    <NuxtLoadingIndicator color="#0EA5E9" />
    <ClientOnly>
      <Suspense>
        <template #default>
          <div v-if="isInitialized">
            <NuxtPage />
          </div>
          <div v-else class="min-h-screen flex items-center justify-center">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        </template>
        <template #fallback>
          <div class="min-h-screen flex items-center justify-center">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        </template>
      </Suspense>
    </ClientOnly>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore } from './stores/auth';
const authStore = useAuthStore()
const { isInitialized } = storeToRefs(authStore)

// Initialize auth on app start
await authStore.initAuth()

// Watch for auth state changes
watch(isInitialized, async (initialized) => {
  if (!initialized) {
    await authStore.initAuth()
  }
})
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
