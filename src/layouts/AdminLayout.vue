<script setup>
import { ref } from 'vue'
import Sidebar from '../components/admin/Sidebar.vue'
import Topbar from '../components/admin/Topbar.vue'

const sidebarOpen = ref(false)

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const closeSidebar = () => {
  sidebarOpen.value = false
}
</script>

<template>
  <div class="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden">
    <!-- Sidebar -->
    <Sidebar :is-open="sidebarOpen" @close="closeSidebar" />

    <!-- Main content -->
    <div class="flex-1 flex flex-col lg:ml-64 overflow-hidden">
      <!-- Topbar -->
      <Topbar @toggle-sidebar="toggleSidebar" />

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <router-view />
      </main>
    </div>
  </div>
</template>
