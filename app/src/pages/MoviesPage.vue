<script setup>
import { ref, onMounted, computed } from 'vue'
import { useFilmStore } from '../stores/filmStore'
import { useRouter } from 'vue-router'

const filmStore = useFilmStore()
const router = useRouter()

const searchQuery = ref('')
const selectedGenre = ref('')

onMounted(() => {
  filmStore.fetchAllFilms()
})

const getGenre = (film) => {
  return film.film_genres?.[0]?.genres?.name || 'Movie'
}

const allGenres = computed(() => {
  const genres = new Set()
  filmStore.films.forEach(film => {
    film.film_genres?.forEach(fg => {
      if (fg.genres?.name) genres.add(fg.genres.name)
    })
  })
  return Array.from(genres).sort()
})

const filteredFilms = computed(() => {
  return filmStore.films.filter(film => {
    const matchesSearch = film.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesGenre = selectedGenre.value === '' || film.film_genres?.some(fg => fg.genres?.name === selectedGenre.value)
    return matchesSearch && matchesGenre
  })
})

const getReleaseDateDisplay = (dateString) => {
  if (!dateString) return 'TBA'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}
</script>

<template>
  <main class="min-h-screen pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
    <div class="mb-8">
      <h1 class="text-4xl font-display font-bold text-white mb-6">Movies</h1>
      
      <!-- Filters -->
      <div class="flex flex-col md:flex-row gap-4 mb-8">
        <div class="relative flex-grow max-w-md">
          <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Cari film..." 
            class="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
          >
        </div>
        
        <select 
          v-model="selectedGenre" 
          class="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
        >
          <option value="" class="bg-gray-900 text-white">Semua Genre</option>
          <option v-for="genre in allGenres" :key="genre" :value="genre" class="bg-gray-900 text-white">{{ genre }}</option>
        </select>
      </div>

      <!-- Loading -->
      <div v-if="filmStore.loading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>

      <!-- Grid -->
      <div v-else-if="filteredFilms.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        <router-link 
          v-for="film in filteredFilms" 
          :key="film.id"
          :to="film.embed_url ? `/watch/${film.slug}` : ''"
          :class="[
            'relative rounded-xl overflow-hidden shadow-2xl group aspect-[2/3] block bg-white/5',
            film.embed_url ? 'transition-all duration-300 hover:scale-[1.02] cursor-pointer' : 'opacity-75 cursor-default'
          ]"
          @click="!film.embed_url && $event.preventDefault()"
        >
          <img 
            :alt="film.title" 
            :class="[
              'w-full h-full object-cover object-top',
              film.embed_url ? 'transition-transform duration-700 group-hover:scale-110' : ''
            ]" 
            :src="film.poster_url || film.backdrop_url"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent opacity-90"></div>
          
          <!-- Not Available Overlay -->
          <div v-if="!film.embed_url" class="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
            <span class="bg-black/80 text-white text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full border border-white/20 shadow-lg">Coming Soon</span>
          </div>
          
          <!-- Hover Content -->
          <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
            <span class="inline-block bg-primary text-white text-[10px] w-fit px-2 py-0.5 rounded mb-2 uppercase tracking-wide font-bold">
              {{ getGenre(film) }}
            </span>
            <h3 class="text-sm md:text-base font-display font-bold text-white mb-1 leading-tight line-clamp-2">
              {{ film.title }}
            </h3>
            <p class="text-gray-300 text-[10px] md:text-xs line-clamp-3">
              {{ film.description }}
            </p>
          </div>

          <!-- Default Content -->
          <div class="absolute bottom-0 left-0 right-0 p-3 md:p-4 transition-opacity duration-300 group-hover:opacity-0">
            <h3 class="text-sm md:text-base font-display font-bold text-white mb-1 drop-shadow-md truncate">
              {{ film.title }}
            </h3>
            <span class="text-primary text-[10px] md:text-xs font-bold uppercase tracking-wide">
              {{ getReleaseDateDisplay(film.release_date) }}
            </span>
          </div>
        </router-link>
      </div>

      <!-- Empty -->
      <div v-else class="text-center py-20 text-gray-500">
        <span class="material-icons text-6xl mb-4 opacity-50">movie_filter</span>
        <p class="text-xl">Tidak ada film yang sesuai dengan filter Anda.</p>
      </div>
    </div>
  </main>
</template>
