<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { filmService } from '../services/filmService'
import Navbar from '../components/ui/Navbar.vue'
import { useWalletStore } from '../stores/walletStore'

const route = useRoute()
const router = useRouter()
const walletStore = useWalletStore()

const film = ref(null)
const loading = ref(true)

onMounted(async () => {
    try {
        const slug = route.params.slug
        const { data, error } = await filmService.getBySlug(slug)
        
        if (error) throw error
        film.value = data
    } catch (err) {
        console.error('Error fetching film:', err)
    } finally {
        loading.value = false
    }
})

const goBack = () => {
    if (window.history.length > 2) {
        router.back()
    } else {
        router.push('/')
    }
}

const handleConnect = async () => {
    await walletStore.connect()
}

// DEMO MODE
// Sementara digunakan untuk presentasi client.
// Jangan dihapus karena fitur MetaMask akan diaktifkan kembali.
const handleConnectDemo = async () => {
    await walletStore.connectDemo()
}
</script>

<template>
  <div class="min-h-screen bg-[#09090B] text-white flex flex-col font-sans relative overflow-x-hidden">
    <!-- Dynamic Cinematic Background -->
    <div 
      v-if="film?.backdrop_url" 
      class="absolute inset-0 z-0 opacity-20 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
      :style="{ backgroundImage: `url(${film.backdrop_url})` }"
    ></div>
    <!-- Gradient Overlay to blend the background -->
    <div class="absolute inset-0 z-0 bg-gradient-to-b from-[#09090B]/50 via-[#09090B]/80 to-[#09090B]"></div>

    <!-- Ensure Navbar is above the background -->
    <div class="relative z-20 w-full">
      <Navbar />
    </div>

    <!-- Main Content wrapper with z-index to stay above background -->
    <main class="relative z-10 flex-grow pb-24 pt-24 md:pt-32 flex flex-col items-center w-full">
      <!-- Back Button -->
      <div class="w-full max-w-[1200px] px-4 xl:px-0 mb-4 md:mb-6">
        <button @click="goBack" class="inline-flex items-center text-gray-400 hover:text-white transition-colors group text-sm md:text-base font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 md:h-5 md:w-5 mr-1.5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Browse
        </button>
      </div>

      <!-- Loading Skeleton -->
      <div v-if="loading" class="w-full max-w-[1200px] px-4 xl:px-0 animate-pulse">
        <div class="w-full aspect-video bg-white/5 rounded-xl md:rounded-2xl mb-8 md:mb-12 border border-white/10 shadow-2xl"></div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2">
            <div class="h-10 md:h-12 bg-white/5 rounded-lg w-3/4 md:w-1/2 mb-6"></div>
            <div class="flex gap-3 mb-8">
              <div class="h-8 bg-white/5 rounded-md w-16"></div>
              <div class="h-8 bg-white/5 rounded-md w-20"></div>
              <div class="h-8 bg-white/5 rounded-md w-24"></div>
            </div>
            <div class="space-y-4">
              <div class="h-4 bg-white/5 rounded w-full"></div>
              <div class="h-4 bg-white/5 rounded w-full"></div>
              <div class="h-4 bg-white/5 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Access Denied State (Wallet not connected) -->
      <div v-else-if="!walletStore.isConnected" class="text-center p-8 md:p-16 flex flex-col items-center justify-center flex-grow z-10 w-full max-w-2xl mx-auto">
        <div class="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <span class="material-icons text-5xl text-red-500">lock</span>
        </div>
        <h2 class="text-3xl font-display font-bold text-white mb-4">Akses Ditolak</h2>
        <p class="text-gray-400 text-lg mb-8 leading-relaxed">
          Untuk menonton film ini Anda harus menghubungkan wallet terlebih dahulu.
        </p>

        <template v-if="walletStore.ENABLE_METAMASK_VERIFICATION">
          <template v-if="!walletStore.hasMetaMask()">
            <a 
              href="https://metamask.io/download/" 
              target="_blank"
              class="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
            >
              <span>Install MetaMask</span>
              <span class="material-icons text-sm">open_in_new</span>
            </a>
          </template>
          <template v-else>
            <button 
              @click="handleConnect"
              :disabled="walletStore.loading"
              class="px-8 py-4 bg-primary hover:bg-opacity-90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <span v-if="walletStore.loading" class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
              <span class="material-icons" v-else>account_balance_wallet</span>
              <span>{{ walletStore.loading ? 'Menghubungkan...' : 'Connect Wallet' }}</span>
            </button>
          </template>
        </template>
        
        <!-- DEMO MODE: Verifikasi Pembayaran -->
        <template v-else>
          <button 
            @click="handleConnectDemo"
            :disabled="walletStore.loading"
            class="px-8 py-4 bg-primary hover:bg-opacity-90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <span v-if="walletStore.loading" class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
            <span class="material-icons" v-else>account_balance_wallet</span>
            <span>{{ walletStore.loading ? 'Memverifikasi...' : 'Verifikasi Pembayaran (Demo)' }}</span>
          </button>
        </template>
        
        <p v-if="walletStore.error" class="mt-6 text-red-400 text-sm p-3 bg-red-500/10 rounded-lg border border-red-500/20">
          {{ walletStore.error }}
        </p>
      </div>

      <!-- Content (Wallet Connected) -->
      <div v-else-if="film" class="w-full flex flex-col items-center animate-fade-in-up">
        <!-- Video Player Section -->
        <div class="w-full max-w-[1200px] mb-8 md:mb-12 px-0 md:px-4 xl:px-0 relative group">
          <div v-if="film.embed_url" class="relative w-full aspect-video bg-black md:rounded-2xl overflow-hidden shadow-[0_10px_50px_rgba(0,0,0,0.8)] md:ring-1 ring-white/10 group-hover:ring-white/20 transition-all duration-500">
            <iframe
              :src="film.embed_url"
              class="absolute top-0 left-0 w-full h-full"
              allowfullscreen
              allow="encrypted-media; autoplay"
              loading="lazy"
              frameborder="0"
            ></iframe>
          </div>
          <!-- Empty State (No embed_url) -->
          <div v-else class="w-full aspect-video bg-zinc-900 md:rounded-2xl border border-zinc-800/50 flex items-center justify-center shadow-[0_10px_50px_rgba(0,0,0,0.8)]">
            <div class="text-center p-6">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-zinc-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p class="text-zinc-400 text-lg md:text-xl font-medium">Video is currently unavailable.</p>
              <p class="text-zinc-600 text-sm md:text-base mt-2">Please check back later for updates.</p>
            </div>
          </div>
        </div>

        <!-- Film Details -->
        <div class="w-full max-w-[1200px] px-4 xl:px-0 grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
          <!-- Main Info -->
          <div class="lg:col-span-2">
            <h1 class="text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-6 drop-shadow-md text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              {{ film.title }}
            </h1>
            
            <div class="flex flex-wrap items-center gap-3 text-sm md:text-base font-medium mb-8">
              <span v-if="film.release_date" class="px-3 py-1.5 bg-white/10 rounded-md backdrop-blur-sm border border-white/5">
                {{ new Date(film.release_date).getFullYear() }}
              </span>
              <span class="px-3 py-1.5 bg-white/10 rounded-md backdrop-blur-sm border border-white/5 text-gray-200">
                {{ film.duration_minutes }} min
              </span>
              <span v-if="film.film_genres && film.film_genres.length" class="text-primary tracking-wider uppercase text-xs md:text-sm font-bold ml-2">
                {{ film.film_genres.map(g => g.genres.name).join(', ') }}
              </span>
            </div>
            
            <div class="prose prose-invert prose-lg max-w-none">
              <p class="text-gray-300 leading-relaxed text-lg md:text-xl font-light">
                {{ film.description }}
              </p>
            </div>
          </div>
          
          <!-- Sidebar Info -->
          <div class="space-y-6">
            <div v-if="film.behind_the_scenes && film.behind_the_scenes.length > 0" class="bg-white/5 rounded-2xl p-6 md:p-8 backdrop-blur-sm border border-white/10 shadow-xl">
              <h3 class="text-xl font-bold mb-6 text-white flex items-center gap-2">
                <span class="material-icons text-primary">movie_filter</span>
                Behind The Scenes
              </h3>
              <div class="space-y-5">
                <div v-for="bts in film.behind_the_scenes" :key="bts.id" class="flex gap-4 items-center group cursor-pointer">
                  <div class="w-24 h-16 rounded-xl overflow-hidden relative flex-shrink-0 border border-white/10 shadow-md">
                    <img :src="bts.thumbnail_url" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div class="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                      <span class="material-icons text-white/80 group-hover:text-white group-hover:scale-110 transition-all text-sm">
                        {{ bts.media_type === 'video' ? 'play_arrow' : 'photo_camera' }}
                      </span>
                    </div>
                  </div>
                  <p class="text-sm font-medium text-gray-300 group-hover:text-white transition-colors line-clamp-2 leading-snug">
                    {{ bts.title }}
                  </p>
                </div>
              </div>
            </div>
            
            <div v-else class="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10 flex items-center justify-center h-32 opacity-50">
               <p class="text-gray-500 text-sm">No additional content available.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="text-center p-12 flex flex-col items-center justify-center flex-grow z-10">
        <div class="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p class="text-red-400 font-medium text-xl mb-8">Film tidak ditemukan atau terjadi kesalahan.</p>
        <button @click="goBack" class="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors font-medium border border-white/10 backdrop-blur-sm">
          Kembali ke Beranda
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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
