<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { challengeService } from '../../services/challengeService'

const loading = ref(true)
const activeTab = ref('submissions') // 'submissions' | 'videos' | 'questions' | 'stats' | 'settings'

// Challenge data
const challenges = ref([])
const selectedChallengeId = ref(null)
const challengeDetail = ref(null)
const videos = ref([])
const questions = ref([])
const stats = ref(null)

// Submissions state
const submissions = ref([])
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 })
const search = ref('')
const filterProvince = ref('')
const filterStatus = ref('')
const loadingSubmissions = ref(false)

// Detail & Review modal
const showReviewModal = ref(false)
const selectedSubmission = ref(null)
const loadingDetail = ref(false)
const reviewForm = ref({
  review_status: 'submitted',
  reviewer_notes: '',
  review_score: null
})
const savingReview = ref(false)

// Video Modal
const showVideoModal = ref(false)
const editingVideo = ref(null)
const videoForm = ref({
  title: '',
  youtube_url: '',
  instructions: '',
  video_order: 1,
  is_active: 1
})

// Question Modal
const showQuestionModal = ref(false)
const editingQuestion = ref(null)
const questionForm = ref({
  video_id: '',
  category_id: '',
  category: '',
  question_text: '',
  answer_type: 'essay',
  optionsStr: '',
  question_order: 1,
  is_active: 1
})

// Categories Master State
const categories = ref([])
const loadingCategories = ref(false)
const filterQuestionCategory = ref('')

const showCategoryModal = ref(false)
const editingCategory = ref(null)
const categoryForm = ref({
  name: '',
  description: '',
  order_num: 1,
  is_active: 1
})
const savingCategory = ref(false)

// Challenge Settings Form
const challengeForm = ref({
  title: '',
  slug: '',
  subtitle: '',
  description: '',
  status: 'published',
  start_date: '',
  end_date: ''
})
const savingChallenge = ref(false)

const PROVINCES = [
  'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau', 'Jambi',
  'Sumatera Selatan', 'Kepulauan Bangka Belitung', 'Bengkulu', 'Lampung',
  'DKI Jakarta', 'Banten', 'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur',
  'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur',
  'Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara',
  'Sulawesi Utara', 'Gorontalo', 'Sulawesi Tengah', 'Sulawesi Barat', 'Sulawesi Selatan', 'Sulawesi Tenggara',
  'Maluku', 'Maluku Utara',
  'Papua', 'Papua Barat', 'Papua Selatan', 'Papua Tengah', 'Papua Pegunungan', 'Papua Barat Daya'
]

onMounted(async () => {
  await Promise.all([
    loadChallenges(),
    loadCategories()
  ])
})

async function loadCategories() {
  loadingCategories.value = true
  try {
    const { data, error } = await challengeService.getCategories()
    if (!error && data) {
      categories.value = data
    }
  } catch (err) {
    console.error('Failed to load question categories:', err)
  } finally {
    loadingCategories.value = false
  }
}

const activeCategories = computed(() => {
  return categories.value.filter(c => c.is_active)
})

const selectedQuestionCategoryDesc = computed(() => {
  const found = categories.value.find(
    c => c.name === questionForm.value.category || (questionForm.value.category_id && c.id === questionForm.value.category_id)
  )
  return found?.description || ''
})

const filteredQuestions = computed(() => {
  if (!filterQuestionCategory.value) return questions.value
  return questions.value.filter(q => q.category === filterQuestionCategory.value)
})

async function loadChallenges() {
  loading.value = true
  try {
    const { data } = await challengeService.getAdminChallenges()
    challenges.value = data || []

    if (challenges.value.length > 0) {
      selectedChallengeId.value = challenges.value[0].id
      await loadSelectedChallenge()
    }
  } catch (err) {
    console.error('Failed to load challenges:', err)
  } finally {
    loading.value = false
  }
}

