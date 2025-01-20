<template>
  <div class="min-h-screen bg-gray-50">
    <AppNavigation v-if="isAuthenticated" />
    <main class="py-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const isAuthenticated = computed(() => {
  const user = useState('user')
  const token = useState('token')
  return !!user.value && !!token.value
})</script>