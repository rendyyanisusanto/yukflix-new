<script setup>
import { ref, onMounted } from 'vue'
import { genreService } from '../../services/genreService'
import { slugify } from '../../utils/slugify'

const genres = ref([])
const loading = ref(true)
const showModal = ref(false)
const editingGenre = ref(null)
const formData = ref({
  name: '',
  slug: ''
})
const error = ref('')

onMounted(async () => {
  await fetchGenres()
  loading.value = false
})

async function fetchGenres() {
  const { data, error: fetchError } = await genreService.getAll()
  if (fetchError) {
    console.error('Error fetching genres:', fetchError)
  } else {
    genres.value = data || []
  }
}

function openModal(genre = null) {
  if (genre) {
    editingGenre.value = genre
    formData.value = {
      name: genre.name,
      slug: genre.slug
    }
  } else {
    editingGenre.value = null
    formData.value = {
      name: '',
      slug: ''
    }
  }
  error.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingGenre.value = null
  formData.value = { name: '', slug: '' }
  error.value = ''
}

function handleNameInput() {
  if (!editingGenre.value) {
    formData.value.slug = slugify(formData.value.name)
  }
}

async function handleSubmit() {
  error.value = ''
  
  if (!formData.value.name || !formData.value.slug) {
    error.value = 'Name and slug are required'
    return
  }

  try {
    if (editingGenre.value) {
      const { error: updateError } = await genreService.update(
        editingGenre.value.id,
        formData.value
      )
      if (updateError) throw updateError
    } else {
      const { error: createError } = await genreService.create(formData.value)
      if (createError) throw createError
    }

    await fetchGenres()
    closeModal()
  } catch (err) {
    error.value = err.message || 'Failed to save genre'
  }
}

async function deleteGenre(id) {
  if (!confirm('Are you sure you want to delete this genre?')) return

  try {
    const { error: deleteError } = await genreService.delete(id)
    if (deleteError) throw deleteError
    
    await fetchGenres()
  } catch (err) {
    alert('Failed to delete genre: ' + err.message)
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
          Genres Management
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Manage film genres and categories
        </p>
      </div>
      <button
        @click="openModal()"
        class="flex items-center gap-2 bg-primary hover:bg-opacity-90 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
      >
        <span class="material-icons">add</span>
        Add Genre
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
    </div>

    <!-- Genres Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div 
        v-for="genre in genres" 
        :key="genre.id"
        class="bg-white dark:bg-surface-dark rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary transition-colors"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {{ genre.name }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ genre.slug }}
            </p>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            @click="openModal(genre)"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            <span class="material-icons text-sm">edit</span>
            Edit
          </button>
          <button
            @click="deleteGenre(genre.id)"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
          >
            <span class="material-icons text-sm">delete</span>
            Delete
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div 
        v-if="genres.length === 0"
        class="col-span-full bg-white dark:bg-surface-dark rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center"
      >
        <span class="material-icons text-6xl text-gray-300 dark:text-gray-600 mb-4">label</span>
        <p class="text-gray-500 dark:text-gray-400 mb-4">No genres yet</p>
        <button
          @click="openModal()"
          class="text-primary hover:underline font-semibold"
        >
          Add your first genre
        </button>
      </div>
    </div>

    <!-- Modal -->
    <div 
      v-if="showModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closeModal"
    >
      <div class="bg-white dark:bg-surface-dark rounded-xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {{ editingGenre ? 'Edit Genre' : 'Add Genre' }}
        </h2>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name *
            </label>
            <input
              v-model="formData.name"
              @input="handleNameInput"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="e.g. Action, Drama, Comedy"
            />
          </div>

          <!-- Slug -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Slug *
            </label>
            <input
              v-model="formData.slug"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="e.g. action, drama, comedy"
            />
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
              {{ editingGenre ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
