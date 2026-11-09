<script setup>
import { useAuthStore } from '../../stores/authStore'
import { useRouter } from 'vue-router'

const emit = defineEmits(['toggle-sidebar'])

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = async () => {
  const result = await authStore.logout()
  if (result.success) {
    router.push('/admin/login')
  }
}
</script>

<template>
  <header class="sticky top-0 z-30 h-16 bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-gray-700">
    <div class="flex items-center justify-between h-full px-4">
      <!-- Mobile menu button -->
      <button 
        @click="$emit('toggle-sidebar')"
        class="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <span class="material-icons text-gray-700 dark:text-gray-300">menu</span>
      </button>

      <!-- Spacer for desktop -->
      <div class="hidden lg:block"></div>

      <!-- Right side -->
      <div class="flex items-center gap-4">
        <!-- User info -->
        <div class="hidden sm:flex items-center gap-3">
          <div class="text-right">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ authStore.user?.email || 'Admin' }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
          </div>
          <div class="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center">
            <span class="material-icons text-white text-xl">person</span>
          </div>
        </div>

        <!-- Logout button -->
        <button
          @click="handleLogout"
          class="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <span class="material-icons text-gray-700 dark:text-gray-300">logout</span>
          <span class="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">Logout</span>
        </button>
      </div>
    </div>
  </header>
</template>
