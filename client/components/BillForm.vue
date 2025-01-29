<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Description -->
      <div class="col-span-2">
        <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
        <input
          type="text"
          id="description"
          v-model="formData.description"
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="e.g., Monthly Rent"
        />
      </div>

      <!-- Amount -->
      <div>
        <label for="amount" class="block text-sm font-medium text-gray-700">Amount</label>
        <div class="mt-1 relative rounded-md shadow-sm">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span class="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            step="0.01"
            id="amount"
            v-model="formData.amount"
            required
            class="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>
      </div>

      <!-- Due Date -->
      <div>
        <label for="dueDate" class="block text-sm font-medium text-gray-700">Due Date</label>
        <input
          type="date"
          id="dueDate"
          v-model="formData.dueDate"
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <!-- Category -->
      <div>
        <label for="category" class="block text-sm font-medium text-gray-700">Category</label>
        <select
          id="category"
          v-model="formData.category"
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="UTILITIES">Utilities</option>
          <option value="RENT">Rent</option>
          <option value="SUBSCRIPTION">Subscription</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <!-- Recurring Options -->
      <div>
        <div class="flex items-center">
          <input
            type="checkbox"
            id="isRecurring"
            v-model="formData.isRecurring"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label for="isRecurring" class="ml-2 block text-sm text-gray-900">
            Recurring Bill
          </label>
        </div>
        <div v-if="formData.isRecurring" class="mt-2">
          <select
            v-model="formData.recurringPeriod"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
          </select>
        </div>
      </div>

      <!-- Participants -->
      <div class="col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-2">Participants</label>
        <div v-for="(participant, index) in formData.participants" :key="index" class="flex gap-4 mb-2">
          <div class="flex-grow">
            <select
              v-model="participant.userId"
              required
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="-1">Select Participant</option>
              <option v-for="user in availableUsers" :key="user.id" :value="user.id">
                {{ user.name }}
              </option>
            </select>
          </div>
          <div class="w-32">
            <input
              type="number"
              v-model="participant.share"
              step="0.01"
              min="0"
              max="1"
              required
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Share (0-1)"
            />
          </div>
          <button
            type="button"
            @click="removeParticipant(index)"
            class="text-red-600 hover:text-red-800"
          >
            Remove
          </button>
        </div>
        <button
          type="button"
          @click="addParticipant"
          class="mt-2 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add Participant
        </button>
        <p v-if="!isSharesValid" class="mt-2 text-sm text-red-600">
          Total shares must equal 100%
        </p>
      </div>

      <!-- Notes -->
      <div class="col-span-2">
        <label for="notes" class="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          id="notes"
          v-model="formData.notes"
          rows="3"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Add any additional notes here..."
        />
      </div>
    </div>

    <!-- Submit Button -->
    <div class="flex justify-end">
      <button
        type="submit"
        :disabled="!isFormValid"
        class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {{ bill ? 'Update Bill' : 'Create Bill' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { CreateBillInput, BillWithParticipants } from '~/types/Bill';

interface User {
  id: number;
  name: string;
  email: string;
}

const props = defineProps<{
  bill?: BillWithParticipants;
}>();

const emit = defineEmits<{
  (e: 'submit', data: CreateBillInput): void;
}>();

// Initialize form data
const formData = ref<CreateBillInput>({
  description: '',
  amount: 0,
  dueDate: new Date().toISOString().split('T')[0],
  category: 'OTHER',
  isRecurring: false,
  recurringPeriod: undefined,
  notes: '',
  participants: [],
});

// Mock available users - replace with actual user data
const availableUsers = ref<User[]>([]);

// Load available users
const loadUsers = async () => {
  try {
    const response = await fetch(`${useRuntimeConfig().public.apiBaseUrl}/api/users`, {
      headers: {
        Authorization: `Bearer ${useState('token').value}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    availableUsers.value = await response.json();
  } catch (error) {
    console.error('Error loading users:', error);
  }
};

// Initialize form with existing bill data if editing
onMounted(() => {
  loadUsers();
  if (props.bill) {
    formData.value = {
      description: props.bill.description,
      amount: props.bill.amount,
      dueDate: new Date(props.bill.dueDate).toISOString().split('T')[0],
      category: props.bill.category,
      isRecurring: props.bill.isRecurring,
      recurringPeriod: props.bill.recurringPeriod,
      notes: props.bill.notes || '',
      participants: props.bill.participants.map(p => ({
        userId: p.userId,
        share: p.share,
      })),
    };
  }
});

// Validation
const isSharesValid = computed(() => {
  const totalShare = formData.value.participants.reduce((sum, p) => sum + p.share, 0);
  return Math.abs(totalShare - 1) < 0.0001;
});

const isFormValid = computed(() => {
  return (
    formData.value.description &&
    formData.value.amount > 0 &&
    formData.value.dueDate &&
    formData.value.participants.length > 0 &&
    formData.value.participants.every(p => p.userId > 0 && p.share > 0) &&
    isSharesValid.value
  );
});

// Add initial participant on component mount if none exists
onMounted(() => {
  loadUsers();
  if (props.bill) {
    formData.value = {
      description: props.bill.description,
      amount: props.bill.amount,
      dueDate: new Date(props.bill.dueDate).toISOString().split('T')[0],
      category: props.bill.category,
      isRecurring: props.bill.isRecurring,
      recurringPeriod: props.bill.recurringPeriod,
      notes: props.bill.notes || '',
      participants: props.bill.participants.map(p => ({
        userId: p.userId,
        share: p.share,
      })),
    };
  } else if (formData.value.participants.length === 0) {
    addParticipant();
  }
});

// Participant management
const addParticipant = () => {
  // Calculate default share based on number of participants
  const newShare = formData.value.participants.length === 0 ?
    1 : // If this is the first participant, give them 100%
    0;  // Otherwise, they'll need to set their share manually

  formData.value.participants.push({
    userId: -1,  // Invalid ID to indicate no selection
    share: newShare
  });
};

const removeParticipant = (index: number) => {
  formData.value.participants.splice(index, 1);
};

// Form submission
const handleSubmit = () => {
  if (isFormValid.value) {
    emit('submit', formData.value);
  }
};
</script>