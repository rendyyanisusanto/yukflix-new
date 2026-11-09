<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')

const handleLogin = async () => {
  error.value = ''
  
  if (!email.value || !password.value) {
    error.value = 'Please enter email and password'
    return
  }

  const result = await authStore.login(email.value, password.value)
  
  if (result.success) {
    router.push('/admin/dashboard')
  } else {
    error.value = result.error || 'Login failed'
  }
}
</script>

<template>
  <div class="min-h-screen bg-background-dark flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <img 
          src="/src/assets/logo.png" 
          alt="Yukflix" 
          class="h-12 mx-auto mb-4"
        />
        <h1 class="text-3xl font-display font-bold text-white mb-2">Admin Login</h1>
        <p class="text-gray-400">Sign in to manage your content</p>
      </div>

      <!-- Login form -->
      <div class="glass-panel p-8 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="admin@yukflix.com"
            />
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <!-- Error message -->
          <div v-if="error" class="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p class="text-sm text-red-300">{{ error }}</p>
          </div>

          <!-- Submit button -->
          <button
            type="submit"
            :disabled="authStore.loading"
            class="w-full bg-primary hover:bg-opacity-90 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="authStore.loading">Signing in...</span>
            <span v-else>Sign In</span>
          </button>
        </form>

        <!-- Back to home -->
        <div class="mt-6 text-center">
          <router-link 
            to="/" 
            class="text-sm text-gray-400 hover:text-primary transition-colors"
          >
            ← Back to Home
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
