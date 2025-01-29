<template>
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <!-- Calendar Header -->
    <div class="flex justify-between items-center p-4 border-b">
      <button
        @click="previousMonth"
        class="p-2 hover:bg-gray-100 rounded-full"
      >
        <span class="sr-only">Previous month</span>
        &larr;
      </button>
      <h2 class="text-lg font-semibold">
        {{ currentMonthName }} {{ currentYear }}
      </h2>
      <button
        @click="nextMonth"
        class="p-2 hover:bg-gray-100 rounded-full"
      >
        <span class="sr-only">Next month</span>
        &rarr;
      </button>
    </div>

    <!-- Calendar Grid -->
    <div class="grid grid-cols-7 text-xs leading-6 text-gray-500 border-b">
      <div v-for="day in weekDays" :key="day" class="text-center py-2">
        {{ day }}
      </div>
    </div>
    <div class="grid grid-cols-7 text-sm">
      <div
        v-for="{ date, isCurrentMonth, bills } in calendarDays"
        :key="date.toISOString()"
        class="relative min-h-[120px] border-b border-r p-2"
        :class="{
          'bg-gray-50': !isCurrentMonth,
          'bg-white': isCurrentMonth
        }"
      >
        <!-- Date -->
        <time
          :datetime="date.toISOString()"
          class="block mb-2"
          :class="{
            'text-gray-400': !isCurrentMonth,
            'font-semibold': isToday(date)
          }"
        >
          {{ date.getDate() }}
        </time>

        <!-- Bills for this day -->
        <div class="space-y-1">
          <div
            v-for="bill in bills"
            :key="bill.id"
            class="text-xs p-1 rounded truncate cursor-pointer hover:opacity-75"
            :class="getBillClass(bill)"
            @click="$emit('select-bill', bill)"
          >
            {{ bill.description }}
            <span class="block text-[10px]">
              {{ formatCurrency(bill.amount) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuth } from '~/composables/useAuth';
import type { BillWithParticipants } from '~/types/Bill';

// Add auth composable
const { isAuthenticated } = useAuth();

// Add authentication check
const checkAuth = () => {
  if (!isAuthenticated.value) {
    throw new Error('Authentication required');
  }
};

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  bills: BillWithParticipants[];
}

// Check authentication when component is mounted
onMounted(() => {
  checkAuth();
});

const props = defineProps<{
  bills: BillWithParticipants[];
}>();

defineEmits<{
  (e: 'select-bill', bill: BillWithParticipants): void;
}>();

const currentDate = ref(new Date());

// Array of weekday names
const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const currentMonthName = computed(() => {
  return currentDate.value.toLocaleString('default', { month: 'long' });
});

const currentYear = computed(() => {
  return currentDate.value.getFullYear();
});

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  const days: CalendarDay[] = [];
  
  // Add days from previous month
  const firstDayWeekday = firstDayOfMonth.getDay();
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push({
      date,
      isCurrentMonth: false,
      bills: getBillsForDate(date),
    });
  }
  
  // Add days of current month
  for (let date = firstDayOfMonth; date <= lastDayOfMonth; date.setDate(date.getDate() + 1)) {
    days.push({
      date: new Date(date),
      isCurrentMonth: true,
      bills: getBillsForDate(date),
    });
  }
  
  // Add days from next month to complete the grid
  const remainingDays = 42 - days.length; // 6 rows * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      date,
      isCurrentMonth: false,
      bills: getBillsForDate(date),
    });
  }
  
  return days;
});

const getBillsForDate = (date: Date) => {
  return props.bills.filter(bill => {
    const billDate = new Date(bill.dueDate);
    return (
      billDate.getDate() === date.getDate() &&
      billDate.getMonth() === date.getMonth() &&
      billDate.getFullYear() === date.getFullYear()
    );
  });
};

const isToday = (date: Date) => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const getBillClass = (bill: BillWithParticipants) => {
  const totalPaid = bill.payments.reduce((sum, p) => sum + p.amount, 0);
  const isPaid = Math.abs(totalPaid - bill.amount) < 0.01;
  const isOverdue = new Date(bill.dueDate) < new Date() && !isPaid;

  if (isPaid) return 'bg-green-100 text-green-800';
  if (isOverdue) return 'bg-red-100 text-red-800';
  return 'bg-yellow-100 text-yellow-800';
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const previousMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1
  );
};

const nextMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1
  );
};
</script>