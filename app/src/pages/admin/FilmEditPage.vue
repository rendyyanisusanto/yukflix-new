<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { filmService } from '../../services/filmService'
import { genreService } from '../../services/genreService'
import { slugify } from '../../utils/slugify'

const router = useRouter()
const route = useRoute()

const isEditing = ref(false)
const filmId = ref(null)
const loading = ref(true)
const saving = ref(false)
const genres = ref([])
const error = ref('')

const formData = ref({
  title: '',
  slug: '',
  description: '',
  duration_minutes: null,
  release_date: '',
  poster_url: '',
  backdrop_url: '',
  embed_url: '',
  trailers_url: '',
  is_featured: false,
  is_coming_soon: false,
  selected_genres: []
})

const posterFile = ref(null)
const backdropFile = ref(null)
const uploading = ref({ poster: false, backdrop: false })
const btsList = ref([])
const btsForm = ref({
  title: '',
  media_type: 'photo',
  thumbnail_url: ''
})
const btsFile = ref(null)
const uploadingBTS = ref(false)

// ... inside loadFilm ...
// btsList.value = data.behind_the_scenes || []

async function handleBTSUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  
  uploadingBTS.value = true
  try {
    const { data, error: uploadError } = await filmService.uploadBTSThumbnail(file)
    if (uploadError) throw uploadError
    
    btsForm.value.thumbnail_url = data.url
    btsFile.value = file
  } catch (err) {
    alert('Failed to upload thumbnail: ' + err.message)
  } finally {
    uploadingBTS.value = false
  }
}

async function addBTSItem() {
  if (!filmId.value) return
  if (!btsForm.value.title || !btsForm.value.thumbnail_url) {
    alert('Title and thumbnail are required')
    return
  }

  try {
    const { data, error } = await filmService.addBTS({
      film_id: filmId.value,
      title: btsForm.value.title,
      media_type: btsForm.value.media_type,
      thumbnail_url: btsForm.value.thumbnail_url
    })

    if (error) throw error

    btsList.value.unshift(data)
    
    // Reset form
    btsForm.value = {
      title: '',
      media_type: 'photo',
      thumbnail_url: ''
    }
    btsFile.value = null
  } catch (err) {
    alert('Failed to add BTS item: ' + err.message)
  }
}

async function removeBTSItem(id) {
  if (!confirm('Are you sure?')) return

  try {
    const { error } = await filmService.deleteBTS(id)
    if (error) throw error

    btsList.value = btsList.value.filter(item => item.id !== id)
  } catch (err) {
    alert('Failed to delete item: ' + err.message)
  }
}

onMounted(async () => {
  await fetchGenres()
  
  // Check if editing
  if (route.params.id && route.params.id !== 'new') {
    isEditing.value = true
    filmId.value = route.params.id
    await loadFilm()
  }
  
  loading.value = false
})

async function fetchGenres() {
  const { data } = await genreService.getAll()
  genres.value = data || []
}

async function loadFilm() {
  try {
    const { data, error: fetchError } = await filmService.getById(filmId.value)
    if (fetchError) throw fetchError
    
    formData.value = {
      title: data.title,
      slug: data.slug,
      description: data.description || '',
      duration_minutes: data.duration_minutes,
      release_date: data.release_date || '',
      poster_url: data.poster_url || '',
      backdrop_url: data.backdrop_url || '',
      embed_url: data.embed_url || '',
      trailers_url: data.trailers_url || '',
      is_featured: data.is_featured,
      is_coming_soon: data.is_coming_soon,
      selected_genres: data.film_genres?.map(fg => fg.genre_id) || []
    }
    btsList.value = data.behind_the_scenes || []
  } catch (err) {
    error.value = 'Failed to load film'
    console.error(err)
  }
}

function handleTitleInput() {
  if (!isEditing.value) {
    formData.value.slug = slugify(formData.value.title)
  }
}

