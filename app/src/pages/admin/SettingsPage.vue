<script setup>
import { ref, onMounted } from 'vue'
import { settingsService } from '../../services/settingsService'

const settings = ref({
  site_name: '',
  tagline: '',
  footer_text: ''
})
const loading = ref(true)
const saving = ref(false)
const message = ref('')
const messageType = ref('success')

onMounted(async () => {
  await fetchSettings()
  loading.value = false
})

async function fetchSettings() {
  try {
    const { data, error } = await settingsService.getAll()
    
    if (error) throw error

    // Convert array to object
    if (data) {
      data.forEach(item => {
        if (settings.value.hasOwnProperty(item.key)) {
          settings.value[item.key] = item.value
        }
      })
    }
  } catch (err) {
    console.error('Error fetching settings:', err)
  }
}

async function handleSubmit() {
  saving.value = true
  message.value = ''

  try {
    const { error } = await settingsService.updateAll(settings.value)
    if (error) throw error

    message.value = 'Settings saved successfully!'
    messageType.value = 'success'
  } catch (err) {
    message.value = 'Failed to save settings: ' + err.message
    messageType.value = 'error'
  } finally {
    saving.value = false
    
    // Clear message after 3 seconds
    setTimeout(() => {
      message.value = ''
    }, 3000)
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
        Site Settings
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Configure your website information
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
    </div>

    <!-- Settings Form -->
    <div v-else class="bg-white dark:bg-surface-dark rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Site Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Site Name
          </label>
          <input
            v-model="settings.site_name"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Yukflix"
          />
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            This will appear in the browser tab and navigation
          </p>
        </div>

        <!-- Tagline -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tagline
          </label>
          <input
            v-model="settings.tagline"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Your Premium Streaming Platform"
          />
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            A short description of your site
          </p>
        </div>

        <!-- Footer Text -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Footer Text
          </label>
          <input
            v-model="settings.footer_text"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="© 2023 Yukflix. All rights reserved."
          />
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Copyright text displayed in the footer
          </p>
        </div>

        <!-- Message -->
        <div 
          v-if="message"
          class="p-4 rounded-lg"
          :class="messageType === 'success' 
            ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'"
        >
          <p 
            class="text-sm"
            :class="messageType === 'success' 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'"
          >
            {{ message }}
          </p>
        </div>

        <!-- Submit Button -->
        <div>
          <button
            type="submit"
            :disabled="saving"
            class="w-full md:w-auto px-6 py-3 bg-primary hover:bg-opacity-90 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="saving">Saving...</span>
            <span v-else>Save Settings</span>
          </button>
        </div>
      </form>
    </div>

    <!-- Preview Card -->
    <div class="mt-6 bg-white dark:bg-surface-dark rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
        Preview
      </h3>
      <div class="space-y-3">
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Site Name</p>
          <p class="text-lg font-bold text-gray-900 dark:text-white">
            {{ settings.site_name || 'Yukflix' }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Tagline</p>
          <p class="text-gray-700 dark:text-gray-300">
            {{ settings.tagline || 'Your Premium Streaming Platform' }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Footer</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ settings.footer_text || '© 2023 Yukflix. All rights reserved.' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
