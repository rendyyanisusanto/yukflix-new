<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const isScrolled = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <nav 
    class="fixed w-full z-50 transition-all duration-300"
    :class="isScrolled 
      ? 'bg-surface-light dark:bg-background-dark shadow-md' 
      : 'bg-gradient-to-b from-black/70 to-transparent dark:from-black/90'"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-20">
        <router-link to="/" class="flex-shrink-0 cursor-pointer transition-transform hover:scale-105">
          <img 
            alt="Yukflix Logo" 
            class="h-8 md:h-10 w-auto object-contain" 
            src="/src/assets/logo.png"
          />
        </router-link>
        <div class="hidden md:block">
          <div class="ml-10 flex items-baseline space-x-8">
            <router-link to="/" class="text-white hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">Home</router-link>
            <router-link to="/series" class="text-gray-300 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">Series</router-link>
            <router-link to="/movies" class="text-gray-300 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">Movies</router-link>
            <router-link to="/my-list" class="text-gray-300 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">My List</router-link>
          </div>
        </div>
        <div class="hidden">
          <button class="text-gray-300 hover:text-primary p-1 rounded-full focus:outline-none">
            <span class="material-icons">search</span>
          </button>
          <button class="text-gray-300 hover:text-primary p-1 rounded-full focus:outline-none">
            <span class="material-icons">notifications</span>
          </button>
          <div class="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 overflow-hidden border-2 border-white/20">
            <img 
              alt="User Avatar" 
              class="h-full w-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9CNCnjcSGR1JMvVIlBJmH1d93FCWvZ2Qr1Q-4BvskcRmC7bAFzE_Xi3908xCNexlq1ApneBAE04hetUXQdcn42i6n6dST54vnOs7riiDNRppXUqnsy2oCKB6cqr4AOBSFRh2pnI56zPSUh95vPuWYaWTvxglkdmqWjQXkuupMyRX3lXNywT7tI0uNiuPIjS-4HTf8SG889qO4qriJBwdhWIGojN0Ww-Fq_QfjYsaLEQNESWz6QnLUzmXg8L9m8WerGPZMAzx9dY0"
            />
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>