async function handlePosterUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  
  uploading.value.poster = true
  try {
    const { data, error: uploadError } = await filmService.uploadPoster(file)
    if (uploadError) throw uploadError
    
    formData.value.poster_url = data.url
    posterFile.value = file
  } catch (err) {
    alert('Failed to upload poster: ' + err.message)
  } finally {
    uploading.value.poster = false
  }
}

async function handleBackdropUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  
  uploading.value.backdrop = true
  try {
    const { data, error: uploadError } = await filmService.uploadBackdrop(file)
    if (uploadError) throw uploadError
    
    formData.value.backdrop_url = data.url
    backdropFile.value = file
  } catch (err) {
    alert('Failed to upload backdrop: ' + err.message)
  } finally {
    uploading.value.backdrop = false
  }
}

async function handleSubmit() {
  error.value = ''
  saving.value = true
  
  if (!formData.value.title || !formData.value.slug) {
    error.value = 'Title and slug are required'
    saving.value = false
    return
  }

  try {
    const filmData = {
      title: formData.value.title,
      slug: formData.value.slug,
      description: formData.value.description,
      duration_minutes: formData.value.duration_minutes,
      release_date: formData.value.release_date || null,
      poster_url: formData.value.poster_url,
      backdrop_url: formData.value.backdrop_url,
      embed_url: formData.value.embed_url || null,
      trailers_url: formData.value.trailers_url || null,
      is_featured: formData.value.is_featured,
      is_coming_soon: formData.value.is_coming_soon
    }

    let resultFilmId = filmId.value

    if (isEditing.value) {
      const { error: updateError } = await filmService.update(filmId.value, filmData)
      if (updateError) throw updateError
    } else {
      const { data, error: createError } = await filmService.create(filmData)
      if (createError) throw createError
      resultFilmId = data.id
    }

    // Set genres
    await filmService.setGenres(resultFilmId, formData.value.selected_genres)

    router.push('/admin/films')
  } catch (err) {
    error.value = err.message || 'Failed to save film'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center gap-4 mb-8">
      <button
        @click="router.push('/admin/films')"
        class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <span class="material-icons text-gray-600 dark:text-gray-400">arrow_back</span>
      </button>
      <div>
        <h1 class="text-3xl font-display font-bold text-gray-900 dark:text-white">
          {{ isEditing ? 'Edit Film' : 'Add New Film' }}
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          {{ isEditing ? 'Update film information' : 'Create a new film entry' }}
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Basic Information -->
      <div class="bg-white dark:bg-surface-dark rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">Basic Information</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Title -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              v-model="formData.title"
              @input="handleTitleInput"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Impian 1000 Pulau"
            />
          </div>

          <!-- Slug -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Slug *
            </label>
            <input
              v-model="formData.slug"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="impian-1000-pulau"
            />
          </div>

          <!-- Embed URL -->
          <div class="md:col-span-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Embed URL
            </label>
            <input
              v-model="formData.embed_url"
              type="url"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://player.vdocipher.com/v2/?otp=..."
            />
          </div>

          <!-- Trailer URL -->
          <div class="md:col-span-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Trailer URL
            </label>
            <input
              v-model="formData.trailers_url"
              type="url"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          <!-- Description -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              v-model="formData.description"
              rows="4"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="A visually stunning journey across the archipelago..."
            ></textarea>
          </div>

          <!-- Duration -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duration (minutes)
            </label>
            <input
              v-model.number="formData.duration_minutes"
              type="number"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="118"
            />
          </div>

          <!-- Release Date -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Release Date
            </label>
            <input
              v-model="formData.release_date"
              type="date"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <!-- Images -->
      <div class="bg-white dark:bg-surface-dark rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">Images</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Poster -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Poster Image
            </label>
            <div class="space-y-3">
              <div v-if="formData.poster_url" class="relative">
                <img :src="formData.poster_url" class="w-full h-64 object-cover rounded-lg" alt="Poster" />
              </div>
              <input
                type="file"
                accept="image/*"
                @change="handlePosterUpload"
                class="w-full text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-opacity-90"
              />
              <p v-if="uploading.poster" class="text-sm text-primary">Uploading...</p>
            </div>
          </div>

          <!-- Backdrop -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Backdrop Image
            </label>
            <div class="space-y-3">
              <div v-if="formData.backdrop_url" class="relative">
                <img :src="formData.backdrop_url" class="w-full h-64 object-cover rounded-lg" alt="Backdrop" />
              </div>
              <input
                type="file"
                accept="image/*"
                @change="handleBackdropUpload"
                class="w-full text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-opacity-90"
              />
              <p v-if="uploading.backdrop" class="text-sm text-primary">Uploading...</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Genres & Flags -->
      <div class="bg-white dark:bg-surface-dark rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">Categories & Status</h2>
        
        <div class="space-y-6">
          <!-- Genres -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Genres
            </label>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <label 
                v-for="genre in genres" 
                :key="genre.id"
                class="flex items-center gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <input
                  type="checkbox"
                  :value="genre.id"
                  v-model="formData.selected_genres"
                  class="rounded text-primary focus:ring-primary"
                />
                <span class="text-sm text-gray-900 dark:text-white">{{ genre.name }}</span>
              </label>
            </div>
          </div>

          <!-- Flags -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="flex items-center gap-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <input
                type="checkbox"
                v-model="formData.is_featured"
                class="rounded text-primary focus:ring-primary"
              />
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Featured</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Show in hero slider</p>
              </div>
            </label>

            <label class="flex items-center gap-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <input
                type="checkbox"
                v-model="formData.is_coming_soon"
                class="rounded text-primary focus:ring-primary"
              />
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Coming Soon</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Display in coming soon section</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Behind The Scenes -->
      <div class="bg-white dark:bg-surface-dark rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">Behind The Scenes</h2>
        
        <div v-if="!filmId" class="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
          Please save the film first to add Behind The Scenes content.
        </div>

        <div v-else class="space-y-6">
          <!-- Add New BTS -->
          <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 class="text-sm font-bold text-gray-900 dark:text-white mb-4">Add New Item</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input 
                  v-model="btsForm.title"
                  type="text" 
                  class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="Director's Commentary"
                >
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <select 
                  v-model="btsForm.media_type"
                  class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="photo">Photo</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div class="md:col-span-2">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Thumbnail</label>
                <div class="flex items-center gap-4">
                  <div v-if="btsForm.thumbnail_url" class="relative w-20 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                    <img :src="btsForm.thumbnail_url" class="w-full h-full object-cover" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    @change="handleBTSUpload"
                    class="w-full text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-opacity-90"
                  />
                </div>
                <p v-if="uploadingBTS" class="text-xs text-primary mt-1">Uploading thumbnail...</p>
              </div>
            </div>
            <div class="mt-4 flex justify-end">
              <button 
                type="button"
                @click="addBTSItem"
                :disabled="uploadingBTS || !btsForm.title || !btsForm.thumbnail_url"
                class="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-lg hover:bg-opacity-90 disabled:opacity-50"
              >
                Add Item
              </button>
            </div>
          </div>

          <!-- List of BTS -->
          <div class="space-y-3">
            <div 
              v-for="item in btsList" 
              :key="item.id"
              class="flex items-center gap-4 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <img :src="item.thumbnail_url" class="w-16 h-10 object-cover rounded" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ item.title }}</p>
                <p class="text-xs text-gray-500 capitalize">{{ item.media_type }}</p>
              </div>
              <button 
                @click="removeBTSItem(item.id)"
                class="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
              >
                <span class="material-icons text-sm">delete</span>
              </button>
            </div>
            <p v-if="btsList.length === 0" class="text-center text-sm text-gray-500 py-4">
              No Behind The Scenes content yet.
            </p>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
        <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
      </div>

      <!-- Actions -->
      <div class="flex gap-4">
        <button
          type="button"
          @click="router.push('/admin/films')"
          class="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="saving || uploading.poster || uploading.backdrop"
          class="px-6 py-3 bg-primary hover:bg-opacity-90 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="saving">Saving...</span>
          <span v-else>{{ isEditing ? 'Update Film' : 'Create Film' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>
