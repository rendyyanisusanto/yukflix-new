<script setup>
import { ref, onMounted } from 'vue'
import supabase from '../../services/supabase'

const themes = ref([])
const loading = ref(true)
const showModal = ref(false)
const editingTheme = ref(null)
const formData = ref({
  name: '',
  primary_color: '#c11267',
  secondary_color: '#e94e77',
  background_color: '#0f1115',
  text_color: '#ffffff',
  is_active: false
})
const error = ref('')

onMounted(async () => {
  await fetchThemes()
  loading.value = false
})

async function fetchThemes() {
  const { data, error: fetchError } = await supabase
    .from('themes')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (fetchError) {
    console.error('Error fetching themes:', fetchError)
  } else {
    themes.value = data || []
  }
}

function openModal(theme = null) {
  if (theme) {
    editingTheme.value = theme
    formData.value = { ...theme }
  } else {
    editingTheme.value = null
    formData.value = {
      name: '',
      primary_color: '#c11267',
      secondary_color: '#e94e77',
      background_color: '#0f1115',
      text_color: '#ffffff',
      is_active: false
    }
  }
  error.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingTheme.value = null
  error.value = ''
}

async function handleSubmit() {
  error.value = ''
  
  if (!formData.value.name) {
    error.value = 'Theme name is required'
    return
  }

  try {
    if (editingTheme.value) {
      const { error: updateError } = await supabase
        .from('themes')
        .update(formData.value)
        .eq('id', editingTheme.value.id)
      
      if (updateError) throw updateError
    } else {
      const { error: createError } = await supabase
        .from('themes')
        .insert([formData.value])
      
      if (createError) throw createError
    }

    await fetchThemes()
    closeModal()
  } catch (err) {
    error.value = err.message || 'Failed to save theme'
  }
}

async function deleteTheme(id) {
  if (!confirm('Are you sure you want to delete this theme?')) return

  try {
    const { error: deleteError } = await supabase
      .from('themes')
      .delete()
      .eq('id', id)
    
    if (deleteError) throw deleteError
    
    await fetchThemes()
  } catch (err) {
    alert('Failed to delete theme: ' + err.message)
  }
}

async function setActiveTheme(themeId) {
  try {
    // Deactivate all themes
    await supabase
      .from('themes')
      .update({ is_active: false })
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    // Activate selected theme
    await supabase
      .from('themes')
      .update({ is_active: true })
      .eq('id', themeId)
    
    await fetchThemes()
  } catch (err) {
    alert('Failed to set active theme: ' + err.message)
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
          Theme Management
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Customize website colors and branding
        </p>
      </div>
      <button
        @click="openModal()"
        class="flex items-center gap-2 bg-primary hover:bg-opacity-90 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
      >
        <span class="material-icons">add</span>
        Add Theme
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
    </div>

    <!-- Themes Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="theme in themes" 
        :key="theme.id"
        class="bg-white dark:bg-surface-dark rounded-xl p-6 border border-gray-200 dark:border-gray-700 relative"
        :class="theme.is_active ? 'ring-2 ring-primary' : ''"
      >
        <div v-if="theme.is_active" class="absolute top-4 right-4">
          <span class="px-3 py-1 text-xs font-bold bg-primary text-white rounded-full">
            Active
          </span>
        </div>

        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {{ theme.name }}
        </h3>

        <!-- Color preview -->
        <div class="grid grid-cols-2 gap-3 mb-6">
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Primary</p>
            <div class="flex items-center gap-2">
              <div 
                class="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
                :style="{ backgroundColor: theme.primary_color }"
              ></div>
              <span class="text-sm text-gray-600 dark:text-gray-300">{{ theme.primary_color }}</span>
            </div>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Secondary</p>
            <div class="flex items-center gap-2">
              <div 
                class="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
                :style="{ backgroundColor: theme.secondary_color }"
              ></div>
              <span class="text-sm text-gray-600 dark:text-gray-300">{{ theme.secondary_color }}</span>
            </div>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Background</p>
            <div class="flex items-center gap-2">
              <div 
                class="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
                :style="{ backgroundColor: theme.background_color }"
              ></div>
              <span class="text-sm text-gray-600 dark:text-gray-300">{{ theme.background_color }}</span>
            </div>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Text</p>
            <div class="flex items-center gap-2">
              <div 
                class="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
                :style="{ backgroundColor: theme.text_color }"
              ></div>
              <span class="text-sm text-gray-600 dark:text-gray-300">{{ theme.text_color }}</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <button
            v-if="!theme.is_active"
            @click="setActiveTheme(theme.id)"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
          >
            <span class="material-icons text-sm">check_circle</span>
            Activate
          </button>
          <button
            @click="openModal(theme)"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            <span class="material-icons text-sm">edit</span>
            Edit
          </button>
          <button
            v-if="!theme.is_active"
            @click="deleteTheme(theme.id)"
            class="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
          >
            <span class="material-icons text-sm">delete</span>
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div 
        v-if="themes.length === 0"
        class="col-span-full bg-white dark:bg-surface-dark rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center"
      >
        <span class="material-icons text-6xl text-gray-300 dark:text-gray-600 mb-4">palette</span>
        <p class="text-gray-500 dark:text-gray-400 mb-4">No themes yet</p>
        <button
          @click="openModal()"
          class="text-primary hover:underline font-semibold"
        >
          Create your first theme
        </button>
      </div>
    </div>

    <!-- Modal -->
    <div 
      v-if="showModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closeModal"
    >
      <div class="bg-white dark:bg-surface-dark rounded-xl p-6 w-full max-w-lg border border-gray-200 dark:border-gray-700">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {{ editingTheme ? 'Edit Theme' : 'Add Theme' }}
        </h2>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theme Name *
            </label>
            <input
              v-model="formData.name"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="e.g. Dark Mode, Light Mode"
            />
          </div>

          <!-- Color inputs -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Primary Color
              </label>
              <input
                v-model="formData.primary_color"
                type="color"
                class="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Secondary Color
              </label>
              <input
                v-model="formData.secondary_color"
                type="color"
                class="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Background Color
              </label>
              <input
                v-model="formData.background_color"
                type="color"
                class="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Text Color
              </label>
              <input
                v-model="formData.text_color"
                type="color"
                class="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
            </div>
          </div>

          <!-- Error -->
          <div v-if="error" class="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              type="button"
              @click="closeModal"
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-2 bg-primary hover:bg-opacity-90 text-white rounded-lg transition-colors"
            >
              {{ editingTheme ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
