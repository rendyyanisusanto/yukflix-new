<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close'])

const router = useRouter()
const route = useRoute()

const menuItems = [
  { icon: 'dashboard', label: 'Dashboard', path: '/admin/dashboard' },
  { icon: 'movie', label: 'Films', path: '/admin/films' },
  { icon: 'label', label: 'Genres', path: '/admin/genres' },
  { icon: 'help', label: 'FAQs', path: '/admin/faqs' },
  { icon: 'palette', label: 'Themes', path: '/admin/themes' },
  { icon: 'settings', label: 'Settings', path: '/admin/settings' }
]

const isActive = (path) => {
  return route.path.startsWith(path)
}

const navigate = (path) => {
  router.push(path)
  emit('close')
}
</script>

<template>
  <!-- Mobile overlay -->
  <div 
    v-if="isOpen" 
    class="fixed inset-0 bg-black/50 z-40 lg:hidden"
    @click="$emit('close')"
  ></div>

  <!-- Sidebar -->
  <aside 
    class="fixed top-0 left-0 z-50 h-screen w-64 bg-surface-light dark:bg-surface-dark border-r border-gray-200 dark:border-gray-700 transition-transform duration-300"
    :class="isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
  >
    <div class="flex flex-col h-full">
      <!-- Logo -->
      <div class="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700">
        <img src="/src/assets/logo.png" alt="Yukflix" class="h-8 w-auto" />
        <span class="text-xl font-display font-bold text-gray-900 dark:text-white">Admin</span>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-4 overflow-y-auto">
        <ul class="space-y-2">
          <li v-for="item in menuItems" :key="item.path">
            <button
              @click="navigate(item.path)"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
              :class="isActive(item.path) 
                ? 'bg-primary text-white' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'"
            >
              <span class="material-icons text-xl">{{ item.icon }}</span>
              <span class="font-medium">{{ item.label }}</span>
            </button>
          </li>
        </ul>
      </nav>

      <!-- Footer -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-700">
        <div class="text-xs text-gray-500 dark:text-gray-400 text-center">
          YukFlix Admin Panel
        </div>
      </div>
    </div>
  </aside>
</template>
