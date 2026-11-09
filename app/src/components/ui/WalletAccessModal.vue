<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWalletStore } from '../../stores/walletStore'

const showDemoToast = ref(false)

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  targetSlug: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close'])
const router = useRouter()
const walletStore = useWalletStore()

const handleConnect = async () => {
  await walletStore.connect()
}

// DEMO MODE
// Sementara digunakan untuk presentasi client.
// Jangan dihapus karena fitur MetaMask akan diaktifkan kembali.
const handleConnectDemo = async () => {
  await walletStore.connectDemo()
  showDemoToast.value = true
  setTimeout(() => {
    showDemoToast.value = false
  }, 3000)
}

const handleWatch = () => {
  emit('close')
  router.push(`/watch/${props.targetSlug}`)
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" @click="$emit('close')"></div>
    
    <!-- Modal -->
    <div class="relative bg-[#121212] w-full max-w-md rounded-2xl overflow-hidden border border-white/10 shadow-2xl animate-fade-in-up">
      <!-- Header -->
      <div class="relative h-24 md:h-32 bg-gradient-to-r from-primary/20 to-purple-500/20 flex items-center justify-center border-b border-white/5">
        <div class="absolute inset-0 bg-black/20 mix-blend-overlay"></div>
        <div class="z-10 text-center px-8">
          <h2 class="text-xl md:text-2xl font-bold text-white drop-shadow-md">
            {{ walletStore.hasMetaMask() && !walletStore.isConnected ? 'Hubungkan Wallet Anda' : 'Akses Menonton' }}
          </h2>
        </div>
        <button @click="$emit('close')" class="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors bg-black/40 hover:bg-black/60 rounded-full w-8 h-8 flex items-center justify-center z-20">
          <span class="material-icons text-sm">close</span>
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 md:p-8 flex flex-col items-center text-center">
        <!-- Error State from Wallet Store -->
        <div v-if="walletStore.error" class="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {{ walletStore.error }}
        </div>

        <!-- Not Connected State -->
        <template v-if="!walletStore.isConnected">
          <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
            <span class="material-icons text-3xl text-gray-400">account_balance_wallet</span>
          </div>
          
          <p class="text-gray-300 text-sm md:text-base mb-8 leading-relaxed">
            Untuk menonton film ini, silakan lakukan pembayaran melalui <span class="font-bold text-white">OneMangrove</span> dan verifikasi wallet Anda.
          </p>

          <div class="w-full flex flex-col gap-3">
            <!-- Payment Button -->
            <a 
              href="https://onemangrove.com/home/impian-1000-pulau" 
              target="_blank"
              class="w-full py-3.5 px-4 bg-primary hover:bg-opacity-90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              <span>Lakukan Pembayaran</span>
              <span class="material-icons text-sm">open_in_new</span>
            </a>
            
            <!-- Verify Wallet Button (Original MetaMask) -->
            <template v-if="walletStore.ENABLE_METAMASK_VERIFICATION">
              <template v-if="!walletStore.hasMetaMask()">
                <a 
                  href="https://metamask.io/download/" 
                  target="_blank"
                  class="w-full py-3.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                >
                  <span>Install MetaMask untuk Verifikasi</span>
                  <span class="material-icons text-sm">open_in_new</span>
                </a>
              </template>
              <template v-else>
                <button 
                  @click="handleConnect"
                  :disabled="walletStore.loading"
                  class="w-full py-3.5 px-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span v-if="walletStore.loading" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  <span>{{ walletStore.loading ? 'Memverifikasi...' : 'Verifikasi Wallet' }}</span>
                </button>
              </template>
            </template>
            
            <!-- DEMO MODE: Verifikasi Pembayaran -->
            <!-- Sementara digunakan untuk presentasi client. -->
            <!-- Jangan dihapus karena fitur MetaMask akan diaktifkan kembali. -->
            <template v-else>
              <button 
                @click="handleConnectDemo"
                :disabled="walletStore.loading"
                class="w-full py-3.5 px-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span v-if="walletStore.loading" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                <span>{{ walletStore.loading ? 'Memverifikasi...' : 'Verifikasi Pembayaran' }}</span>
              </button>
            </template>
          </div>
        </template>

        <!-- Connected State -->
        <template v-else>
          <div class="relative w-20 h-20 mb-6">
            <div class="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
            <div class="relative w-full h-full bg-green-500/20 rounded-full flex items-center justify-center border-2 border-green-500">
              <span class="material-icons text-4xl text-green-500">check_circle</span>
            </div>
          </div>

          <div class="inline-flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-1.5 rounded-full mb-3 border border-green-500/20 text-sm font-semibold">
            <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            &#10003; Wallet Connected
          </div>

          <p class="text-gray-400 text-sm mb-8 font-mono bg-white/5 px-4 py-2 rounded-lg border border-white/10">
            {{ walletStore.shortAddress() }}
          </p>

          <button 
            @click="handleWatch"
            class="w-full py-4 px-4 bg-primary hover:bg-opacity-90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transform hover:scale-[1.02]"
          >
            <span class="material-icons">play_circle_filled</span>
            <span>Mulai Menonton</span>
          </button>
        </template>
      </div>
    </div>
  </div>

  <!-- Toast Notification (Demo Mode) -->
  <div v-if="showDemoToast" class="fixed bottom-8 right-8 z-[110] bg-green-500 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-fade-in-up border border-green-400">
    <span class="material-icons">check_circle</span>
    <span class="font-medium">Pembayaran berhasil diverifikasi (Mode Demo)</span>
  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
