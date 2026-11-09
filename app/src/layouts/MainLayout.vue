<script setup>
import Navbar from '../components/ui/Navbar.vue'
import Footer from '../components/ui/Footer.vue'
</script>

<template>
  <div class="bg-background-light dark:bg-background-dark text-gray-800 dark:text-gray-100 font-body transition-colors duration-300 min-h-screen">
    <Navbar />
    <router-view />
    <Footer />
  </div>
</template>
