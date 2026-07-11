<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import supabase from '../../services/supabase'

const router = useRouter()
const films = ref([])
const loading = ref(true)

onMounted(async () => {
  await fetchFilms()
  loading.value = false
})

async function fetchFilms() {
  try {
    const { data, error } = await supabase
      .from('films')
      .select(`
        *,
        film_genres(
          genres(id, name)
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    films.value = data || []
  } catch (error) {
    console.error('Error fetching films:', error)
  }
}

async function deleteFilm(id) {
  if (!confirm('Are you sure you want to delete this film?')) return
  
  try {
    const { error } = await supabase
      .from('films')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    await fetchFilms()
  } catch (error) {
    console.error('Error deleting film:', error)
    alert('Failed to delete film')
  }
}

function editFilm(id) {
  router.push(`/admin/films/${id}`)
}

function createFilm() {
  router.push('/admin/films/new')
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
          Films Management
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Manage your film library
        </p>
      </div>
      <button
        @click="createFilm"
        class="flex items-center gap-2 bg-primary hover:bg-opacity-90 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
      >
        <span class="material-icons">add</span>
        Add Film
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
    </div>

    <!-- Films table -->
    <div v-else class="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div v-if="films.length === 0" class="p-12 text-center">
        <span class="material-icons text-6xl text-gray-300 dark:text-gray-600 mb-4">movie</span>
        <p class="text-gray-500 dark:text-gray-400 mb-4">No films yet</p>
        <button
          @click="createFilm"
          class="text-primary hover:underline font-semibold"
        >
          Add your first film
        </button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Film
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Duration
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Release Date
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr 
              v-for="film in films" 
              :key="film.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-4">
                  <img 
                    v-if="film.poster_url"
                    :src="film.poster_url" 
                    :alt="film.title"
                    class="w-12 h-16 object-cover rounded"
                  />
                  <div v-else class="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                    <span class="material-icons text-gray-400 text-sm">movie</span>
                  </div>
                  <div>
                    <p class="font-semibold text-gray-900 dark:text-white">{{ film.title }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">{{ film.slug }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                {{ film.duration_minutes ? `${film.duration_minutes} min` : '-' }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                {{ film.release_date ? new Date(film.release_date).toLocaleDateString() : '-' }}
              </td>
              <td class="px-6 py-4">
                <div class="flex gap-2">
                  <span 
                    v-if="film.is_featured"
                    class="px-2 py-1 text-xs font-semibold bg-primary/20 text-primary rounded"
                  >
                    Featured
                  </span>
                  <span 
                    v-if="film.is_coming_soon"
                    class="px-2 py-1 text-xs font-semibold bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded"
                  >
                    Coming Soon
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="editFilm(film.id)"
                    class="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <span class="material-icons text-xl">edit</span>
                  </button>
                  <button
                    @click="deleteFilm(film.id)"
                    class="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <span class="material-icons text-xl">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
