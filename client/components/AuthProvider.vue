<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
const { initAuth, isAuthenticated, refreshSession } = useAuth()
const refreshInterval = ref<ReturnType<typeof setInterval> | undefined>()

const startRefreshInterval = () => {
  if (!refreshInterval.value) {
    refreshInterval.value = setInterval(() => {
      refreshSession().catch(console.error)
    }, 14 * 60 * 1000) // 14 minutes
  }
}

const stopRefreshInterval = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = undefined
  }
}

onMounted(async () => {
  const success = await initAuth()
  if (success && isAuthenticated.value) {
    startRefreshInterval()
  }

  watch(isAuthenticated, (authenticated) => {
    if (authenticated) {
      startRefreshInterval()
    } else {
      stopRefreshInterval()
    }
  })
})

onUnmounted(() => {
  stopRefreshInterval()
})
</script>

<template>
  <slot />
</template>
