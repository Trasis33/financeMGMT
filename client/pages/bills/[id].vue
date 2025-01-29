<!-- Same template part... No changes needed -->
<template>
  <!-- ... previous template code ... -->
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth']
});

import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { BillWithParticipants, CreateBillInput, UpdateBillInput } from '~/types/Bill';
import { useBills } from '~/composables/useBills';

const route = useRoute();
const router = useRouter();
const { getBill, updateBill, addPayment } = useBills();

const bill = ref<BillWithParticipants | null>(null);
const loading = ref(true);
const isEditing = ref(false);
const showAddPayment = ref(false);

const newPayment = ref({
  amount: 0,
  notes: '',
});

const totalPaid = computed(() => {
  if (!bill.value) return 0;
  return bill.value.payments.reduce((sum, p) => sum + p.amount, 0);
});

const paymentProgress = computed(() => {
  if (!bill.value) return 0;
  return Math.min((totalPaid.value / bill.value.amount) * 100, 100);
});

const getProgressClass = computed(() => {
  if (paymentProgress.value >= 100) return 'bg-green-500';
  if (paymentProgress.value >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
});

const loadBill = async () => {
  try {
    loading.value = true;
    const id = parseInt(route.params.id as string);
    if (isNaN(id)) {
      router.push('/bills');
      return;
    }
    bill.value = await getBill(id);
  } catch (error) {
    console.error('Error loading bill:', error);
    router.push('/bills');
  } finally {
    loading.value = false;
  }
};

const handleUpdate = async (data: CreateBillInput) => {
  if (!bill.value) return;

  try {
    await updateBill(bill.value.id, {
      ...data,
      id: bill.value.id
    });
    isEditing.value = false;
    await loadBill();
  } catch (error) {
    console.error('Error updating bill:', error);
    // TODO: Add error handling/notification
  }
};

const handleAddPayment = async () => {
  if (!bill.value || !newPayment.value.amount) return;

  try {
    await addPayment(bill.value.id, newPayment.value.amount, newPayment.value.notes);
    showAddPayment.value = false;
    newPayment.value = { amount: 0, notes: '' };
    await loadBill();
  } catch (error) {
    console.error('Error adding payment:', error);
    // TODO: Add error handling/notification
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getCategoryClass = (category: string) => {
  const classes = {
    UTILITIES: 'bg-blue-100 text-blue-800',
    RENT: 'bg-purple-100 text-purple-800',
    SUBSCRIPTION: 'bg-green-100 text-green-800',
    OTHER: 'bg-gray-100 text-gray-800',
  };
  return classes[category as keyof typeof classes] || classes.OTHER;
};

const getStatusClass = (bill: BillWithParticipants) => {
  const totalPaid = bill.payments.reduce((sum, p) => sum + p.amount, 0);
  const isPaid = Math.abs(totalPaid - bill.amount) < 0.01;
  const isOverdue = new Date(bill.dueDate) < new Date() && !isPaid;

  if (isPaid) return 'bg-green-100 text-green-800';
  if (isOverdue) return 'bg-red-100 text-red-800';
  return 'bg-yellow-100 text-yellow-800';
};

const getStatusText = (bill: BillWithParticipants) => {
  const totalPaid = bill.payments.reduce((sum, p) => sum + p.amount, 0);
  const isPaid = Math.abs(totalPaid - bill.amount) < 0.01;
  const isOverdue = new Date(bill.dueDate) < new Date() && !isPaid;

  if (isPaid) return 'Paid';
  if (isOverdue) return 'Overdue';
  return 'Pending';
};

onMounted(loadBill);
</script>

<style scoped>
/* Add any additional styles here */
</style>