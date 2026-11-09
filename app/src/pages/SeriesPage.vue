<script setup>
</script>

<template>
  <main class="min-h-screen pt-32 pb-12 px-4 md:px-8 max-w-7xl mx-auto flex flex-col items-center justify-center">
    <div class="text-center animate-fade-in-up">
      <div class="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
        <span class="material-icons text-5xl text-primary">tv</span>
      </div>
      <h1 class="text-4xl md:text-5xl font-display font-bold text-white mb-4">TV Series</h1>
      <p class="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
        Fitur ini sedang dalam tahap pengembangan. Kunjungi kembali dalam waktu dekat untuk menikmati koleksi TV series terbaik kami.
      </p>
      
      <router-link to="/" class="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white font-medium transition-all">
        <span class="material-icons text-sm">arrow_back</span>
        Kembali ke Beranda
      </router-link>
    </div>
  </main>
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
