<script setup>
import { ref, onMounted } from 'vue'
import { faqService } from '../../services/faqService'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const faqs = ref([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const editingFaq = ref(null)
const formData = ref({
  question: '',
  sort_order: 0,
  is_active: true,
  answers: ['']
})
const error = ref('')

onMounted(async () => {
  await fetchFAQs()
  loading.value = false
})

async function fetchFAQs() {
  const { data, error: fetchError } = await faqService.getAll()
  if (fetchError) {
    console.error('Error fetching FAQs:', fetchError)
  } else {
    faqs.value = data || []
  }
}

const customColors = [
  '#000000', '#e60000', '#ff9900', '#ffff00', '#008a00', '#0066cc', '#9933ff', '#ffffff',
  '#facccc', '#ffebcc', '#ffffcc', '#cce8cc', ' #cce0f5', '#ebd6ff', '#bbbbbb', '#f06666',
  '#ffc266', '#ffff66', '#66b966', '#66a3e0', '#c285ff', '#888888', '#a10000', '#b26b00',
  '#b2b200', '#006100', '#0047b2', '#6b24b2', '#444444', '#5c0000', '#663d00', '#666600',
  '#003700', '#002966', '#3d1466', 
  '#c11267', '#e94e77', '#0f1115' // YukFlix Brand Colors
]

function openModal(faq = null) {
  if (faq) {
    editingFaq.value = faq
    formData.value = {
      question: faq.question,
      sort_order: faq.sort_order,
      is_active: faq.is_active,
      answers: faq.faq_answers?.map(a => a.answer) || ['']
    }
  } else {
    editingFaq.value = null
    formData.value = {
      question: '',
      sort_order: faqs.value.length,
      is_active: true,
      answers: ['']
    }
  }
  error.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingFaq.value = null
  formData.value = { question: '', sort_order: 0, is_active: true, answers: [''] }
  error.value = ''
}

function addAnswer() {
  formData.value.answers.push('')
}

function removeAnswer(index) {
  formData.value.answers.splice(index, 1)
}

async function handleSubmit() {
  error.value = ''
  
  // Check if question is not empty (strip HTML tags)
  if (!formData.value.question || !formData.value.question.replace(/<[^>]*>/g, '').trim()) {
    error.value = 'Question is required'
    return
  }

  // Check if answers are not empty (strip HTML tags to check content)
  const validAnswers = formData.value.answers.filter(a => a.replace(/<[^>]*>/g, '').trim())
  
  if (validAnswers.length === 0) {
    error.value = 'At least one answer is required'
    return
  }
  
  saving.value = true

  try {
    let faqId = editingFaq.value?.id

    if (editingFaq.value) {
      // Update FAQ
      const { error: updateError } = await faqService.update(
        editingFaq.value.id,
        {
          question: formData.value.question,
          sort_order: formData.value.sort_order,
          is_active: formData.value.is_active
        }
      )
      if (updateError) throw updateError

      // Delete old answers
      if (editingFaq.value.faq_answers) {
        for (const answer of editingFaq.value.faq_answers) {
          await faqService.deleteAnswer(answer.id)
        }
      }
    } else {
      // Create FAQ
      const { data, error: createError } = await faqService.create({
        question: formData.value.question,
        sort_order: formData.value.sort_order,
        is_active: formData.value.is_active
      })
      if (createError) throw createError
      faqId = data.id
    }

    // Add answers
    for (let i = 0; i < validAnswers.length; i++) {
      await faqService.addAnswer(faqId, validAnswers[i], i)
    }

    await fetchFAQs()
    closeModal()
  } catch (err) {
    error.value = err.message || 'Failed to save FAQ'
  } finally {
    saving.value = false
  }
}

async function deleteFAQ(id) {
  if (!confirm('Are you sure you want to delete this FAQ?')) return

  try {
    const { error: deleteError } = await faqService.delete(id)
    if (deleteError) throw deleteError
    
    await fetchFAQs()
  } catch (err) {
    alert('Failed to delete FAQ: ' + err.message)
  }
}

async function toggleActive(faq) {
  try {
    const { error: updateError } = await faqService.update(faq.id, {
      ...faq,
      is_active: !faq.is_active
    })
    if (updateError) throw updateError
    
    await fetchFAQs()
  } catch (err) {
    alert('Failed to toggle FAQ: ' + err.message)
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
          FAQ Management
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Manage frequently asked questions
        </p>
      </div>
      <button
        @click="openModal()"
        class="flex items-center gap-2 bg-primary hover:bg-opacity-90 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
      >
        <span class="material-icons">add</span>
        Add FAQ
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
    </div>

    <!-- FAQs List -->
    <div v-else class="space-y-4">
      <div 
        v-for="faq in faqs" 
        :key="faq.id"
        class="bg-white dark:bg-surface-dark rounded-xl p-6 border border-gray-200 dark:border-gray-700"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <div 
                class="text-lg font-bold text-gray-900 dark:text-white prose prose-sm dark:prose-invert max-w-none"
                v-html="faq.question"
              ></div>
              <span 
                v-if="faq.is_active"
                class="px-2 py-1 text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded"
              >
                Active
              </span>
              <span 
                v-else
                class="px-2 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded"
              >
                Inactive
              </span>
            </div>
            <div class="space-y-2">
              <div 
                v-for="(answer, index) in faq.faq_answers" 
                :key="answer.id"
                class="pl-4 border-l-2 border-primary"
              >
                <!-- Render HTML content safely -->
                <div 
                  class="text-sm text-gray-600 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none"
                  v-html="answer.answer"
                ></div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            @click="toggleActive(faq)"
            class="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <span class="material-icons text-sm">{{ faq.is_active ? 'visibility_off' : 'visibility' }}</span>
            {{ faq.is_active ? 'Deactivate' : 'Activate' }}
          </button>
          <button
            @click="openModal(faq)"
            class="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            <span class="material-icons text-sm">edit</span>
            Edit
          </button>
          <button
            @click="deleteFAQ(faq.id)"
            class="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
          >
            <span class="material-icons text-sm">delete</span>
            Delete
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div 
        v-if="faqs.length === 0"
        class="bg-white dark:bg-surface-dark rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center"
      >
        <span class="material-icons text-6xl text-gray-300 dark:text-gray-600 mb-4">help</span>
        <p class="text-gray-500 dark:text-gray-400 mb-4">No FAQs yet</p>
        <button
          @click="openModal()"
          class="text-primary hover:underline font-semibold"
        >
          Add your first FAQ
        </button>
      </div>
    </div>

    <!-- Modal -->
    <div 
      v-if="showModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      @click.self="closeModal"
    >
      <div class="bg-white dark:bg-surface-dark rounded-xl p-6 w-full max-w-4xl border border-gray-200 dark:border-gray-700 my-8">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {{ editingFaq ? 'Edit FAQ' : 'Add FAQ' }}
        </h2>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Question -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Question *
            </label>
            <div class="bg-white dark:bg-gray-800 rounded-lg">
              <QuillEditor
                v-model:content="formData.question"
                contentType="html"
                theme="snow"
                :toolbar="[
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ 'color': customColors }, { 'background': customColors }],
                  ['clean']
                ]"
                style="height: 100px"
              />
            </div>
          </div>

          <!-- Answers -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Answers *
            </label>
            <div class="space-y-6">
              <div 
                v-for="(answer, index) in formData.answers" 
                :key="index"
                class="flex gap-4 items-start"
              >
                <div class="flex-1 bg-white dark:bg-gray-800 rounded-lg">
                  <QuillEditor
                    v-model:content="formData.answers[index]"
                    contentType="html"
                    theme="snow"
                    :toolbar="[
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'color': customColors }, { 'background': customColors }],
                      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                      ['link', 'clean']
                    ]"
                    style="height: 150px"
                  />
                </div>
                <button
                  v-if="formData.answers.length > 1"
                  type="button"
                  @click="removeAnswer(index)"
                  class="mt-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                >
                  <span class="material-icons">delete</span>
                </button>
              </div>
            </div>
            <button
              type="button"
              @click="addAnswer"
              class="mt-4 text-sm text-primary hover:underline flex items-center gap-1"
            >
              <span class="material-icons text-sm">add</span>
              Add another answer
            </button>
          </div>

          <!-- Options -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort Order
              </label>
              <input
                v-model.number="formData.sort_order"
                type="number"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <label class="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 cursor-pointer">
                <input
                  v-model="formData.is_active"
                  type="checkbox"
                  class="rounded text-primary focus:ring-primary"
                />
                <span class="text-sm text-gray-900 dark:text-white">Active</span>
              </label>
            </div>
          </div>

          <!-- Error -->
          <div v-if="error" class="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              type="button"
              @click="closeModal"
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="flex-1 px-4 py-2 bg-primary hover:bg-opacity-90 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div v-if="saving" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span v-else>{{ editingFaq ? 'Update' : 'Create' }}</span>
              <span v-if="saving">Saving...</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style>
/* Quill Dark Mode Overrides */
.dark .ql-toolbar {
  background-color: #1f2937;
  border-color: #374151;
  color: white;
}
.dark .ql-container {
  border-color: #374151;
  background-color: #111827;
  color: white;
}
.dark .ql-stroke {
  stroke: #9ca3af !important;
}
.dark .ql-fill {
  fill: #9ca3af !important;
}
.dark .ql-picker {
  color: #9ca3af !important;
}
.dark .ql-picker-options {
  background-color: #1f2937 !important;
  border-color: #374151 !important;
}
</style>
