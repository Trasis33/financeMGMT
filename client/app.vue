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
const { initAuth, isInitialized } = useAuth()

// Initialize auth state before rendering the app
onMounted(async () => {
  await initAuth()
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
