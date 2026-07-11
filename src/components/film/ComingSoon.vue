<script setup>
import { onMounted } from 'vue'
import { useFilmStore } from '../../stores/filmStore'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'

const filmStore = useFilmStore()
const modules = [Autoplay, Navigation]

onMounted(() => {
  filmStore.fetchComingSoonFilms()
})

const getGenre = (film) => {
  return film.film_genres?.[0]?.genres?.name || 'Movie'
}

const getReleaseDateDisplay = (dateString) => {
  if (!dateString) return 'Coming Soon'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}
</script>

<template>
  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
    <h2 class="text-2xl font-display font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-2">
      <span class="material-icons text-primary">upcoming</span> Coming Soon
    </h2>

    <!-- Loading State -->
    <div v-if="filmStore.loading && !filmStore.comingSoonFilms.length" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!filmStore.comingSoonFilms.length" class="text-center py-12 text-gray-500 dark:text-gray-400">
      <p>No upcoming movies at the moment.</p>
    </div>

    <!-- Slider -->
    <div v-else class="relative">
      <swiper
        :modules="modules"
        :slides-per-view="1"
        :space-between="24"
        :navigation="true"
        :autoplay="{
          delay: 3000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true
        }"
        :breakpoints="{
          '640': {
            slidesPerView: 2,
            spaceBetween: 20,
          },
          '1024': {
            slidesPerView: 3,
            spaceBetween: 24,
          }
        }"
        class="coming-soon-slider !pb-12"
      >
        <swiper-slide 
          v-for="film in filmStore.comingSoonFilms" 
          :key="film.id"
          class="h-auto"
        >
          <div class="relative rounded-xl overflow-hidden shadow-2xl group transition-all duration-300 hover:scale-[1.02] h-full">
            <div class="aspect-[2/3] w-full relative">
              <img 
                :alt="film.title" 
                class="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110" 
                :src="film.poster_url || film.backdrop_url"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent opacity-90"></div>
              
              <!-- Hover Content -->
              <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                <span class="inline-block bg-primary text-white text-[10px] w-fit px-2 py-0.5 rounded mb-2 uppercase tracking-wide font-bold">
                  {{ getGenre(film) }}
                </span>
                <h3 class="text-xl font-display font-bold text-white mb-1 leading-tight">
                  {{ film.title }}
                </h3>
                <p class="text-gray-300 text-xs mb-3 line-clamp-3">
                  {{ film.description }}
                </p>
                <button class="w-full text-white border border-white hover:bg-white hover:text-black py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">
                  Remind Me
                </button>
              </div>

              <!-- Default Content (Visible initially) -->
              <div class="absolute bottom-0 left-0 right-0 p-4 transition-opacity duration-300 group-hover:opacity-0">
                <h3 class="text-lg font-display font-bold text-white mb-1 drop-shadow-md">
                  {{ film.title }}
                </h3>
                <span class="text-primary text-xs font-bold uppercase tracking-wide">
                  {{ getReleaseDateDisplay(film.release_date) }}
                </span>
              </div>
            </div>
          </div>
        </swiper-slide>
      </swiper>
    </div>
  </section>
</template>

<style scoped>
:deep(.swiper-button-next),
:deep(.swiper-button-prev) {
  color: var(--color-primary);
  background: rgba(0, 0, 0, 0.5);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  backdrop-filter: blur(4px);
}

:deep(.swiper-button-next:after),
:deep(.swiper-button-prev:after) {
  font-size: 18px;
  font-weight: bold;
}

:deep(.swiper-button-disabled) {
  opacity: 0.35;
  cursor: auto;
  pointer-events: none;
}
</style>
