<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
const { initAuth, isAuthenticated, refreshSession } = useAuth()
const { setupAuthAutoRefresh } = useAuth()
const { startRefresh, stopRefresh } = setupAuthAutoRefresh()

onMounted(async () => {
  const success = await initAuth()
  if (success && isAuthenticated.value) {
    startRefresh()
  }

  watch(isAuthenticated, (authenticated) => {
    if (authenticated) {
      startRefresh()
    } else {
      stopRefresh()
    }
  })
})
</script>

<template>
  <slot />
</template>
