<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
  </div>
</template>

<script setup lang="ts">
// Root page that redirects based on auth status
const user = useState('user')

onMounted(() => {
  if (user.value) {
    navigateTo('/dashboard')
  } else {
    navigateTo('/login')
  }
})
</script>