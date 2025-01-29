<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Bills</h1>
      <div class="flex items-center gap-4">
        <div class="flex rounded-lg shadow-sm">
          <button
            @click="view = 'list'"
            class="px-4 py-2 text-sm font-medium rounded-l-lg"
            :class="view === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'"
          >
            List
          </button>
          <button
            @click="view = 'calendar'"
            class="px-4 py-2 text-sm font-medium rounded-r-lg"
            :class="view === 'calendar' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'"
          >
            Calendar
          </button>
        </div>
        <NuxtLink
          to="/bills/new"
          class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Add New Bill
        </NuxtLink>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white p-4 rounded-lg shadow mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <select v-model="localFilters.dateRange" class="w-full border rounded-lg p-2">
            <option value="all">All Time</option>
            <option value="current">Current Month</option>
            <option value="next">Next Month</option>
            <option value="past">Past Due</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select v-model="filters.category" class="w-full border rounded-lg p-2">
            <option value="">All Categories</option>
            <option value="UTILITIES">Utilities</option>
            <option value="RENT">Rent</option>
            <option value="SUBSCRIPTION">Subscription</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
          <select v-model="filters.isPaid" class="w-full border rounded-lg p-2">
            <option value="">All</option>
            <option value="true">Paid</option>
            <option value="false">Unpaid</option>
          </select>
        </div>
        <div v-if="view === 'list'">
          <label class="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
          <select v-model="sort.field" class="w-full border rounded-lg p-2">
            <option value="dueDate">Due Date</option>
            <option value="amount">Amount</option>
            <option value="createdAt">Created Date</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-sm font-medium text-gray-500">Total Amount</h3>
        <p class="text-2xl font-bold">{{ formatCurrency(statistics.totalAmount) }}</p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-sm font-medium text-gray-500">Paid Amount</h3>
        <p class="text-2xl font-bold text-green-600">{{ formatCurrency(statistics.paidAmount) }}</p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-sm font-medium text-gray-500">Unpaid Amount</h3>
        <p class="text-2xl font-bold text-red-600">{{ formatCurrency(statistics.unpaidAmount) }}</p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-sm font-medium text-gray-500">Overdue Bills</h3>
        <p class="text-2xl font-bold text-red-600">{{ statistics.overdueBills }}</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-red-50 p-4 rounded-lg mb-6">
      <p class="text-red-700">{{ error }}</p>
    </div>
    
    <!-- Loading State -->
    <div v-else-if="loading" class="text-center py-8">
      <p class="text-gray-600">Loading bills...</p>
      <div class="mt-2 animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
        <div class="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!bills.length" class="text-center py-8">
      <p class="text-gray-500 mb-4">No bills found. Add your first bill to get started!</p>
      <NuxtLink
        to="/bills/new"
        class="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
      >
        Add New Bill
      </NuxtLink>
    </div>

    <!-- Calendar View -->
    <div v-else-if="view === 'calendar'" class="mt-6">
      <BillCalendar
        :bills="bills"
        @select-bill="navigateToBill"
      />
    </div>

    <!-- List View -->
    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="bill in bills" :key="bill.id">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="text-sm font-medium text-gray-900">
                    {{ bill.description }}
                    <span v-if="bill.isRecurring" class="ml-2 text-xs text-gray-500">(Recurring)</span>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ formatCurrency(bill.amount) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ formatDate(bill.dueDate) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                      :class="getCategoryClass(bill.category)">
                  {{ bill.category }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                      :class="getStatusClass(bill)">
                  {{ getStatusText(bill) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <NuxtLink :to="`/bills/${bill.id}`" class="text-blue-600 hover:text-blue-900 mr-4">
                  View
                </NuxtLink>
                <button @click="deleteBill(bill.id)" class="text-red-600 hover:text-red-900">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { BillWithParticipants, BillsFilterOptions, BillsSortOptions } from '~/types/Bill';
import { useBills } from '~/composables/useBills';
import { useRouter } from 'vue-router';
import { useAuth } from '~/composables/useAuth';

const router = useRouter();
const { getBills, getBillStatistics, deleteBill: deleteBillApi } = useBills();
const { validateSession, refreshSession } = useAuth();

const bills = ref<BillWithParticipants[]>([]);
const loading = ref(true);
const view = ref<'list' | 'calendar'>('list');
const error = ref<string | null>(null);
const statistics = ref({
  totalAmount: 0,
  paidAmount: 0,
  unpaidAmount: 0,
  overdueBills: 0,
  upcomingBills: 0,
  billsByCategory: {} as Record<string, number>,
});

const localFilters = ref({
  dateRange: 'current' as 'all' | 'current' | 'next' | 'past',
  category: '',
  isRecurring: undefined as boolean | undefined,
  isPaid: undefined as boolean | undefined,
});

const filters = computed<BillsFilterOptions>(() => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);

  let dateRange: { startDate?: Date; endDate?: Date } = {};

  switch (localFilters.value.dateRange) {
    case 'current':
      dateRange = { startDate: startOfMonth, endDate: endOfMonth };
      break;
    case 'next':
      dateRange = { startDate: nextMonthStart, endDate: nextMonthEnd };
      break;
    case 'past':
      dateRange = { endDate: now };
      break;
    default:
      dateRange = {};
  }

  return {
    ...dateRange,
    category: localFilters.value.category || undefined,
    isRecurring: localFilters.value.isRecurring,
    isPaid: localFilters.value.isPaid,
  };
});

const sort = ref<BillsSortOptions>({
  field: 'dueDate',
  direction: 'asc',
});

const loadBills = async () => {
  try {
    error.value = null;
    loading.value = true;

    // First ensure we have a valid session
    if (!validateSession()) {
      console.log('Session invalid, refreshing before loading bills');
      const refreshed = await refreshSession();
      if (!refreshed) {
        throw new Error('Failed to refresh session');
      }
    }

    // Make API calls sequentially to avoid token refresh race conditions
    bills.value = await getBills(filters.value, sort.value);
    console.log('Bills loaded successfully');

    // Only fetch statistics if bills load successfully
    try {
      const stats = await getBillStatistics();
      if (stats) {
        statistics.value = stats;
        console.log('Statistics loaded successfully');
      }
    } catch (statsError) {
      console.error('Error loading statistics:', statsError);
      // Don't fail the whole operation if stats fail
    }
  } catch (err) {
    console.error('Error loading bills:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load bills';
  } finally {
    loading.value = false;
  }
};

const deleteBill = async (id: number) => {
  if (!confirm('Are you sure you want to delete this bill?')) return;
  
  try {
    await deleteBillApi(id);
    await loadBills();
  } catch (error) {
    console.error('Error deleting bill:', error);
  }
};

const navigateToBill = (bill: BillWithParticipants) => {
  router.push(`/bills/${bill.id}`);
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

definePageMeta({
  middleware: ['auth']
});

// Watch for filter changes and reload data
watch([filters, sort], () => {
  loadBills();
}, { deep: true });

// Initial data load
onMounted(() => {
  loadBills();
});
</script>