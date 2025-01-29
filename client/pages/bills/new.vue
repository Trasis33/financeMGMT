<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">Create New Bill</h1>
        <NuxtLink
          to="/bills"
          class="text-blue-600 hover:text-blue-800"
        >
          Back to Bills
        </NuxtLink>
      </div>

      <div v-if="isInitialized && isAuthenticated" class="bg-white rounded-lg shadow-md p-6">
        <BillForm @submit="handleSubmit" />
      </div>
      <div v-else-if="isInitialized && !isAuthenticated" class="text-center py-8">
        <p class="text-gray-600">Please log in to create a new bill.</p>
      </div>
      <div v-else class="text-center py-8">
        <p class="text-gray-600">Loading...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import type { CreateBillInput } from '~/types/Bill';
import { useBills } from '~/composables/useBills';
import { useAuth } from '~/composables/useAuth';

const router = useRouter();
const { createBill } = useBills();
const { isAuthenticated, isInitialized, initAuth } = useAuth();

definePageMeta({
  middleware: ['auth']
});

const handleSubmit = async (data: CreateBillInput) => {
  try {
    await createBill(data);
    router.push('/bills');
  } catch (error) {
    console.error('Error creating bill:', error);
    if (error instanceof Error) {
      if (error.message.includes('Authentication') || error.message.includes('log in')) {
        // Save current path for redirect after login
        useState('redirect').value = '/bills/new';
        router.push('/login');
      } else {
        // TODO: Add error notification system
        alert(error.message);
      }
    }
  }
};
</script>