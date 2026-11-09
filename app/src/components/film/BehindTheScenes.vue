<script setup>
import { ref } from 'vue'
import { useFilmStore } from '../../stores/filmStore'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'

const filmStore = useFilmStore()
const swiperInstance = ref(null)
const selectedBTS = ref(null)

const onSwiper = (swiper) => {
  swiperInstance.value = swiper
}

const slidePrev = () => {
  swiperInstance.value?.slidePrev()
}

const slideNext = () => {
  swiperInstance.value?.slideNext()
}

const openDetail = (bts) => {
  selectedBTS.value = bts
}

const closeDetail = () => {
  selectedBTS.value = null
}
</script>

<template>
  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16" v-if="filmStore.activeFeaturedFilm && filmStore.activeFeaturedFilm.behind_the_scenes?.length">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-display font-bold text-gray-900 dark:text-white border-l-4 border-primary pl-4">
        Behind The Scenes: <span class="text-primary">{{ filmStore.activeFeaturedFilm.title }}</span>
      </h2>
      <div class="flex gap-2">
        <button 
          @click="slidePrev"
          class="bg-surface-light dark:bg-surface-dark p-2 rounded-full shadow hover:bg-primary hover:text-white transition text-gray-500 dark:text-gray-400 group"
        >
          <span class="material-icons text-sm group-hover:text-white">arrow_back_ios</span>
        </button>
        <button 
          @click="slideNext"
          class="bg-surface-light dark:bg-surface-dark p-2 rounded-full shadow hover:bg-primary hover:text-white transition text-gray-500 dark:text-gray-400 group"
        >
          <span class="material-icons text-sm group-hover:text-white">arrow_forward_ios</span>
        </button>
      </div>
    </div>
    
    <swiper
      :modules="[Navigation, Autoplay]"
      :slides-per-view="1"
      :space-between="24"
      :autoplay="{
        delay: 3500,
        disableOnInteraction: false,
        pauseOnMouseEnter: true
      }"
      :breakpoints="{
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 }
      }"
      @swiper="onSwiper"
      class="w-full"
    >
      <swiper-slide 
        v-for="bts in filmStore.activeFeaturedFilm.behind_the_scenes" 
        :key="bts.id"
      >
        <div 
          @click="openDetail(bts)"
          class="group relative overflow-hidden rounded-xl aspect-video cursor-pointer shadow-lg bg-gray-900"
        >
          <img 
            :alt="bts.title" 
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-90 group-hover:opacity-100" 
            :src="bts.thumbnail_url"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
            <h3 class="text-white font-bold text-lg leading-tight mb-1">{{ bts.title }}</h3>
            <p class="text-gray-300 text-xs uppercase tracking-wider font-semibold">{{ bts.media_type }}</p>
          </div>
          <div class="absolute top-4 right-4 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs text-white font-medium flex items-center gap-1">
            <span class="material-icons text-xs">camera_alt</span> BTS
          </div>
          
          <!-- Icon Overlay -->
          <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div class="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/50">
              <span class="material-icons text-white text-2xl ml-1">
                {{ bts.media_type === 'photo' || bts.media_type === 'image' ? 'visibility' : 'play_arrow' }}
              </span>
            </div>
          </div>
        </div>
      </swiper-slide>
    </swiper>

    <!-- Detail Modal -->
    <div 
      v-if="selectedBTS" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
      @click.self="closeDetail"
    >
      <div class="w-full max-w-5xl bg-transparent relative animate-fade-in-up">
        <button 
          @click="closeDetail"
          class="absolute -top-12 right-0 z-10 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        >
          <span class="material-icons">close</span>
        </button>
        
        <div class="rounded-xl overflow-hidden shadow-2xl bg-black">
          <!-- Image View -->
          <img 
            v-if="selectedBTS.media_type === 'photo' || selectedBTS.media_type === 'image'"
            :src="selectedBTS.thumbnail_url" 
            :alt="selectedBTS.title"
            class="w-full h-auto max-h-[80vh] object-contain"
          />
          
          <!-- Video View (Placeholder for now) -->
          <div v-else class="aspect-video bg-black flex items-center justify-center">
             <iframe 
               v-if="selectedBTS.video_url"
               :src="selectedBTS.video_url" 
               class="w-full h-full" 
               frameborder="0" 
               allowfullscreen
             ></iframe>
             <div v-else class="text-center p-8">
               <span class="material-icons text-6xl text-gray-500 mb-4">movie_filter</span>
               <p class="text-gray-400">Video playback not configured yet.</p>
             </div>
          </div>
        </div>
        
        <div class="mt-4 text-white">
          <h3 class="text-xl font-bold">{{ selectedBTS.title }}</h3>
          <p class="text-gray-400 text-sm mt-1 capitalize">{{ selectedBTS.media_type }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
