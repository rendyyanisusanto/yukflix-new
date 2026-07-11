<script setup>
import { ref, onMounted } from 'vue'
import supabase from '../../services/supabase'

const stats = ref({
  totalFilms: 0,
  totalGenres: 0,
  comingSoon: 0,
  featured: 0
})

const recentFilms = ref([])
const loading = ref(true)

onMounted(async () => {
  await fetchStats()
  await fetchRecentFilms()
  loading.value = false
})

async function fetchStats() {
  try {
    // Count total films
    const { count: filmsCount } = await supabase
      .from('films')
      .select('*', { count: 'exact', head: true })
    stats.value.totalFilms = filmsCount || 0

    // Count genres
    const { count: genresCount } = await supabase
      .from('genres')
      .select('*', { count: 'exact', head: true })
    stats.value.totalGenres = genresCount || 0

    // Count coming soon
    const { count: comingSoonCount } = await supabase
      .from('films')
      .select('*', { count: 'exact', head: true })
      .eq('is_coming_soon', true)
    stats.value.comingSoon = comingSoonCount || 0

    // Count featured
    const { count: featuredCount } = await supabase
      .from('films')
      .select('*', { count: 'exact', head: true })
      .eq('is_featured', true)
    stats.value.featured = featuredCount || 0
  } catch (error) {
    console.error('Error fetching stats:', error)
  }
}

async function fetchRecentFilms() {
  try {
    const { data, error } = await supabase
      .from('films')
      .select('id, title, created_at, poster_url')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) throw error
    recentFilms.value = data || []
  } catch (error) {
    console.error('Error fetching recent films:', error)
  }
}
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
        Dashboard
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Welcome to YukFlix Admin Panel
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
    </div>

    <!-- Stats grid -->
    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Total Films -->
        <div class="bg-white dark:bg-surface-dark rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Films</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ stats.totalFilms }}</p>
            </div>
            <div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <span class="material-icons text-blue-600 dark:text-blue-400 text-3xl">movie</span>
            </div>
          </div>
        </div>

        <!-- Total Genres -->
        <div class="bg-white dark:bg-surface-dark rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Genres</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ stats.totalGenres }}</p>
            </div>
            <div class="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <span class="material-icons text-green-600 dark:text-green-400 text-3xl">label</span>
            </div>
          </div>
        </div>

        <!-- Coming Soon -->
        <div class="bg-white dark:bg-surface-dark rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Coming Soon</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ stats.comingSoon }}</p>
            </div>
            <div class="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <span class="material-icons text-purple-600 dark:text-purple-400 text-3xl">upcoming</span>
            </div>
          </div>
        </div>

        <!-- Featured -->
        <div class="bg-white dark:bg-surface-dark rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Featured</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ stats.featured }}</p>
            </div>
            <div class="p-3 bg-primary/20 rounded-lg">
              <span class="material-icons text-primary text-3xl">star</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Films -->
      <div class="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-display font-bold text-gray-900 dark:text-white">
            Recent Films
          </h2>
        </div>
        <div class="p-6">
          <div v-if="recentFilms.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
            No films yet. Add your first film to get started!
          </div>
          <div v-else class="space-y-4">
            <div 
              v-for="film in recentFilms" 
              :key="film.id"
              class="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <img 
                v-if="film.poster_url"
                :src="film.poster_url" 
                :alt="film.title"
                class="w-16 h-24 object-cover rounded"
              />
              <div v-else class="w-16 h-24 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                <span class="material-icons text-gray-400">movie</span>
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 dark:text-white">{{ film.title }}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Added {{ new Date(film.created_at).toLocaleDateString() }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
