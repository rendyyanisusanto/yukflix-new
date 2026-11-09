<script setup>
import HeroSlider from '../components/film/HeroSlider.vue'
import BehindTheScenes from '../components/film/BehindTheScenes.vue'
import ComingSoon from '../components/film/ComingSoon.vue'
import FAQAccordion from '../components/faq/FAQAccordion.vue'
</script>

<template>
  <div>
    <HeroSlider />
    <main class="relative z-20 mt-8 md:-mt-24 pb-20">
      <BehindTheScenes />
      <ComingSoon />
      <FAQAccordion />
    </main>
  </div>
</template>
