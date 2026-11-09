<script setup>
import { ref, onMounted } from 'vue'
import { faqService } from '../../services/faqService'

const faqs = ref([])
const loading = ref(true)

onMounted(async () => {
  const { data, error } = await faqService.getAll()
  if (data) {
    faqs.value = data.filter(f => f.is_active)
  }
  loading.value = false
})
</script>

<template>
  <section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="text-center mb-10">
      <h2 class="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
        Frequently Asked Questions
      </h2>
      <p class="text-gray-500 dark:text-gray-400">Everything you need to know about Yukflix</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!faqs.length" class="text-center text-gray-500 dark:text-gray-400 py-8">
      No questions available at the moment.
    </div>

    <!-- Dynamic FAQs -->
    <div v-else class="space-y-4">
      <div 
        v-for="faq in faqs" 
        :key="faq.id"
        class="bg-surface-light dark:bg-surface-dark rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
      >
        <details class="group p-4 [&_summary::-webkit-details-marker]:hidden">
          <summary class="flex cursor-pointer items-center justify-between gap-1.5 text-gray-900 dark:text-white">
            <!-- Render HTML Question -->
            <div 
              class="font-medium prose prose-sm dark:prose-invert max-w-none hover:text-primary transition-colors"
              v-html="faq.question"
            ></div>
            <span class="relative h-5 w-5 shrink-0">
              <span class="material-icons absolute inset-0 opacity-100 group-open:opacity-0 transition-opacity">add</span>
              <span class="material-icons absolute inset-0 opacity-0 group-open:opacity-100 transition-opacity text-primary">remove</span>
            </span>
          </summary>
          <!-- Render HTML Answers -->
          <ul class="mt-4 space-y-2 list-disc pl-5 text-gray-600 dark:text-gray-300">
            <li 
              v-for="answer in faq.faq_answers" 
              :key="answer.id"
              class="leading-relaxed"
            >
              <div class="prose prose-sm dark:prose-invert max-w-none" v-html="answer.answer"></div>
            </li>
          </ul>
        </details>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Remove margin from p tags inside prose to allow better spacing control */
:deep(.prose p) {
  margin-top: 0;
  margin-bottom: 0;
}
</style>
