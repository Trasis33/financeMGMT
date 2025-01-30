<template>
  <NuxtLayout>
    <NuxtLoadingIndicator color="#0EA5E9" />
    <ClientOnly>
      <Suspense>
        <template #default>
          <div v-if="initialized">
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
import { ref } from 'vue'
const { initAuth, isInitialized } = useAuth()
const initialized = ref(false)

// Initialize auth only on client side
onMounted(async () => {
  if (!isInitialized.value) {
    await initAuth()
  }
  initialized.value = true
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
