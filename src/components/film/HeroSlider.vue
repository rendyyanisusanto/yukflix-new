<script setup>
import { ref, onMounted } from 'vue'
import { useFilmStore } from '../../stores/filmStore'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, EffectFade, Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-fade'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

const filmStore = useFilmStore()
const selectedFilm = ref(null)

onMounted(async () => {
  await filmStore.fetchFeaturedFilms()
  if (filmStore.featuredFilms.length > 0) {
    filmStore.activeFeaturedFilm = filmStore.featuredFilms[0]
  }
})

const modules = [Autoplay, EffectFade, Navigation, Pagination]

const formatDuration = (minutes) => {
  if (!minutes) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const getGenres = (film) => {
  return film.film_genres?.map(fg => fg.genres.name).join(', ') || ''
}

const openDetail = (film) => {
  selectedFilm.value = film
}

const closeDetail = () => {
  selectedFilm.value = null
}
</script>

<template>
  <header class="relative h-screen min-h-[600px] w-full overflow-hidden bg-black">
    <!-- Loading State -->
    <div v-if="filmStore.loading && !filmStore.featuredFilms.length" class="h-full w-full flex items-center justify-center">
      <div class="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!filmStore.featuredFilms.length" class="h-full w-full flex items-center justify-center bg-gray-900 text-white">
      <div class="text-center">
        <h2 class="text-2xl font-bold mb-2">No featured films yet</h2>
        <p class="text-gray-400">Add featured films in the admin panel</p>
      </div>
    </div>

    <!-- Slider -->
    <swiper
      v-else
      :modules="modules"
      :slides-per-view="1"
      :effect="'fade'"
      :autoplay="{
        delay: 5000,
        disableOnInteraction: false,
      }"
      :pagination="{
        clickable: true,
      }"
      :loop="true"
      @slideChange="(swiper) => {
        const realIndex = swiper.realIndex
        filmStore.activeFeaturedFilm = filmStore.featuredFilms[realIndex]
      }"
      class="h-full w-full"
    >
      <swiper-slide v-for="film in filmStore.featuredFilms" :key="film.id" class="relative">
        <div class="absolute inset-0">
          <img 
            :src="film.backdrop_url || film.poster_url" 
            :alt="film.title" 
            class="w-full h-full object-cover" 
          />
          <div class="hero-overlay absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
          <div class="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent h-1/3 bottom-0 top-auto"></div>
        </div>
        
        <div class="relative z-10 h-full flex items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <div class="w-full md:w-2/3 lg:w-1/2">
            <div class="glass-panel p-6 md:p-8 rounded-xl shadow-2xl bg-white/5 dark:bg-black/30 backdrop-blur-md border border-white/10 transform transition-all duration-700 hover:bg-black/40">
              <h1 class="font-display text-4xl md:text-6xl font-extrabold text-white mb-2 leading-tight drop-shadow-lg">
                {{ film.title }}
              </h1>
              
              <div class="flex flex-wrap items-center gap-4 text-sm text-gray-300 mb-4 font-medium">
                <span v-if="new Date().getFullYear() === new Date(film.release_date).getFullYear()" class="bg-primary px-2 py-0.5 rounded text-white text-xs font-bold uppercase tracking-wider">New</span>
                <span v-if="film.release_date">{{ new Date(film.release_date).getFullYear() }}</span>
                <span v-if="film.duration_minutes" class="w-1 h-1 bg-gray-500 rounded-full"></span>
                <span v-if="film.duration_minutes">{{ formatDuration(film.duration_minutes) }}</span>
                <span v-if="getGenres(film)" class="w-1 h-1 bg-gray-500 rounded-full"></span>
                <span>{{ getGenres(film) }}</span>
              </div>
              
              <p class="text-gray-200 text-sm md:text-base mb-6 line-clamp-3 leading-relaxed drop-shadow-md">
                {{ film.description }}
              </p>
              
              <div class="flex flex-col sm:flex-row gap-4">
                <button class="flex items-center justify-center gap-2 bg-primary hover:bg-opacity-90 text-white font-bold py-3 px-8 rounded-full transition-transform transform hover:scale-105 shadow-lg shadow-primary/30 w-full sm:w-auto">
                  <span class="material-icons">play_arrow</span>
                  Watch Now
                </button>
                <div class="flex gap-4 w-full sm:w-auto">
                  <button class="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-full backdrop-blur-sm transition-colors border border-white/20">
                    <span class="material-icons">movie</span>
                    Trailer
                  </button>
                  <button 
                    @click="openDetail(film)"
                    class="flex items-center justify-center gap-2 w-12 h-12 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full backdrop-blur-sm transition-colors border border-white/20 flex-shrink-0"
                  >
                    <span class="material-icons">add</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </swiper-slide>
    </swiper>

    <!-- Film Detail Modal -->
    <div 
      v-if="selectedFilm" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      @click.self="closeDetail"
    >
      <div class="bg-surface-dark w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl border border-gray-700 relative animate-fade-in-up">
        <!-- Close Button -->
        <button 
          @click="closeDetail"
          class="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
        >
          <span class="material-icons">close</span>
        </button>

        <!-- Hero Image -->
        <div class="relative h-64 md:h-96 w-full">
          <img 
            :src="selectedFilm.backdrop_url || selectedFilm.poster_url" 
            :alt="selectedFilm.title" 
            class="w-full h-full object-cover"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-surface-dark via-transparent to-transparent"></div>
        </div>

        <!-- Content -->
        <div class="p-8 -mt-20 relative">
          <h2 class="text-4xl md:text-5xl font-display font-bold text-white mb-4 drop-shadow-lg">
            {{ selectedFilm.title }}
          </h2>

          <div class="flex flex-wrap items-center gap-4 text-sm text-gray-300 mb-6 font-medium">
            <span v-if="new Date().getFullYear() === new Date(selectedFilm.release_date).getFullYear()" class="bg-primary px-2 py-0.5 rounded text-white text-xs font-bold uppercase tracking-wider">New</span>
            <span>{{ new Date(selectedFilm.release_date).getFullYear() }}</span>
            <span class="w-1 h-1 bg-gray-500 rounded-full"></span>
            <span>{{ formatDuration(selectedFilm.duration_minutes) }}</span>
            <span class="w-1 h-1 bg-gray-500 rounded-full"></span>
            <span>{{ getGenres(selectedFilm) }}</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="md:col-span-2">
              <p class="text-gray-300 text-lg leading-relaxed mb-6">
                {{ selectedFilm.description }}
              </p>
              
              <div class="flex gap-4">
                <button class="flex items-center justify-center gap-2 bg-primary hover:bg-opacity-90 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105 shadow-lg shadow-primary/30">
                  <span class="material-icons">play_arrow</span>
                  Watch Movie
                </button>
              </div>
            </div>
            
            <div class="space-y-4 text-sm text-gray-400">
              <div>
                <span class="block text-gray-500 mb-1">Genres</span>
                <span class="text-white">{{ getGenres(selectedFilm) }}</span>
              </div>
              <div>
                <span class="block text-gray-500 mb-1">Release Date</span>
                <span class="text-white">{{ new Date(selectedFilm.release_date).toLocaleDateString() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
:deep(.swiper-pagination-bullet) {
  background: white;
  opacity: 0.5;
}
:deep(.swiper-pagination-bullet-active) {
  background: var(--color-primary);
  opacity: 1;
}

.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
