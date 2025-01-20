<template>
  <nav class="bg-white border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <!-- Logo and primary navigation -->
        <div class="flex">
          <div class="flex-shrink-0 flex items-center">
            <NuxtLink to="/dashboard" class="text-xl font-bold text-primary-600">
              Finance Tracker
            </NuxtLink>
          </div>
          <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
            <NuxtLink
              v-for="item in navigationItems"
              :key="item.path"
              :to="item.path"
              :class="[
                'inline-flex items-center px-1 pt-1 border-b-2',
                $route.path.startsWith(item.path)
                  ? 'border-primary-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              ]"
            >
              {{ item.name }}
            </NuxtLink>
          </div>
        </div>

        <!-- User menu -->
        <div class="hidden sm:ml-6 sm:flex sm:items-center">
          <div class="ml-3 relative">
            <button
              type="button"
              @click="isUserMenuOpen = !isUserMenuOpen"
              class="flex text-sm border-2 border-transparent rounded-full focus:outline-none focus:border-primary-300"
            >
              <span class="sr-only">Open user menu</span>
              <div class="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span class="text-primary-600 font-medium">
                  {{ userInitials }}
                </span>
              </div>
            </button>

            <!-- Dropdown menu -->
            <div
              v-if="isUserMenuOpen"
              class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100"
              role="menu"
            >
              <div class="py-1">
                <NuxtLink
                  to="/profile"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                  @click="isUserMenuOpen = false"
                >
                  Profile Settings
                </NuxtLink>
              </div>
              <div class="py-1">
                <button
                  type="button"
                  @click="handleLogout"
                  class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile menu button -->
        <div class="flex items-center sm:hidden">
          <button
            type="button"
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
          >
            <span class="sr-only">Open main menu</span>
            <!-- Icon when menu is closed -->
            <svg
              v-if="!isMobileMenuOpen"
              class="block h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <!-- Icon when menu is open -->
            <svg
              v-else
              class="block h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile menu -->
    <div v-if="isMobileMenuOpen" class="sm:hidden">
      <div class="pt-2 pb-3 space-y-1">
        <NuxtLink
          v-for="item in navigationItems"
          :key="item.path"
          :to="item.path"
          :class="[
            'block pl-3 pr-4 py-2 border-l-4',
            $route.path.startsWith(item.path)
              ? 'border-primary-500 text-primary-700 bg-primary-50'
              : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
          ]"
          @click="isMobileMenuOpen = false"
        >
          {{ item.name }}
        </NuxtLink>
      </div>
      <div class="pt-4 pb-3 border-t border-gray-200">
        <div class="mt-3 space-y-1">
          <NuxtLink
            to="/profile"
            class="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            @click="isMobileMenuOpen = false"
          >
            Profile Settings
          </NuxtLink>
          <button
            type="button"
            @click="handleLogout"
            class="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
const router = useRouter()
const route = useRoute()
const user = useState('user')

const navigationItems = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Transactions', path: '/transactions' },
  { name: 'Split Expenses', path: '/split-expenses' }
]

const isUserMenuOpen = ref(false)
const isMobileMenuOpen = ref(false)

const userInitials = computed(() => {
  if (!user.value?.name) return '?'
  return user.value.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
})

const handleLogout = async () => {
  const { logout } = useAuth()
  await logout()
  isUserMenuOpen.value = false
}

// Close menus when clicking outside
onMounted(() => {
  if (process.client) {
    document.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.user-menu')) {
        isUserMenuOpen.value = false
      }
    })
  }
})

// Close menus on route change
watch(route, () => {
  isUserMenuOpen.value = false
  isMobileMenuOpen.value = false
})
</script>