function formatDateInput(dateVal) {
  if (!dateVal) return ''
  if (typeof dateVal === 'string') {
    if (dateVal.includes('T')) {
      const d = new Date(dateVal)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    return dateVal.substring(0, 10)
  }
  if (dateVal instanceof Date) {
    const year = dateVal.getFullYear()
    const month = String(dateVal.getMonth() + 1).padStart(2, '0')
    const day = String(dateVal.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  return ''
}

async function loadSelectedChallenge() {
  if (!selectedChallengeId.value) return
  try {
    const { data } = await challengeService.getAdminChallengeDetail(selectedChallengeId.value)
    if (data) {
      challengeDetail.value = data.challenge
      videos.value = data.videos || []
      questions.value = data.questions || []

      // populate challenge form
      challengeForm.value = {
        title: data.challenge.title || '',
        slug: data.challenge.slug || '',
        subtitle: data.challenge.subtitle || '',
        description: data.challenge.description || '',
        status: data.challenge.status || 'published',
        start_date: formatDateInput(data.challenge.start_date),
        end_date: formatDateInput(data.challenge.end_date)
      }

      await loadSubmissions()
      await loadStats()
    }
  } catch (err) {
    console.error('Failed to load challenge detail:', err)
  }
}

// Submissions loader
async function loadSubmissions() {
  if (!selectedChallengeId.value) return
  loadingSubmissions.value = true
  try {
    const { data } = await challengeService.getSubmissions(selectedChallengeId.value, {
      page: pagination.value.page,
      limit: pagination.value.limit,
      search: search.value,
      province: filterProvince.value,
      status: filterStatus.value
    })

    if (data) {
      submissions.value = data.submissions || []
      pagination.value = data.pagination || pagination.value
    }
  } catch (err) {
    console.error('Failed to load submissions:', err)
  } finally {
    loadingSubmissions.value = false
  }
}

// Watch filters
watch([search, filterProvince, filterStatus], () => {
  pagination.value.page = 1
  loadSubmissions()
})

async function loadStats() {
  if (!selectedChallengeId.value) return
  try {
    const { data } = await challengeService.getStats(selectedChallengeId.value)
    stats.value = data || null
  } catch (err) {
    console.error('Failed to load stats:', err)
  }
}

// Review submission
async function openReviewModal(submissionId) {
  showReviewModal.value = true
  loadingDetail.value = true
  try {
    const { data } = await challengeService.getSubmissionDetail(submissionId)
    selectedSubmission.value = data || null
    if (data?.submission) {
      reviewForm.value = {
        review_status: data.submission.review_status || 'submitted',
        reviewer_notes: data.submission.reviewer_notes || '',
        review_score: data.submission.review_score !== null ? data.submission.review_score : ''
      }
    }
  } catch (err) {
    alert('Gagal memuat detail jawaban: ' + err.message)
  } finally {
    loadingDetail.value = false
  }
}

async function handleSaveReview() {
  if (!selectedSubmission.value?.submission?.id) return
  savingReview.value = true
  try {
    const payload = {
      review_status: reviewForm.value.review_status,
      reviewer_notes: reviewForm.value.reviewer_notes,
      review_score: reviewForm.value.review_score !== '' ? parseInt(reviewForm.value.review_score, 10) : null
    }

    const { error: err } = await challengeService.reviewSubmission(selectedSubmission.value.submission.id, payload)
    if (err) throw err

    alert('Hasil kurasi & review berhasil disimpan.')
    showReviewModal.value = false
    await loadSubmissions()
    await loadStats()
  } catch (err) {
    alert('Gagal menyimpan review: ' + err.message)
  } finally {
    savingReview.value = false
  }
}

function exportCsv() {
  if (!selectedChallengeId.value) return
  const url = challengeService.getExportCsvUrl(selectedChallengeId.value)
  window.open(url, '_blank')
}

// Video CRUD
function openAddVideoModal() {
  editingVideo.value = null
  videoForm.value = {
    title: '',
    youtube_url: '',
    instructions: '',
    video_order: videos.value.length + 1,
    is_active: 1
  }
  showVideoModal.value = true
}

function openEditVideoModal(v) {
  editingVideo.value = v
  videoForm.value = {
    title: v.title,
    youtube_url: v.youtube_url,
    instructions: v.instructions || '',
    video_order: v.video_order,
    is_active: v.is_active ? 1 : 0
  }
  showVideoModal.value = true
}

async function handleSaveVideo() {
  if (!videoForm.value.title || !videoForm.value.youtube_url) {
    alert('Judul dan URL YouTube wajib diisi.')
    return
  }

  try {
    if (editingVideo.value) {
      await challengeService.updateVideo(editingVideo.value.id, videoForm.value)
    } else {
      await challengeService.addVideo(selectedChallengeId.value, videoForm.value)
    }
    showVideoModal.value = false
    await loadSelectedChallenge()
  } catch (err) {
    alert('Gagal menyimpan video: ' + err.message)
  }
}

async function handleDeleteVideo(vId) {
  if (!confirm('Yakin ingin menghapus video ini? Semua pertanyaan terkait akan ikut terhapus.')) return
  try {
    await challengeService.deleteVideo(vId)
    await loadSelectedChallenge()
  } catch (err) {
    alert('Gagal menghapus video: ' + err.message)
  }
}

// Question CRUD
function openAddQuestionModal(defaultVideoId = '') {
  editingQuestion.value = null
  const firstActiveCat = activeCategories.value[0] || categories.value[0]
  questionForm.value = {
    video_id: defaultVideoId || (videos.value[0]?.id || ''),
    category_id: firstActiveCat ? firstActiveCat.id : '',
    category: firstActiveCat ? firstActiveCat.name : '',
    question_text: '',
    answer_type: 'essay',
    optionsStr: '',
    question_order: questions.value.length + 1,
    is_active: 1
  }
  showQuestionModal.value = true
}

function openEditQuestionModal(q) {
  editingQuestion.value = q
  questionForm.value = {
    video_id: q.video_id,
    category_id: q.category_id || '',
    category: q.category || '',
    question_text: q.question_text,
    answer_type: q.answer_type,
    optionsStr: Array.isArray(q.options) ? q.options.join('\n') : '',
    question_order: q.question_order,
    is_active: q.is_active ? 1 : 0
  }
  showQuestionModal.value = true
}

function onCategorySelectChange(event) {
  const selectedName = event.target.value
  const found = categories.value.find(c => c.name === selectedName)
  if (found) {
    questionForm.value.category = found.name
    questionForm.value.category_id = found.id
  }
}

async function handleSaveQuestion() {
  if (!questionForm.value.category || !questionForm.value.question_text) {
    alert('Kategori dan pertanyaan wajib diisi.')
    return
  }

  try {
    const payload = {
      video_id: questionForm.value.video_id,
      category_id: questionForm.value.category_id || null,
      category: questionForm.value.category,
      question_text: questionForm.value.question_text,
      answer_type: questionForm.value.answer_type,
      options: questionForm.value.optionsStr
        ? questionForm.value.optionsStr.split('\n').map(s => s.trim()).filter(Boolean)
        : null,
      question_order: parseInt(questionForm.value.question_order, 10),
      is_active: questionForm.value.is_active
    }

    if (editingQuestion.value) {
      await challengeService.updateQuestion(editingQuestion.value.id, payload)
    } else {
      await challengeService.addQuestion(questionForm.value.video_id, payload)
    }
    showQuestionModal.value = false
    await loadSelectedChallenge()
    await loadCategories()
  } catch (err) {
    alert('Gagal menyimpan pertanyaan: ' + err.message)
  }
}

async function handleDeleteQuestion(qId) {
  if (!confirm('Yakin ingin menghapus pertanyaan ini?')) return
  try {
    await challengeService.deleteQuestion(qId)
    await loadSelectedChallenge()
    await loadCategories()
  } catch (err) {
    alert('Gagal menghapus pertanyaan: ' + err.message)
  }
}

// Category Master CRUD
function openAddCategoryModal() {
  editingCategory.value = null
  categoryForm.value = {
    name: '',
    description: '',
    order_num: categories.value.length + 1,
    is_active: 1
  }
  showCategoryModal.value = true
}

function openEditCategoryModal(cat) {
  editingCategory.value = cat
  categoryForm.value = {
    name: cat.name,
    description: cat.description || '',
    order_num: cat.order_num || 1,
    is_active: cat.is_active ? 1 : 0
  }
  showCategoryModal.value = true
}

async function handleSaveCategory() {
  if (!categoryForm.value.name.trim()) {
    alert('Nama kategori pertanyaan wajib diisi.')
    return
  }

  savingCategory.value = true
  try {
    const payload = {
      name: categoryForm.value.name.trim(),
      description: categoryForm.value.description ? categoryForm.value.description.trim() : '',
      order_num: parseInt(categoryForm.value.order_num, 10) || 1,
      is_active: categoryForm.value.is_active ? 1 : 0
    }

    if (editingCategory.value) {
      const { error } = await challengeService.updateCategory(editingCategory.value.id, payload)
      if (error) throw error
    } else {
      const { error } = await challengeService.createCategory(payload)
      if (error) throw error
    }

    showCategoryModal.value = false
    await loadCategories()
    await loadSelectedChallenge()
  } catch (err) {
    alert('Gagal menyimpan kategori: ' + (err.message || 'Terjadi kesalahan'))
  } finally {
    savingCategory.value = false
  }
}

async function handleDeleteCategory(cat) {
  if (cat.question_count > 0) {
    alert(`Kategori "${cat.name}" masih digunakan oleh ${cat.question_count} pertanyaan di bank soal. Ubah kategori pertanyaan terkait terlebih dahulu sebelum menghapus master kategori ini.`)
    return
  }

  if (!confirm(`Apakah Anda yakin ingin menghapus kategori "${cat.name}"?`)) return

  try {
    const { error } = await challengeService.deleteCategory(cat.id)
    if (error) throw error
    await loadCategories()
  } catch (err) {
    alert('Gagal menghapus kategori: ' + (err.message || 'Terjadi kesalahan'))
  }
}

async function toggleCategoryActive(cat) {
  try {
    const newStatus = cat.is_active ? 0 : 1
    const { error } = await challengeService.updateCategory(cat.id, {
      name: cat.name,
      description: cat.description,
      order_num: cat.order_num,
      is_active: newStatus
    })
    if (error) throw error
    cat.is_active = newStatus
  } catch (err) {
    alert('Gagal mengubah status kategori: ' + (err.message || 'Terjadi kesalahan'))
  }
}

// Challenge Settings update
async function handleSaveChallengeSettings() {
  savingChallenge.value = true
  try {
    const payload = {
      ...challengeForm.value,
      start_date: challengeForm.value.start_date || null,
      end_date: challengeForm.value.end_date || null
    }
    const { error: err } = await challengeService.updateAdminChallenge(selectedChallengeId.value, payload)
    if (err) throw err
    alert('Pengaturan challenge berhasil diperbarui.')
    await loadSelectedChallenge()
  } catch (err) {
    alert('Gagal memperbarui challenge: ' + err.message)
  } finally {
    savingChallenge.value = false
  }
}

function getStatusBadge(status) {
  switch (status) {
    case 'submitted':
      return { label: 'Submitted', class: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' }
    case 'under_review':
      return { label: 'Under Review', class: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' }
    case 'shortlisted':
      return { label: 'Shortlisted', class: 'bg-green-500/20 text-green-400 border border-green-500/30' }
    case 'not_selected':
      return { label: 'Not Selected', class: 'bg-red-500/20 text-red-400 border border-red-500/30' }
    default:
      return { label: status, class: 'bg-gray-500/20 text-gray-400' }
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <span class="material-icons text-primary text-3xl">emoji_events</span>
          <span>Film Challenge Management</span>
        </h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Kelola program National Youth Film Crew & Talent Challenge, video YouTube, bank soal, dan kurasi peserta.
        </p>
      </div>

      <!-- Action buttons -->
      <div class="flex items-center gap-2 flex-wrap">
        <a 
          :href="`/challenge/${challengeDetail?.slug || 'national-youth-film-crew-talent'}`" 
          target="_blank"
          class="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:border-primary text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 transition-colors"
        >
          <span class="material-icons text-sm">open_in_new</span>
          <span>Buka Halaman Publik</span>
        </a>

        <button 
          @click="exportCsv"
          class="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <span class="material-icons text-sm">file_download</span>
          <span>Export CSV</span>
        </button>
      </div>
    </div>

    <!-- Main Navigation Tabs -->
    <div class="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto pb-1 scrollbar-none">
      <button 
        @click="activeTab = 'submissions'"
        class="px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2"
        :class="activeTab === 'submissions' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-300'"
      >
        <span class="material-icons text-base">people</span>
        <span>Peserta & Submissions</span>
        <span v-if="pagination.total" class="px-2 py-0.5 rounded-full text-xs bg-primary/20 text-primary">
          {{ pagination.total }}
        </span>
      </button>

      <button 
        @click="activeTab = 'stats'"
        class="px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2"
        :class="activeTab === 'stats' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-300'"
      >
        <span class="material-icons text-base">analytics</span>
        <span>Statistik & Demografi</span>
      </button>

      <button 
        @click="activeTab = 'videos'"
        class="px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2"
        :class="activeTab === 'videos' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-300'"
      >
        <span class="material-icons text-base">video_library</span>
        <span>Slot Video ({{ videos.length }})</span>
      </button>

      <button 
        @click="activeTab = 'questions'"
        class="px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2"
        :class="activeTab === 'questions' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-300'"
      >
        <span class="material-icons text-base">help_outline</span>
        <span>Bank Pertanyaan ({{ questions.length }})</span>
      </button>

      <button 
        @click="activeTab = 'categories'"
        class="px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2"
        :class="activeTab === 'categories' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-300'"
      >
        <span class="material-icons text-base">category</span>
        <span>Master Kategori ({{ categories.length }})</span>
      </button>

      <button 
        @click="activeTab = 'settings'"
        class="px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2"
        :class="activeTab === 'settings' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-300'"
      >
        <span class="material-icons text-base">tune</span>
        <span>Pengaturan Program</span>
      </button>
    </div>

    <!-- ===================================================================== -->
    <!-- TAB 1: SUBMISSIONS & PARTICIPANTS -->
    <!-- ===================================================================== -->
    <div v-if="activeTab === 'submissions'" class="space-y-4">
      <!-- Filter Bar -->
      <div class="p-4 rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-3">
        <!-- Search -->
        <div class="relative w-full md:w-80">
          <span class="material-icons absolute left-3 top-2.5 text-gray-400 text-lg">search</span>
          <input 
            type="text" 
            v-model="search"
            placeholder="Cari nama, email, reg no..."
            class="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs text-gray-900 dark:text-white outline-none focus:border-primary"
          />
        </div>

        <!-- Filters -->
        <div class="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <!-- Province Filter -->
          <select 
            v-model="filterProvince"
            class="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs text-gray-900 dark:text-white outline-none focus:border-primary"
          >
            <option value="">Semua Provinsi</option>
            <option v-for="prov in PROVINCES" :key="prov" :value="prov">{{ prov }}</option>
          </select>

          <!-- Status Filter -->
          <select 
            v-model="filterStatus"
            class="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs text-gray-900 dark:text-white outline-none focus:border-primary"
          >
            <option value="">Semua Status</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="not_selected">Not Selected</option>
          </select>

          <!-- Refresh -->
          <button 
            @click="loadSubmissions" 
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            title="Refresh Data"
          >
            <span class="material-icons text-base">refresh</span>
          </button>
        </div>
      </div>

      <!-- Table Container -->
      <div class="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-gray-500 uppercase tracking-wider font-semibold">
              <tr>
                <th class="py-3 px-4">No. Registrasi</th>
                <th class="py-3 px-4">Peserta & Kontak</th>
                <th class="py-3 px-4">Institusi & Provinsi</th>
                <th class="py-3 px-4">Minat Kru</th>
                <th class="py-3 px-4">Tanggal Kirim</th>
                <th class="py-3 px-4">Status & Skor</th>
                <th class="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
              <tr v-if="loadingSubmissions">
                <td colspan="7" class="py-12 text-center text-gray-500">Memuat daftar peserta...</td>
              </tr>
              <tr v-else-if="submissions.length === 0">
                <td colspan="7" class="py-12 text-center text-gray-500">Belum ada submission yang sesuai filter.</td>
              </tr>
              <tr 
                v-for="sub in submissions" 
                :key="sub.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
              >
                <!-- Reg No -->
                <td class="py-3.5 px-4 font-mono font-bold text-primary">
                  {{ sub.registration_number }}
                </td>

                <!-- Participant -->
                <td class="py-3.5 px-4">
                  <div class="font-bold text-gray-900 dark:text-white">{{ sub.full_name }}</div>
                  <div class="text-gray-500 text-[11px]">{{ sub.email }} • {{ sub.whatsapp }}</div>
                </td>

                <!-- Institution -->
                <td class="py-3.5 px-4">
                  <div class="font-medium truncate max-w-[180px]">{{ sub.institution }}</div>
                  <div class="text-gray-500 text-[11px]">{{ sub.province }} ({{ sub.age_range }})</div>
                </td>

                <!-- Interests -->
                <td class="py-3.5 px-4">
                  <span class="truncate block max-w-[180px] text-[11px] text-pink-400 font-medium">
                    {{ sub.interests_str || '-' }}
                  </span>
                </td>

                <!-- Submitted Date -->
                <td class="py-3.5 px-4 text-gray-500">
                  {{ sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-' }}
                </td>

                <!-- Status -->
                <td class="py-3.5 px-4">
                  <span 
                    class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-block"
                    :class="getStatusBadge(sub.review_status).class"
                  >
                    {{ getStatusBadge(sub.review_status).label }}
                  </span>
                  <span v-if="sub.review_score !== null" class="ml-1 text-xs font-bold text-white">
                    ({{ sub.review_score }})
                  </span>
                </td>

                <!-- Actions -->
                <td class="py-3.5 px-4 text-center">
                  <button 
                    @click="openReviewModal(sub.id)"
                    class="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span class="material-icons text-sm">visibility</span>
                    <span>Review</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500">
          <span>Menampilkan {{ submissions.length }} dari {{ pagination.total }} peserta</span>
          <div class="flex items-center gap-1">
            <button 
              :disabled="pagination.page <= 1"
              @click="pagination.page--; loadSubmissions()"
              class="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <span class="px-2 font-medium text-gray-900 dark:text-white">{{ pagination.page }} / {{ pagination.totalPages }}</span>
            <button 
              :disabled="pagination.page >= pagination.totalPages"
              @click="pagination.page++; loadSubmissions()"
              class="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-40"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- TAB 2: STATS & DEMOGRAPHY -->
    <!-- ===================================================================== -->
    <div v-else-if="activeTab === 'stats'" class="space-y-6">
      <!-- 4 KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="p-5 rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700">
          <span class="text-xs font-semibold text-gray-500 uppercase">Total Submissions</span>
          <p class="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">{{ stats?.totalSubmissions || 0 }}</p>
          <span class="text-xs text-gray-400">Total formulir masuk</span>
        </div>

        <div class="p-5 rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700">
          <span class="text-xs font-semibold text-amber-500 uppercase">Perlu Dikurasi (Unreviewed)</span>
          <p class="text-3xl font-extrabold text-amber-500 mt-2">{{ stats?.unreviewed || 0 }}</p>
          <span class="text-xs text-gray-400">Status: Submitted</span>
        </div>

        <div class="p-5 rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700">
          <span class="text-xs font-semibold text-blue-400 uppercase">Sedang Ditinjau</span>
          <p class="text-3xl font-extrabold text-blue-400 mt-2">{{ stats?.underReview || 0 }}</p>
          <span class="text-xs text-gray-400">Status: Under Review</span>
        </div>

        <div class="p-5 rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700">
          <span class="text-xs font-semibold text-green-500 uppercase">Lolos Seleksi (Shortlisted)</span>
          <p class="text-3xl font-extrabold text-green-500 mt-2">{{ stats?.shortlisted || 0 }}</p>
          <span class="text-xs text-gray-400">Status: Shortlisted</span>
        </div>
      </div>

      <!-- Breakdown Grids -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- By Interest -->
        <div class="p-6 rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700">
          <h3 class="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span class="material-icons text-primary text-lg">star</span> Distribusi Minat Bidang Kru
          </h3>
          <div class="space-y-3">
            <div v-for="item in stats?.byInterest || []" :key="item.interest_name" class="space-y-1">
              <div class="flex justify-between text-xs">
                <span class="text-gray-300 font-medium">{{ item.interest_name }}</span>
                <span class="text-primary font-bold">{{ item.count }} peserta</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                <div 
                  class="bg-primary h-full rounded-full"
                  :style="{ width: `${Math.min(100, (item.count / (stats?.totalSubmissions || 1)) * 100)}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- By Province -->
        <div class="p-6 rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700">
          <h3 class="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span class="material-icons text-primary text-lg">map</span> Top 10 Provinsi Peserta
          </h3>
          <div class="space-y-3">
            <div v-for="item in stats?.byProvince || []" :key="item.province" class="space-y-1">
              <div class="flex justify-between text-xs">
                <span class="text-gray-300 font-medium">{{ item.province }}</span>
                <span class="text-white font-bold">{{ item.count }} peserta</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                <div 
                  class="bg-gradient-to-r from-primary to-pink-500 h-full rounded-full"
                  :style="{ width: `${Math.min(100, (item.count / (stats?.totalSubmissions || 1)) * 100)}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- TAB 3: VIDEOS MANAGEMENT -->
    <!-- ===================================================================== -->
    <div v-else-if="activeTab === 'videos'" class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-white">Daftar Slot Video Challenge</h2>
          <p class="text-xs text-gray-400">Atur 5 video YouTube yang ditampilkan pada langkah Step 3 halaman publik.</p>
        </div>
        <button 
          @click="openAddVideoModal"
          class="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-1.5"
        >
          <span class="material-icons text-sm">add</span>
          <span>Tambah Video</span>
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          v-for="v in videos" 
          :key="v.id"
          class="p-5 rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 space-y-3"
        >
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold">
              Urutan #{{ v.video_order }}
            </span>
            <span 
              class="px-2 py-0.5 rounded text-[10px] font-semibold"
              :class="v.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'"
            >
              {{ v.is_active ? 'Aktif' : 'Non-Aktif' }}
            </span>
          </div>

          <h3 class="text-base font-bold text-gray-900 dark:text-white">{{ v.title }}</h3>
          <p class="text-xs text-gray-500 truncate">URL: {{ v.youtube_url }}</p>

          <p class="text-xs text-gray-400 line-clamp-2 bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg">
            {{ v.instructions || 'Tidak ada panduan khusus' }}
          </p>

          <div class="pt-2 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <span class="text-[11px] text-gray-500">
              ID Video: {{ v.youtube_video_id || '-' }}
            </span>
            <div class="flex items-center gap-2">
              <button 
                @click="openEditVideoModal(v)" 
                class="text-xs text-primary hover:underline font-semibold"
              >
                Edit
              </button>
              <button 
                @click="handleDeleteVideo(v.id)" 
                class="text-xs text-red-400 hover:underline font-semibold"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- TAB 4: QUESTIONS MANAGEMENT -->
    <!-- ===================================================================== -->
    <div v-else-if="activeTab === 'questions'" class="space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-bold text-white">Bank Pertanyaan Challenge</h2>
          <p class="text-xs text-gray-400">Pertanyaan observasi audio-visual, SDGs, dan creative thinking.</p>
        </div>
        <div class="flex items-center gap-2">
          <button 
            @click="activeTab = 'categories'"
            class="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span class="material-icons text-sm text-primary">category</span>
            <span>Master Kategori ({{ categories.length }})</span>
          </button>
          <button 
            @click="openAddQuestionModal()"
            class="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <span class="material-icons text-sm">add</span>
            <span>Tambah Pertanyaan</span>
          </button>
        </div>
      </div>

      <!-- Category Filter Bar -->
      <div class="p-3.5 rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <span class="text-gray-400 font-medium">Filter Kategori:</span>
          <select 
            v-model="filterQuestionCategory"
            class="px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs text-gray-900 dark:text-white outline-none focus:border-primary"
          >
            <option value="">Semua Kategori ({{ questions.length }})</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.name">
              {{ cat.name }} ({{ cat.question_count || 0 }})
            </option>
          </select>
        </div>
        <div class="text-gray-500 text-[11px]">
          Menampilkan {{ filteredQuestions.length }} dari {{ questions.length }} pertanyaan
        </div>
      </div>

      <div class="space-y-3">
        <div v-if="filteredQuestions.length === 0" class="p-8 text-center text-gray-500 bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700">
          Tidak ada pertanyaan untuk kategori ini.
        </div>
        <div 
          v-for="q in filteredQuestions" 
          :key="q.id"
          class="p-5 rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 space-y-2.5"
        >
          <div class="flex items-center justify-between gap-4 flex-wrap">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-400 text-xs font-semibold flex items-center gap-1">
                <span class="material-icons text-xs">label</span>
                {{ q.category }}
              </span>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-gray-400">
                Tipe: {{ q.answer_type }}
              </span>
              <span class="text-xs text-gray-500">
                Urutan #{{ q.question_order }}
              </span>
              <span v-if="!q.is_active" class="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400">
                Nonaktif
              </span>
            </div>

            <div class="flex items-center gap-2">
              <button 
                @click="openEditQuestionModal(q)" 
                class="text-xs text-primary hover:underline font-semibold"
              >
                Edit
              </button>
              <button 
                @click="handleDeleteQuestion(q.id)" 
                class="text-xs text-red-400 hover:underline font-semibold"
              >
                Hapus
              </button>
            </div>
          </div>

          <p class="text-sm font-semibold text-gray-900 dark:text-white leading-relaxed">
            {{ q.question_text }}
          </p>

          <p v-if="q.category_description" class="text-[11px] text-gray-400 dark:text-gray-400 italic">
            Fokus Observasi: {{ q.category_description }}
          </p>

          <div v-if="q.options && q.options.length" class="text-xs text-gray-400 pt-1">
            <span class="text-gray-500 font-medium">Pilihan:</span>
            <ul class="list-disc list-inside mt-0.5 space-y-0.5">
              <li v-for="(opt, oIdx) in q.options" :key="oIdx">{{ opt }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- TAB 5: MASTER KATEGORI SOAL -->
    <!-- ===================================================================== -->
    <div v-else-if="activeTab === 'categories'" class="space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            <span class="material-icons text-primary text-xl">category</span>
            <span>Master Kategori Pertanyaan Challenge</span>
          </h2>
          <p class="text-xs text-gray-400">
            Kategori ini disimpan di database, otomatis digunakan saat membuat pertanyaan challenge, dan ditampilkan di formulir pendaftaran publik.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button 
            @click="loadCategories"
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
            title="Refresh Kategori"
          >
            <span class="material-icons text-base">refresh</span>
          </button>
          <button 
            @click="openAddCategoryModal()"
            class="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <span class="material-icons text-sm">add</span>
            <span>Tambah Kategori</span>
          </button>
        </div>
      </div>

      <!-- Master Categories Table -->
      <div class="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-gray-500 uppercase tracking-wider font-semibold">
              <tr>
                <th class="py-3 px-4 w-16 text-center">Urutan</th>
                <th class="py-3 px-4">Nama Kategori</th>
                <th class="py-3 px-4">Deskripsi / Ruang Lingkup</th>
                <th class="py-3 px-4 text-center">Status</th>
                <th class="py-3 px-4 text-center">Jumlah Soal</th>
                <th class="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
              <tr v-if="loadingCategories">
                <td colspan="6" class="py-12 text-center text-gray-500">Memuat master kategori...</td>
              </tr>
              <tr v-else-if="categories.length === 0">
                <td colspan="6" class="py-12 text-center text-gray-500">Belum ada kategori pertanyaan. Klik "Tambah Kategori" untuk membuat baru.</td>
              </tr>
              <tr 
                v-for="cat in categories" 
                :key="cat.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
              >
                <!-- Order -->
                <td class="py-3 px-4 text-center font-mono font-bold text-gray-400">
                  #{{ cat.order_num }}
                </td>

                <!-- Category Name -->
                <td class="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  <div class="flex items-center gap-2">
                    <span class="material-icons text-primary text-sm">label</span>
                    <span>{{ cat.name }}</span>
                  </div>
                </td>

                <!-- Description -->
                <td class="py-3 px-4 text-gray-500 dark:text-gray-400 max-w-md">
                  {{ cat.description || '-' }}
                </td>

                <!-- Status Active / Toggle -->
                <td class="py-3 px-4 text-center">
                  <button 
                    @click="toggleCategoryActive(cat)"
                    class="px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-colors"
                    :class="cat.is_active ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'"
                    :title="cat.is_active ? 'Klik untuk menonaktifkan' : 'Klik untuk mengaktifkan'"
                  >
                    {{ cat.is_active ? 'Aktif' : 'Nonaktif' }}
                  </button>
                </td>

                <!-- Question Count -->
                <td class="py-3 px-4 text-center">
                  <span class="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-mono font-bold" :class="cat.question_count > 0 ? 'bg-primary/20 text-primary' : 'bg-gray-500/10 text-gray-500'">
                    {{ cat.question_count || 0 }}
                  </span>
                </td>

                <!-- Actions -->
                <td class="py-3 px-4 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <button 
                      @click="openEditCategoryModal(cat)"
                      class="px-2 py-1 rounded hover:bg-primary/10 text-primary font-semibold transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      @click="handleDeleteCategory(cat)"
                      class="px-2 py-1 rounded hover:bg-red-500/10 text-red-400 font-semibold transition-colors"
                      :disabled="cat.question_count > 0"
                      :class="cat.question_count > 0 ? 'opacity-40 cursor-not-allowed' : ''"
                      :title="cat.question_count > 0 ? 'Tidak dapat dihapus karena masih digunakan soal' : 'Hapus kategori'"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- TAB 5: CHALLENGE SETTINGS -->
    <!-- ===================================================================== -->
    <div v-else-if="activeTab === 'settings'" class="max-w-2xl bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <h2 class="text-lg font-bold text-white border-b border-gray-200 dark:border-gray-700 pb-3">
        Pengaturan Program Challenge
      </h2>

      <div>
        <label class="block text-xs font-medium text-gray-400 mb-1">Judul Challenge</label>
        <input 
          type="text" 
          v-model="challengeForm.title"
          class="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm text-white outline-none focus:border-primary"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Slug URL</label>
          <input 
            type="text" 
            v-model="challengeForm.slug"
            class="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm text-white outline-none focus:border-primary"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Status Publikasi</label>
          <select 
            v-model="challengeForm.status"
            class="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm text-white outline-none focus:border-primary"
          >
            <option value="draft">Draft (Ditutup)</option>
            <option value="published">Published (Dibuka untuk umum)</option>
            <option value="closed">Closed (Pendaftaran Berakhir)</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-400 mb-1">Subjudul / Penyelenggara</label>
        <input 
          type="text" 
          v-model="challengeForm.subtitle"
          class="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm text-white outline-none focus:border-primary"
        />
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-400 mb-1">Deskripsi Ringkas</label>
        <textarea 
          v-model="challengeForm.description"
          rows="3"
          class="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm text-white outline-none focus:border-primary"
        ></textarea>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Tanggal Mulai</label>
          <input 
            type="date" 
            v-model="challengeForm.start_date"
            class="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm text-white outline-none focus:border-primary"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Tanggal Berakhir</label>
          <input 
            type="date" 
            v-model="challengeForm.end_date"
            class="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm text-white outline-none focus:border-primary"
          />
        </div>
      </div>

      <div class="pt-2">
        <button 
          @click="handleSaveChallengeSettings"
          :disabled="savingChallenge"
          class="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
        >
          {{ savingChallenge ? 'Menyimpan...' : 'Simpan Pengaturan' }}
        </button>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL: REVIEW SUBMISSION -->
    <!-- ===================================================================== -->
    <div v-if="showReviewModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div class="bg-[#12141A] rounded-2xl border border-white/15 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <!-- Modal Header -->
        <div class="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <span class="text-xs font-mono font-bold text-primary">
              {{ selectedSubmission?.submission?.registration_number }}
            </span>
            <h3 class="text-lg font-bold text-white">
              Detail & Penilaian Jawaban Peserta
            </h3>
          </div>
          <button @click="showReviewModal = false" class="text-gray-400 hover:text-white">
            <span class="material-icons">close</span>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          <div v-if="loadingDetail" class="py-12 text-center text-gray-500">Memuat jawaban...</div>
          
          <div v-else-if="selectedSubmission" class="space-y-6">
            <!-- 1. Participant Identity -->
            <div class="p-4 rounded-xl bg-white/5 border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span class="text-gray-500 block">Nama Lengkap</span>
                <span class="text-white font-bold text-sm">{{ selectedSubmission.submission.full_name }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">Email & WhatsApp</span>
                <span class="text-white">{{ selectedSubmission.submission.email }}</span>
                <span class="text-gray-400 block">{{ selectedSubmission.submission.whatsapp }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">Institusi & Provinsi</span>
                <span class="text-white">{{ selectedSubmission.submission.institution }}</span>
                <span class="text-gray-400 block">{{ selectedSubmission.submission.province }} ({{ selectedSubmission.submission.age_range }})</span>
              </div>
            </div>

            <!-- 2. Selected Interests & Additional info -->
            <div class="space-y-2">
              <span class="text-gray-400 font-semibold block">Bidang Minat Terpilih:</span>
              <div class="flex flex-wrap gap-2">
                <span 
                  v-for="i in selectedSubmission.interests" 
                  :key="i"
                  class="px-3 py-1 rounded-full bg-primary/20 text-pink-300 border border-primary/30 font-medium"
                >
                  {{ i }}
                </span>
              </div>

              <div v-if="selectedSubmission.submission.portfolio_url" class="pt-2">
                <span class="text-gray-400 font-semibold">Link Portofolio: </span>
                <a :href="selectedSubmission.submission.portfolio_url" target="_blank" class="text-primary hover:underline">
                  {{ selectedSubmission.submission.portfolio_url }}
                </a>
              </div>

              <div v-if="selectedSubmission.submission.experience_skills" class="pt-1">
                <span class="text-gray-400 font-semibold block">Pengalaman / Skill:</span>
                <p class="text-gray-300 bg-white/5 p-3 rounded-lg mt-1 whitespace-pre-line">{{ selectedSubmission.submission.experience_skills }}</p>
              </div>
            </div>

            <!-- 3. All Questions & Answers -->
            <div class="space-y-4 pt-2 border-t border-white/10">
              <h4 class="text-sm font-bold text-white flex items-center gap-1.5">
                <span class="material-icons text-primary text-base">quiz</span>
                <span>Jawaban Observasi Video ({{ selectedSubmission.answers?.length || 0 }} Jawaban)</span>
              </h4>

              <div 
                v-for="(ans, aIdx) in selectedSubmission.answers" 
                :key="ans.answer_id"
                class="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2"
              >
                <div class="flex items-center justify-between text-gray-400">
                  <span class="px-2 py-0.5 rounded bg-primary/20 text-pink-300 text-[10px] font-semibold">
                    {{ ans.category }}
                  </span>
                  <span class="text-[10px]">Video: {{ ans.video_title || 'Terkait' }}</span>
                </div>

                <p class="font-semibold text-white">{{ ans.question_text }}</p>

                <div class="bg-black/40 p-3 rounded-lg border border-white/5">
                  <span class="text-gray-500 text-[10px] uppercase font-bold block mb-1">Jawaban Peserta:</span>
                  <p class="text-gray-200 leading-relaxed whitespace-pre-line">{{ ans.answer_text }}</p>
                </div>
              </div>
            </div>

            <!-- 4. Review & Scoring Controls -->
            <div class="p-4 rounded-xl bg-primary/10 border border-primary/30 space-y-3">
              <h4 class="font-bold text-white flex items-center gap-1.5 text-sm">
                <span class="material-icons text-primary text-base">rate_review</span>
                <span>Keputusan Kurasi & Penilaian</span>
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-gray-300 mb-1">Status Penilaian</label>
                  <select 
                    v-model="reviewForm.review_status"
                    class="w-full px-3 py-2 rounded-lg bg-[#1A1D24] border border-white/15 text-white outline-none"
                  >
                    <option value="submitted">Submitted (Belum Dinilai)</option>
                    <option value="under_review">Under Review (Sedang Dikurasi)</option>
                    <option value="shortlisted">Shortlisted (Lolos Seleksi)</option>
                    <option value="not_selected">Not Selected (Belum Terpilih)</option>
                  </select>
                </div>

                <div>
                  <label class="block text-gray-300 mb-1">Skor Penilaian (0 - 100)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    v-model="reviewForm.review_score"
                    placeholder="Contoh: 85"
                    class="w-full px-3 py-2 rounded-lg bg-[#1A1D24] border border-white/15 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label class="block text-gray-300 mb-1">Catatan Kurator / Reviewer</label>
                <textarea 
                  v-model="reviewForm.reviewer_notes"
                  rows="2"
                  placeholder="Komentar hasil kurasi, alasan kelolosan, atau catatan teknis..."
                  class="w-full px-3 py-2 rounded-lg bg-[#1A1D24] border border-white/15 text-white outline-none"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="p-4 border-t border-white/10 flex items-center justify-end gap-2 bg-[#0E1015] rounded-b-2xl">
          <button 
            @click="showReviewModal = false" 
            class="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs"
          >
            Tutup
          </button>
          <button 
            @click="handleSaveReview" 
            :disabled="savingReview"
            class="px-6 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-md disabled:opacity-50"
          >
            {{ savingReview ? 'Menyimpan...' : 'Simpan Penilaian' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL: ADD / EDIT VIDEO -->
    <!-- ===================================================================== -->
    <div v-if="showVideoModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div class="bg-[#12141A] rounded-2xl border border-white/15 max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
        <h3 class="text-base font-bold text-white">
          {{ editingVideo ? 'Edit Slot Video' : 'Tambah Video Challenge' }}
        </h3>

        <div>
          <label class="block text-gray-400 mb-1">Judul Video</label>
          <input 
            type="text" 
            v-model="videoForm.title"
            placeholder="Contoh: Video 1: Sinematografi & Pencahayaan"
            class="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none"
          />
        </div>

        <div>
          <label class="block text-gray-400 mb-1">URL YouTube</label>
          <input 
            type="url" 
            v-model="videoForm.youtube_url"
            placeholder="https://www.youtube.com/watch?v=..."
            class="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-gray-400 mb-1">Urutan Video</label>
            <input 
              type="number" 
              v-model="videoForm.video_order"
              class="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none"
            />
          </div>
          <div>
            <label class="block text-gray-400 mb-1">Status</label>
            <select 
              v-model="videoForm.is_active"
              class="w-full px-3 py-2 rounded-lg bg-[#1A1D24] border border-white/10 text-white outline-none"
            >
              <option :value="1">Aktif</option>
              <option :value="0">Non-Aktif</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-gray-400 mb-1">Instruksi / Panduan Pengamatan</label>
          <textarea 
            v-model="videoForm.instructions"
            rows="3"
            placeholder="Panduan bagi peserta saat menonton video..."
            class="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none"
          ></textarea>
        </div>

        <div class="pt-2 flex justify-end gap-2">
          <button @click="showVideoModal = false" class="px-4 py-2 rounded-lg bg-white/5 text-gray-400">Batal</button>
          <button @click="handleSaveVideo" class="px-5 py-2 rounded-lg bg-primary text-white font-bold">Simpan</button>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL: ADD / EDIT QUESTION -->
    <!-- ===================================================================== -->
    <div v-if="showQuestionModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div class="bg-[#12141A] rounded-2xl border border-white/15 max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
        <h3 class="text-base font-bold text-white">
          {{ editingQuestion ? 'Edit Pertanyaan' : 'Tambah Pertanyaan Challenge' }}
        </h3>

        <div>
          <label class="block text-gray-400 mb-1">Terkait Video</label>
          <select 
            v-model="questionForm.video_id"
            class="w-full px-3 py-2 rounded-lg bg-[#1A1D24] border border-white/10 text-white outline-none"
          >
            <option v-for="v in videos" :key="v.id" :value="v.id">
              Video {{ v.video_order }}: {{ v.title }}
            </option>
          </select>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block text-gray-400">Kategori Pertanyaan <span class="text-pink-400">*</span></label>
            <button 
              type="button" 
              @click="activeTab = 'categories'; showQuestionModal = false"
              class="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
              title="Buka tab Master Kategori"
            >
              <span class="material-icons text-xs">settings</span> Kelola Master Kategori
            </button>
          </div>
          <select 
            :value="questionForm.category"
            @change="onCategorySelectChange"
            class="w-full px-3 py-2 rounded-lg bg-[#1A1D24] border border-white/10 text-white outline-none focus:border-primary"
          >
            <option disabled value="">-- Pilih Kategori Dari Database --</option>
            <option v-for="c in categories" :key="c.id" :value="c.name">
              {{ c.name }} {{ !c.is_active ? '(Nonaktif)' : '' }}
            </option>
          </select>
          <p v-if="selectedQuestionCategoryDesc" class="mt-1 text-[11px] text-gray-400 italic">
            {{ selectedQuestionCategoryDesc }}
          </p>
        </div>

        <div>
          <label class="block text-gray-400 mb-1">Teks Pertanyaan</label>
          <textarea 
            v-model="questionForm.question_text"
            rows="3"
            placeholder="Tuliskan pertanyaan observasi..."
            class="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none"
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-gray-400 mb-1">Tipe Jawaban</label>
            <select 
              v-model="questionForm.answer_type"
              class="w-full px-3 py-2 rounded-lg bg-[#1A1D24] border border-white/10 text-white outline-none"
            >
              <option value="essay">Essay / Uraian Panjang</option>
              <option value="single_choice">Pilihan Tunggal (Radio)</option>
              <option value="multiple_choice">Pilihan Ganda (Checkbox)</option>
            </select>
          </div>
          <div>
            <label class="block text-gray-400 mb-1">Urutan Soal</label>
            <input 
              type="number" 
              v-model="questionForm.question_order"
              class="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none"
            />
          </div>
        </div>

        <div v-if="questionForm.answer_type !== 'essay'">
          <label class="block text-gray-400 mb-1">Pilihan Jawaban (Satu baris per opsi)</label>
          <textarea 
            v-model="questionForm.optionsStr"
            rows="3"
            placeholder="Opsi 1&#10;Opsi 2&#10;Opsi 3"
            class="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none font-mono"
          ></textarea>
        </div>

        <div class="pt-2 flex justify-end gap-2">
          <button @click="showQuestionModal = false" class="px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:text-white">Batal</button>
          <button @click="handleSaveQuestion" class="px-5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold">Simpan</button>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL: ADD / EDIT QUESTION CATEGORY -->
    <!-- ===================================================================== -->
    <div v-if="showCategoryModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div class="bg-[#12141A] rounded-2xl border border-white/15 max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <span class="material-icons text-primary text-lg">category</span>
            <span>{{ editingCategory ? 'Edit Kategori Pertanyaan' : 'Tambah Kategori Pertanyaan' }}</span>
          </h3>
          <button @click="showCategoryModal = false" class="text-gray-400 hover:text-white">
            <span class="material-icons text-base">close</span>
          </button>
        </div>

        <div>
          <label class="block text-gray-400 mb-1">Nama Kategori <span class="text-pink-400">*</span></label>
          <input 
            type="text" 
            v-model="categoryForm.name"
            placeholder="Contoh: Lighting & Penataan Cahaya"
            class="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-primary"
          />
        </div>

        <div>
          <label class="block text-gray-400 mb-1">Deskripsi / Ruang Lingkup Observasi</label>
          <textarea 
            v-model="categoryForm.description"
            rows="3"
            placeholder="Jelaskan aspek kompetensi atau pengamatan apa yang dinilai pada kategori ini..."
            class="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-primary"
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-gray-400 mb-1">Urutan Tampilan</label>
            <input 
              type="number" 
              v-model="categoryForm.order_num"
              class="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-primary"
            />
          </div>
          <div>
            <label class="block text-gray-400 mb-1">Status Kategori</label>
            <select 
              v-model="categoryForm.is_active"
              class="w-full px-3 py-2 rounded-lg bg-[#1A1D24] border border-white/10 text-white text-xs outline-none focus:border-primary"
            >
              <option :value="1">Aktif</option>
              <option :value="0">Non-Aktif</option>
            </select>
          </div>
        </div>

        <div class="pt-2 flex justify-end gap-2 border-t border-white/10">
          <button @click="showCategoryModal = false" class="px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:text-white">Batal</button>
          <button @click="handleSaveCategory" :disabled="savingCategory" class="px-5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold flex items-center gap-1.5">
            <span v-if="savingCategory" class="material-icons text-xs animate-spin">refresh</span>
            <span>{{ savingCategory ? 'Menyimpan...' : 'Simpan Kategori' }}</span>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
