<script setup lang="ts">
const authStore = useAuthStore()

onMounted(async () => {
  try {
    await authStore.initAuth()
  } catch (error) {
    console.error('Auth initialization error:', error)
  }
})

onUnmounted(() => {
  authStore.stopAutoRefresh()
})

// Ensure auth is initialized before rendering
await authStore.initAuth()
</script>

<template>
  <slot />
</template>
