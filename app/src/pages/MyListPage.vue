<script setup>
</script>

<template>
  <main class="min-h-screen pt-32 pb-12 px-4 md:px-8 max-w-7xl mx-auto flex flex-col items-center justify-center">
    <div class="text-center animate-fade-in-up">
      <div class="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-lg">
        <span class="material-icons text-5xl text-gray-400">bookmark_border</span>
      </div>
      <h1 class="text-3xl md:text-4xl font-display font-bold text-white mb-4">Daftar Tontonan Kosong</h1>
      <p class="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
        Anda belum menambahkan film atau serial TV apa pun ke dalam daftar tontonan Anda.
      </p>
      
      <router-link to="/movies" class="mt-8 inline-flex items-center gap-2 px-8 py-3.5 bg-primary hover:bg-opacity-90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 transform hover:scale-[1.02]">
        <span class="material-icons text-sm">search</span>
        Cari Film Sekarang
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
