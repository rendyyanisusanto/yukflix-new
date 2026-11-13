<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { challengeService } from '../services/challengeService'

const route = useRoute()
const router = useRouter()

// State
const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const challenge = ref(null)
const videos = ref([])
const questions = ref([])
const categories = ref([])

// Current step (1 to 6, 7 is success)
const currentStep = ref(1)

// Active video tab in Step 3 / 4
const currentVideoIndex = ref(0)

// Form data
const participant = ref({
  full_name: '',
  email: '',
  whatsapp: '',
  institution: '',
  province: '',
  age_range: '',
  organization_role: '',
  data_consent: false,
  honeypot: '' // anti-spam
})

// Answers map: { [questionId]: answerValue }
const answers = ref({})

// Interests: Array of selected names (max 3)
const selectedInterests = ref([])
const additionalInfo = ref({
  experience_skills: '',
  portfolio_url: '',
  motivation: ''
})

// Submission result
const submissionResult = ref(null)
const copySuccess = ref(false)

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

const AGE_RANGES = [
  '< 16 tahun',
  '16 - 18 tahun (SMA / SMK / Sederajat)',
  '19 - 22 tahun (Mahasiswa / Pemuda)',
  '23 - 26 tahun',
  '> 26 tahun'
]

const AVAILABLE_INTERESTS = [
  { name: 'Director', icon: 'movie_filter', desc: 'Memimpin visi kreatif dan pengadeganan film' },
  { name: 'Director of Photography (DOP)', icon: 'videocam', desc: 'Merancang tata cahaya, kamera & estetika visual' },
  { name: 'Camera Operator', icon: 'camera_alt', desc: 'Mengoperasikan kamera & pergerakan shot' },
  { name: 'Scriptwriter', icon: 'edit_note', desc: 'Mengembangkan naskah, struktur plot & dialog' },
  { name: 'Film Editor', icon: 'content_cut', desc: 'Menata ritme, pacing & perakitan adegan' },
  { name: 'Sound Designer / Audio', icon: 'graphic_eq', desc: 'Merekam dialog, merancang soundscape & foley' },
  { name: 'Art Director / Property', icon: 'palette', desc: 'Menata set panggung, properti & artistik ruangan' },
  { name: 'Wardrobe & Makeup', icon: 'styler', desc: 'Merancang kostum dan tata rias karakter' },
  { name: 'Actor / Talent', icon: 'theater_comedy', desc: 'Menghidupkan karakter di depan kamera' },
  { name: 'Producer / Production Manager', icon: 'schedule', desc: 'Manajemen produksi, jadwal, logistik & kru' },
  { name: 'SDGs Researcher', icon: 'public', desc: 'Riset isu sosial, lingkungan, dan dampak SDGs dalam cerita' },
  { name: 'Public Relations / Social Media', icon: 'campaign', desc: 'Pemasaran, promosi, media sosial & distribusi film' }
]

onMounted(async () => {
  await loadChallenge()
})

async function loadChallenge() {
  loading.value = true
  error.value = ''
  try {
    const slug = route.params.slug || 'national-youth-film-crew-talent'
    const { data, error: err } = await challengeService.getPublicChallenge(slug)

    if (err) throw err

    challenge.value = data.challenge
    videos.value = data.videos || []
    questions.value = data.questions || []
    categories.value = data.categories || []

    // If categories not in challenge data, fetch separately as fallback
    if (!categories.value.length) {
      try {
        const { data: catData } = await challengeService.getCategories({ active_only: 1 })
        if (catData) categories.value = catData
      } catch (catErr) {
        console.warn('Could not load separate categories:', catErr)
      }
    }
  } catch (err) {
    console.error('Failed to load challenge:', err)
    error.value = err.message || 'Challenge tidak ditemukan atau pendaftaran telah ditutup.'
  } finally {
    loading.value = false
  }
}

// Helpers
const activeVideo = computed(() => {
  if (videos.value.length === 0) return null
  return videos.value[currentVideoIndex.value] || videos.value[0]
})

const activeVideoQuestions = computed(() => {
  if (!activeVideo.value) return []
  return questions.value.filter(q => q.video_id === activeVideo.value.id)
})

const totalAnsweredQuestions = computed(() => {
  return questions.value.filter(q => {
    const ans = answers.value[q.id]
    if (Array.isArray(ans)) return ans.length > 0
    return ans !== undefined && ans !== null && String(ans).trim().length > 0
  }).length
})

function getYouTubeEmbedUrl(url, videoId) {
  const id = videoId || extractYouTubeId(url)
  if (!id) return ''
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`
}

function extractYouTubeId(url) {
  if (!url) return null
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[2].length === 11) ? match[2] : null
}

function toggleInterest(interestName) {
  const idx = selectedInterests.value.indexOf(interestName)
  if (idx > -1) {
    selectedInterests.value.splice(idx, 1)
  } else {
    if (selectedInterests.value.length >= 3) {
      alert('Anda dapat memilih maksimal 3 bidang minat perfilman.')
      return
    }
    selectedInterests.value.push(interestName)
  }
}

// Multi-step validation & navigation
function goToStep(step) {
  error.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
  currentStep.value = step
}

function validateStep2AndNext() {
  error.value = ''
  const p = participant.value
  if (!p.full_name || p.full_name.trim().length < 2) {
    error.value = 'Silakan isi nama lengkap Anda.'
    return
  }
  if (!p.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) {
    error.value = 'Silakan isi alamat email yang valid.'
    return
  }
  if (!p.whatsapp || p.whatsapp.trim().length < 8) {
    error.value = 'Silakan isi nomor WhatsApp aktif Anda minimal 8 digit.'
    return
  }
  if (!p.institution || p.institution.trim().length < 2) {
    error.value = 'Silakan isi asal sekolah, kampus, atau komunitas Anda.'
    return
  }
  if (!p.province) {
    error.value = 'Silakan pilih provinsi domisili Anda.'
    return
  }
  if (!p.age_range) {
    error.value = 'Silakan pilih rentang usia Anda.'
    return
  }
  if (!p.data_consent) {
    error.value = 'Anda harus menyetujui penggunaan data untuk melanjutkan.'
    return
  }

  goToStep(3)
}

function validateStep5AndNext() {
  error.value = ''
  if (selectedInterests.value.length === 0) {
    error.value = 'Pilih minimal 1 bidang minat perfilman (maksimal 3).'
    return
  }
  goToStep(6)
}

async function handleSubmit() {
  error.value = ''
  submitting.value = true

  try {
    const formattedAnswers = Object.entries(answers.value)
      .map(([question_id, val]) => ({
        question_id,
        answer_text: val
      }))
      .filter(item => {
        if (Array.isArray(item.answer_text)) return item.answer_text.length > 0
        return item.answer_text !== undefined && item.answer_text !== null && String(item.answer_text).trim().length > 0
      })

    const payload = {
      full_name: participant.value.full_name,
      email: participant.value.email,
      whatsapp: participant.value.whatsapp,
      institution: participant.value.institution,
      province: participant.value.province,
      age_range: participant.value.age_range,
      organization_role: participant.value.organization_role,
      data_consent: participant.value.data_consent,
      experience_skills: additionalInfo.value.experience_skills,
      portfolio_url: additionalInfo.value.portfolio_url,
      motivation: additionalInfo.value.motivation,
      interests: selectedInterests.value,
      answers: formattedAnswers,
      website: participant.value.honeypot
    }

    const slug = route.params.slug || 'national-youth-film-crew-talent'
    const { data, error: submitErr } = await challengeService.submitChallenge(slug, payload)

    if (submitErr) throw submitErr

    submissionResult.value = data
    currentStep.value = 7 // Success page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (err) {
    console.error('Submit error:', err)
    error.value = err.message || 'Gagal mengirimkan formulir challenge. Silakan periksa kembali data Anda.'
  } finally {
    submitting.value = false
  }
}

function copyRegNumber() {
  if (!submissionResult.value?.registration_number) return
  navigator.clipboard.writeText(submissionResult.value.registration_number)
  copySuccess.value = true
  setTimeout(() => {
    copySuccess.value = false
  }, 2500)
}
</script>

<template>
  <div class="min-h-screen bg-[#09090B] text-gray-100 flex flex-col font-sans selection:bg-primary selection:text-white relative">
    
    <!-- Top Branding Header -->
    <header class="w-full bg-[#0F1115]/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-30 transition-all">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <router-link to="/" class="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <img src="/src/assets/logo.png" alt="Yukflix" class="h-8 w-auto" />
          <div class="hidden sm:block">
            <span class="text-xs font-semibold tracking-widest uppercase text-primary block leading-none">Film Challenge</span>
            <span class="text-sm font-display font-bold text-white tracking-wide">KINARYA COOP</span>
          </div>
        </router-link>

        <!-- Progress step pills on top -->
        <div v-if="currentStep >= 1 && currentStep <= 6" class="hidden md:flex items-center gap-2 text-xs font-medium">
          <span 
            v-for="stepNum in 6" 
            :key="stepNum"
            class="h-2 rounded-full transition-all duration-300"
            :class="[
              stepNum === currentStep ? 'w-8 bg-primary' : (stepNum < currentStep ? 'w-4 bg-primary/40' : 'w-2 bg-white/20')
            ]"
          ></span>
          <span class="text-gray-400 ml-2">Langkah {{ currentStep }} / 6</span>
        </div>
      </div>
    </header>

    <!-- Main Content Container -->
    <main class="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      <!-- Global Loading -->
      <div v-if="loading" class="py-24 text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        <p class="mt-4 text-gray-400 text-sm">Memuat informasi challenge...</p>
      </div>

      <!-- Global Error (e.g. Challenge not found) -->
      <div v-else-if="error && currentStep === 1 && !challenge" class="py-16 text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-500 mb-4">
          <span class="material-icons text-3xl">error_outline</span>
        </div>
        <h2 class="text-2xl font-bold text-white mb-2">Challenge Tidak Tersedia</h2>
        <p class="text-gray-400 max-w-md mx-auto mb-6">{{ error }}</p>
        <router-link to="/" class="btn-primary inline-flex items-center gap-2">
          Kembali ke Beranda
        </router-link>
      </div>

      <div v-else>
        <!-- Notice / Validation Alert -->
        <div v-if="error" class="mb-6 p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-sm flex items-start gap-3 animate-shake">
          <span class="material-icons text-red-400 text-xl flex-shrink-0">warning</span>
          <span>{{ error }}</span>
        </div>

        <!-- ================================================================= -->
        <!-- STEP 1: INTRODUCTION -->
        <!-- ================================================================= -->
        <div v-if="currentStep === 1" class="space-y-8 animate-fadeIn">
          <!-- Hero Banner Card -->
          <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A1D24] via-[#12141A] to-[#0A0B0E] border border-white/10 p-6 sm:p-10 shadow-2xl">
            <!-- Background Glow -->
            <div class="absolute -top-24 -right-24 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

            <div class="relative z-10 max-w-2xl">
              <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-semibold uppercase tracking-wider mb-4">
                <span class="material-icons text-sm">stars</span> National Program
              </span>

              <h1 class="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight leading-tight mb-3">
                {{ challenge?.title || 'NATIONAL YOUTH FILM CREW & TALENT CHALLENGE' }}
              </h1>
              <p class="text-lg sm:text-xl font-medium text-pink-400 mb-4">
                {{ challenge?.subtitle || 'Kinarya Coop' }}
              </p>
              <p class="text-gray-300 text-sm sm:text-base leading-relaxed mb-6">
                {{ challenge?.description || 'Program seleksi dan tantangan audio-visual untuk pelajar, mahasiswa, dan generasi muda Indonesia yang ingin mengasah literasi sinematografi serta berkontribusi nyata dalam industri perfilman nasional.' }}
              </p>

              <!-- 3 Feature Points -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6 pt-4 border-t border-white/10 text-xs sm:text-sm">
                <div class="flex items-center gap-2.5 text-gray-300">
                  <span class="material-icons text-primary text-lg">play_circle</span>
                  <span>{{ videos.length || 5 }} Video YouTube</span>
                </div>
                <div class="flex items-center gap-2.5 text-gray-300">
                  <span class="material-icons text-primary text-lg">quiz</span>
                  <span>{{ (categories && categories.length) || 12 }} Kategori Observasi</span>
                </div>
                <div class="flex items-center gap-2.5 text-gray-300">
                  <span class="material-icons text-primary text-lg">how_to_reg</span>
                  <span>Minat Kru & Portofolio</span>
                </div>
              </div>

              <!-- Observation Categories Preview from Master Database -->
              <div v-if="categories && categories.length" class="my-6 p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold text-gray-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <span class="material-icons text-primary text-sm">category</span>
                    Kategori Pengamatan & Kompetensi ({{ categories.length }})
                  </span>
                  <span class="text-[11px] text-pink-400 font-medium">Standar Seleksi</span>
                </div>
                <div class="flex flex-wrap gap-2">
                  <span 
                    v-for="cat in categories" 
                    :key="cat.id"
                    class="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-xs text-gray-300 flex items-center gap-1.5 hover:border-primary/50 transition-colors"
                    :title="cat.description || cat.name"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>
                    <span>{{ cat.name }}</span>
                  </span>
                </div>
              </div>

              <!-- Disclaimer Alert -->
              <div class="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400 flex items-start gap-3 mb-8">
                <span class="material-icons text-amber-400 text-lg flex-shrink-0 mt-0.5">info</span>
                <span>
                  <strong>Catatan Penting:</strong> Partisipasi dalam challenge ini tidak otomatis menjamin peserta langsung diterima sebagai kru produksi. Jawaban Anda akan dikurasi secara mendalam oleh tim kurator, dan peserta yang berpotensi akan diundang ke tahap seleksi berikutnya.
                </span>
              </div>

              <!-- CTA Button -->
              <button 
                @click="goToStep(2)"
                class="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-[#e94e77] hover:from-primary/90 hover:to-[#e94e77]/90 text-white font-bold text-base shadow-lg shadow-primary/25 flex items-center justify-center gap-3 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>MULAI CHALLENGE</span>
                <span class="material-icons">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ================================================================= -->
        <!-- STEP 2: DATA PESERTA -->
        <!-- ================================================================= -->
        <div v-else-if="currentStep === 2" class="space-y-6 animate-fadeIn">
          <div class="border-b border-white/10 pb-4">
            <h2 class="text-2xl font-bold text-white mb-1">Data Diri Peserta</h2>
            <p class="text-sm text-gray-400">Silakan lengkapi identitas Anda dengan data yang valid untuk komunikasi seleksi.</p>
          </div>

          <!-- Hidden Honeypot for spam bot detection -->
          <input type="text" v-model="participant.honeypot" class="hidden" tabindex="-1" autocomplete="off" />

          <div class="bg-[#12141A] rounded-2xl border border-white/10 p-6 sm:p-8 space-y-5">
            <!-- Full Name -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1.5">
                Nama Lengkap <span class="text-red-400">*</span>
              </label>
              <input 
                type="text" 
                v-model="participant.full_name" 
                placeholder="Contoh: Budi Santoso"
                class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary text-white text-sm outline-none transition-all placeholder:text-gray-600"
              />
            </div>

            <!-- Email & WhatsApp Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1.5">
                  Alamat Email Aktif <span class="text-red-400">*</span>
                </label>
                <input 
                  type="email" 
                  v-model="participant.email" 
                  placeholder="nama@email.com"
                  class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary text-white text-sm outline-none transition-all placeholder:text-gray-600"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1.5">
                  Nomor WhatsApp Aktif <span class="text-red-400">*</span>
                </label>
                <input 
                  type="tel" 
                  v-model="participant.whatsapp" 
                  placeholder="081234567890"
                  class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary text-white text-sm outline-none transition-all placeholder:text-gray-600"
                />
              </div>
            </div>

            <!-- Institution -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1.5">
                Asal Sekolah / Kampus / Komunitas <span class="text-red-400">*</span>
              </label>
              <input 
                type="text" 
                v-model="participant.institution" 
                placeholder="Contoh: SMK Negeri 1 Jakarta / Komunitas Film Indie"
                class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary text-white text-sm outline-none transition-all placeholder:text-gray-600"
              />
            </div>

            <!-- Province & Age Range Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1.5">
                  Provinsi Domisili <span class="text-red-400">*</span>
                </label>
                <select 
                  v-model="participant.province"
                  class="w-full px-4 py-3 rounded-xl bg-[#1A1D24] border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary text-white text-sm outline-none transition-all"
                >
                  <option value="" disabled>-- Pilih Provinsi --</option>
                  <option v-for="prov in PROVINCES" :key="prov" :value="prov">{{ prov }}</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1.5">
                  Rentang Usia <span class="text-red-400">*</span>
                </label>
                <select 
                  v-model="participant.age_range"
                  class="w-full px-4 py-3 rounded-xl bg-[#1A1D24] border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary text-white text-sm outline-none transition-all"
                >
                  <option value="" disabled>-- Pilih Rentang Usia --</option>
                  <option v-for="age in AGE_RANGES" :key="age" :value="age">{{ age }}</option>
                </select>
              </div>
            </div>

            <!-- Organization Role (Optional) -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1.5">
                Posisi / Peran di Organisasi / Ekskul <span class="text-gray-500 font-normal">(Opsional)</span>
              </label>
              <input 
                type="text" 
                v-model="participant.organization_role" 
                placeholder="Contoh: Ketua Ekskul Sinematografi / Anggota Divisi Media"
                class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary text-white text-sm outline-none transition-all placeholder:text-gray-600"
              />
            </div>

            <!-- Consent Checkbox -->
            <div class="pt-3 border-t border-white/10">
              <label class="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  v-model="participant.data_consent"
                  class="mt-1 w-4 h-4 rounded text-primary focus:ring-primary bg-white/5 border-white/20 cursor-pointer"
                />
                <span class="text-xs text-gray-400 leading-relaxed group-hover:text-gray-300">
                  Saya menyatakan bahwa data yang saya isi adalah benar dan menyetujui data ini digunakan oleh Kinarya Coop & YukFlix untuk kebutuhan administrasi, kurasi challenge, dan komunikasi proses seleksi kru film.
                </span>
              </label>
            </div>
          </div>

          <!-- Buttons -->
          <div class="flex items-center justify-between pt-4">
            <button 
              @click="goToStep(1)"
              class="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium transition-colors"
            >
              Kembali
            </button>
            <button 
              @click="validateStep2AndNext"
              class="px-7 py-3 rounded-xl bg-gradient-to-r from-primary to-[#e94e77] text-white font-bold text-sm shadow-md hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Lanjut ke Video</span>
              <span class="material-icons text-base">arrow_forward</span>
            </button>
          </div>
        </div>

        <!-- ================================================================= -->
        <!-- STEP 3: VIDEO CHALLENGE -->
        <!-- ================================================================= -->
        <div v-else-if="currentStep === 3" class="space-y-6 animate-fadeIn">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 class="text-2xl font-bold text-white mb-1">Video Challenge</h2>
              <p class="text-sm text-gray-400">Tonton lima video di bawah ini dan cermati setiap detail adegan.</p>
            </div>
            
            <button 
              @click="goToStep(4)"
              class="self-start sm:self-auto px-4 py-2 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>Lompat ke Pertanyaan</span>
              <span class="material-icons text-sm">arrow_forward</span>
            </button>
          </div>

          <!-- Video Selector Tabs -->
          <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button 
              v-for="(vid, idx) in videos" 
              :key="vid.id"
              @click="currentVideoIndex = idx"
              class="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all border"
              :class="[
                currentVideoIndex === idx 
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25' 
                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
              ]"
            >
              Video {{ idx + 1 }}
            </button>
          </div>

          <!-- Video Player Card -->
          <div v-if="activeVideo" class="bg-[#12141A] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <!-- 16:9 Video Embed Container -->
            <div class="relative w-full pb-[56.25%] bg-black">
              <iframe 
                :src="getYouTubeEmbedUrl(activeVideo.youtube_url, activeVideo.youtube_video_id)" 
                title="Challenge Video Player"
                class="absolute inset-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
            </div>

            <!-- Video Info & Instructions -->
            <div class="p-6 sm:p-8 space-y-4">
              <div class="flex items-center justify-between gap-4 flex-wrap">
                <span class="px-3 py-1 rounded-full bg-white/10 text-pink-400 text-xs font-semibold tracking-wider uppercase">
                  Video {{ currentVideoIndex + 1 }} dari {{ videos.length }}
                </span>
                <span class="text-xs text-gray-500">
                  {{ activeVideoQuestions.length }} pertanyaan terkait video ini
                </span>
              </div>

              <h3 class="text-xl sm:text-2xl font-bold text-white">
                {{ activeVideo.title }}
              </h3>

              <div class="p-4 rounded-xl bg-white/5 border border-white/10">
                <h4 class="text-xs font-semibold text-primary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <span class="material-icons text-sm">visibility</span> Panduan Pengamatan
                </h4>
                <p class="text-sm text-gray-300 leading-relaxed">
                  {{ activeVideo.instructions || 'Amati dengan teliti aspek pencahayaan, pergerakan kamera, dialog, tata artistik, dan pesan sosial dalam video.' }}
                </p>
              </div>

              <!-- Next Video / Question CTA -->
              <div class="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div class="flex items-center gap-2 w-full sm:w-auto">
                  <button 
                    v-if="currentVideoIndex > 0"
                    @click="currentVideoIndex--"
                    class="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium transition-colors"
                  >
                    ← Video Sebelumnya
                  </button>
                  <button 
                    v-if="currentVideoIndex < videos.length - 1"
                    @click="currentVideoIndex++"
                    class="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium transition-colors"
                  >
                    Video Berikutnya →
                  </button>
                </div>

                <button 
                  @click="goToStep(4)"
                  class="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-[#e94e77] text-white font-bold text-sm shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>LANJUT KE PERTANYAAN</span>
                  <span class="material-icons text-base">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Bottom Navigation -->
          <div class="flex items-center justify-between pt-2">
            <button 
              @click="goToStep(2)"
              class="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium transition-colors"
            >
              Kembali ke Data Diri
            </button>
          </div>
        </div>

        <!-- ================================================================= -->
        <!-- STEP 4: PERTANYAAN CHALLENGE -->
        <!-- ================================================================= -->
        <div v-else-if="currentStep === 4" class="space-y-6 animate-fadeIn">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 class="text-2xl font-bold text-white mb-1">Pertanyaan Challenge</h2>
              <p class="text-sm text-gray-400">Jawab pertanyaan berdasarkan hasil pengamatan Anda dari video.</p>
            </div>

            <!-- Answered progress counter -->
            <div class="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300 flex items-center gap-2 self-start sm:self-auto">
              <span class="w-2 h-2 rounded-full" :class="totalAnsweredQuestions === questions.length ? 'bg-green-400' : 'bg-primary animate-pulse'"></span>
              <span>Terjawab: <strong class="text-white">{{ totalAnsweredQuestions }}</strong> / {{ questions.length }}</span>
            </div>
          </div>

          <!-- Video Selector to Filter Questions -->
          <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button 
              v-for="(vid, idx) in videos" 
              :key="vid.id"
              @click="currentVideoIndex = idx"
              class="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5"
              :class="[
                currentVideoIndex === idx 
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25' 
                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
              ]"
            >
              <span>Video {{ idx + 1 }}</span>
            </button>
          </div>

          <!-- Video Title Header -->
          <div v-if="activeVideo" class="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
            <div class="min-w-0">
              <span class="text-xs text-pink-400 font-semibold block uppercase">Pertanyaan untuk:</span>
              <p class="text-sm font-bold text-white truncate">{{ activeVideo.title }}</p>
            </div>
            <button 
              @click="goToStep(3)" 
              class="text-xs text-gray-400 hover:text-white flex items-center gap-1 flex-shrink-0"
            >
              <span class="material-icons text-sm">ondemand_video</span>
              <span>Lihat Video</span>
            </button>
          </div>

          <!-- Questions List for Current Video -->
          <div class="space-y-6">
            <div 
              v-for="(q, qIndex) in activeVideoQuestions" 
              :key="q.id"
              class="bg-[#12141A] rounded-2xl border border-white/10 p-6 sm:p-7 space-y-4 transition-all hover:border-white/20"
            >
              <!-- Question Header & Category -->
              <div class="flex items-start justify-between gap-4">
                <div class="space-y-1">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-pink-400 text-xs font-medium">
                    <span class="material-icons text-xs">label</span>
                    {{ q.category }}
                  </span>
                  <p v-if="q.category_description" class="text-xs text-gray-400 italic">
                    {{ q.category_description }}
                  </p>
                </div>
                <span class="text-xs text-gray-500 font-medium whitespace-nowrap">
                  Soal {{ qIndex + 1 }} dari {{ activeVideoQuestions.length }}
                </span>
              </div>

              <!-- Question Text -->
              <h4 class="text-base sm:text-lg font-semibold text-white leading-snug">
                {{ q.question_text }}
              </h4>

              <!-- Answer Input by Type -->
              <!-- 1. Essay Type -->
              <div v-if="q.answer_type === 'essay'" class="space-y-2">
                <textarea 
                  v-model="answers[q.id]"
                  rows="5"
                  placeholder="Ketikkan analisis dan uraian pengamatan Anda di sini..."
                  class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary text-white text-sm outline-none transition-all placeholder:text-gray-600 resize-y"
                ></textarea>
                <div class="flex justify-between items-center text-xs text-gray-500">
                  <span>Berikan penjelasan berbasis pengamatan adegan.</span>
                  <span>{{ (answers[q.id] || '').length }} karakter</span>
                </div>
              </div>

              <!-- 2. Single Choice Type -->
              <div v-else-if="q.answer_type === 'single_choice'" class="space-y-2">
                <label 
                  v-for="(opt, optIdx) in q.options" 
                  :key="optIdx"
                  class="flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer text-sm"
                  :class="[
                    answers[q.id] === opt 
                      ? 'bg-primary/15 border-primary text-white font-medium' 
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  ]"
                >
                  <input 
                    type="radio" 
                    :name="`question_${q.id}`"
                    :value="opt"
                    v-model="answers[q.id]"
                    class="mt-0.5 text-primary focus:ring-primary bg-white/5 border-white/20"
                  />
                  <span>{{ opt }}</span>
                </label>
              </div>

              <!-- 3. Multiple Choice Type -->
              <div v-else-if="q.answer_type === 'multiple_choice'" class="space-y-2">
                <label 
                  v-for="(opt, optIdx) in q.options" 
                  :key="optIdx"
                  class="flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer text-sm"
                  :class="[
                    (answers[q.id] || []).includes(opt) 
                      ? 'bg-primary/15 border-primary text-white font-medium' 
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  ]"
                >
                  <input 
                    type="checkbox" 
                    :value="opt"
                    :checked="(answers[q.id] || []).includes(opt)"
                    @change="(e) => {
                      if (!Array.isArray(answers[q.id])) answers[q.id] = []
                      if (e.target.checked) {
                        answers[q.id].push(opt)
                      } else {
                        answers[q.id] = answers[q.id].filter(x => x !== opt)
                      }
                    }"
                    class="mt-0.5 text-primary focus:ring-primary bg-white/5 border-white/20 rounded"
                  />
                  <span>{{ opt }}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Bottom Navigation -->
          <div class="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10">
            <div class="flex items-center gap-2 w-full sm:w-auto">
              <button 
                @click="goToStep(3)"
                class="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium transition-colors"
              >
                Tonton Video Lagi
              </button>
              
              <button 
                v-if="currentVideoIndex < videos.length - 1"
                @click="currentVideoIndex++; window.scrollTo({ top: 0, behavior: 'smooth' })"
                class="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium transition-colors"
              >
                Pertanyaan Video Selanjutnya →
              </button>
            </div>

            <button 
              @click="goToStep(5)"
              class="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-primary to-[#e94e77] text-white font-bold text-sm shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Lanjut ke Minat Perfilman</span>
              <span class="material-icons text-base">arrow_forward</span>
            </button>
          </div>
        </div>

        <!-- ================================================================= -->
        <!-- STEP 5: MINAT BIDANG PERFILMAN -->
        <!-- ================================================================= -->
        <div v-else-if="currentStep === 5" class="space-y-6 animate-fadeIn">
          <div class="border-b border-white/10 pb-4">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <h2 class="text-2xl font-bold text-white">Minat Bidang Perfilman</h2>
              <span class="px-3 py-1 rounded-full text-xs font-semibold" :class="selectedInterests.length > 0 ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/10 text-gray-400'">
                Terpilih: {{ selectedInterests.length }} / 3
              </span>
            </div>
            <p class="text-sm text-gray-400 mt-1">Pilih maksimal 3 bidang yang paling Anda minati atau kuasai.</p>
          </div>

          <!-- 12 Interests Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            <div 
              v-for="item in AVAILABLE_INTERESTS" 
              :key="item.name"
              @click="toggleInterest(item.name)"
              class="p-4 rounded-xl border transition-all cursor-pointer relative group flex flex-col justify-between"
              :class="[
                selectedInterests.includes(item.name)
                  ? 'bg-gradient-to-br from-primary/20 to-primary/5 border-primary shadow-lg shadow-primary/10'
                  : 'bg-[#12141A] border-white/10 hover:border-white/20 hover:bg-white/5'
              ]"
            >
              <div>
                <div class="flex items-center justify-between mb-2">
                  <div class="w-9 h-9 rounded-lg flex items-center justify-center" :class="selectedInterests.includes(item.name) ? 'bg-primary text-white' : 'bg-white/5 text-gray-400 group-hover:text-white'">
                    <span class="material-icons text-xl">{{ item.icon }}</span>
                  </div>
                  <span 
                    class="material-icons text-lg transition-transform"
                    :class="selectedInterests.includes(item.name) ? 'text-primary scale-110' : 'text-gray-600'"
                  >
                    {{ selectedInterests.includes(item.name) ? 'check_circle' : 'radio_button_unchecked' }}
                  </span>
                </div>
                <h4 class="text-sm font-bold text-white mb-1">{{ item.name }}</h4>
                <p class="text-xs text-gray-400 leading-relaxed">{{ item.desc }}</p>
              </div>
            </div>
          </div>

          <!-- Additional Information Form -->
          <div class="bg-[#12141A] rounded-2xl border border-white/10 p-6 sm:p-8 space-y-5 mt-6">
            <h3 class="text-base font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
              <span class="material-icons text-primary text-lg">badge</span>
              Portofolio & Kemampuan Pendukung
            </h3>

            <!-- Experience / Skills -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1.5">
                Pengalaman atau Kemampuan yang Dimiliki <span class="text-gray-500 font-normal">(Opsional)</span>
              </label>
              <textarea 
                v-model="additionalInfo.experience_skills"
                rows="3"
                placeholder="Contoh: Terbiasa menggunakan Adobe Premiere / CapCut, pernah menyutradarai film pendek sekolah, atau pengalaman akting teater..."
                class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary text-white text-sm outline-none transition-all placeholder:text-gray-600"
              ></textarea>
            </div>

            <!-- Portfolio Link -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1.5">
                Link Portofolio, YouTube, Google Drive, atau Karya <span class="text-gray-500 font-normal">(Opsional)</span>
              </label>
              <input 
                type="url" 
                v-model="additionalInfo.portfolio_url"
                placeholder="https://drive.google.com/... atau https://youtube.com/..."
                class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary text-white text-sm outline-none transition-all placeholder:text-gray-600"
              />
            </div>

            <!-- Motivation -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1.5">
                Alasan Ingin Terlibat dalam Produksi Film <span class="text-gray-500 font-normal">(Opsional)</span>
              </label>
              <textarea 
                v-model="additionalInfo.motivation"
                rows="3"
                placeholder="Ceritakan motivasi dan harapan Anda bergabung dalam ekosistem perfilman Kinarya Coop..."
                class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary text-white text-sm outline-none transition-all placeholder:text-gray-600"
              ></textarea>
            </div>
          </div>

          <!-- Buttons -->
          <div class="flex items-center justify-between pt-4">
            <button 
              @click="goToStep(4)"
              class="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium transition-colors"
            >
              Kembali ke Pertanyaan
            </button>
            <button 
              @click="validateStep5AndNext"
              class="px-7 py-3 rounded-xl bg-gradient-to-r from-primary to-[#e94e77] text-white font-bold text-sm shadow-md hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Review Jawaban</span>
              <span class="material-icons text-base">arrow_forward</span>
            </button>
          </div>
        </div>

        <!-- ================================================================= -->
        <!-- STEP 6: REVIEW & SUBMIT -->
        <!-- ================================================================= -->
        <div v-else-if="currentStep === 6" class="space-y-6 animate-fadeIn">
          <div class="border-b border-white/10 pb-4">
            <h2 class="text-2xl font-bold text-white mb-1">Review & Kirim Jawaban</h2>
            <p class="text-sm text-gray-400">Pastikan seluruh data dan jawaban Anda sudah lengkap sebelum mengirimkan formulir.</p>
          </div>

          <!-- Review Cards -->
          <div class="space-y-4">
            <!-- 1. Participant Review -->
            <div class="bg-[#12141A] rounded-2xl border border-white/10 p-6">
              <div class="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  <span class="material-icons text-primary text-lg">person</span> Identitas Peserta
                </h3>
                <button @click="goToStep(2)" class="text-xs text-primary hover:underline">Edit Data Diri</button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span class="text-gray-500 text-xs block">Nama Lengkap</span>
                  <span class="text-white font-medium">{{ participant.full_name }}</span>
                </div>
                <div>
                  <span class="text-gray-500 text-xs block">Alamat Email</span>
                  <span class="text-white font-medium">{{ participant.email }}</span>
                </div>
                <div>
                  <span class="text-gray-500 text-xs block">WhatsApp</span>
                  <span class="text-white font-medium">{{ participant.whatsapp }}</span>
                </div>
                <div>
                  <span class="text-gray-500 text-xs block">Asal Sekolah / Kampus / Komunitas</span>
                  <span class="text-white font-medium">{{ participant.institution }}</span>
                </div>
                <div>
                  <span class="text-gray-500 text-xs block">Provinsi & Usia</span>
                  <span class="text-white font-medium">{{ participant.province }} ({{ participant.age_range }})</span>
                </div>
                <div v-if="participant.organization_role">
                  <span class="text-gray-500 text-xs block">Peran Organisasi</span>
                  <span class="text-white font-medium">{{ participant.organization_role }}</span>
                </div>
              </div>
            </div>

            <!-- 2. Answers Review -->
            <div class="bg-[#12141A] rounded-2xl border border-white/10 p-6">
              <div class="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  <span class="material-icons text-primary text-lg">fact_check</span> Jawaban Pertanyaan Video
                </h3>
                <button @click="goToStep(4)" class="text-xs text-primary hover:underline">Edit Jawaban</button>
              </div>

              <div class="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <p class="text-sm font-semibold text-white">Status Pengisian Soal</p>
                  <p class="text-xs text-gray-400 mt-0.5">
                    {{ totalAnsweredQuestions }} dari {{ questions.length }} pertanyaan telah Anda jawab.
                  </p>
                </div>
                <span 
                  class="px-3 py-1 rounded-full text-xs font-bold"
                  :class="totalAnsweredQuestions === questions.length ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'"
                >
                  {{ totalAnsweredQuestions === questions.length ? 'Lengkap (100%)' : 'Sebagian Terisi' }}
                </span>
              </div>
            </div>

            <!-- 3. Interests Review -->
            <div class="bg-[#12141A] rounded-2xl border border-white/10 p-6">
              <div class="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  <span class="material-icons text-primary text-lg">star</span> Minat Bidang Terpilih
                </h3>
                <button @click="goToStep(5)" class="text-xs text-primary hover:underline">Edit Minat</button>
              </div>

              <div class="flex flex-wrap gap-2 mb-4">
                <span 
                  v-for="item in selectedInterests" 
                  :key="item"
                  class="px-3.5 py-1.5 rounded-full bg-primary/20 text-pink-300 border border-primary/30 text-xs font-semibold"
                >
                  {{ item }}
                </span>
              </div>

              <div v-if="additionalInfo.portfolio_url" class="text-xs text-gray-400 pt-2 border-t border-white/10 truncate">
                <span class="text-gray-500">Portfolio:</span> {{ additionalInfo.portfolio_url }}
              </div>
            </div>
          </div>

          <!-- Submit Action -->
          <div class="bg-gradient-to-r from-primary/20 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/30 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div>
              <h4 class="text-white font-bold text-base">Siap mengirimkan hasil challenge?</h4>
              <p class="text-xs text-gray-400 mt-0.5">Data Anda akan disimpan dan diverifikasi oleh dewan kurator Kinarya Coop.</p>
            </div>

            <div class="flex items-center gap-3 w-full sm:w-auto">
              <button 
                @click="goToStep(5)"
                class="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium transition-colors"
                :disabled="submitting"
              >
                Kembali
              </button>
              <button 
                @click="handleSubmit"
                :disabled="submitting"
                class="flex-1 sm:flex-none px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary to-[#e94e77] text-white font-bold text-sm shadow-xl shadow-primary/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <div v-if="submitting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span v-else class="material-icons text-base">send</span>
                <span>{{ submitting ? 'MENGIRIM JAWABAN...' : 'KIRIM JAWABAN CHALLENGE' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ================================================================= -->
        <!-- STEP 7: SUCCESS PAGE -->
        <!-- ================================================================= -->
        <div v-else-if="currentStep === 7 && submissionResult" class="py-8 animate-fadeIn text-center space-y-6">
          <div class="w-20 h-20 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto border border-green-500/30 shadow-lg shadow-green-500/10">
            <span class="material-icons text-4xl">check_circle</span>
          </div>

          <div>
            <span class="px-3 py-1 rounded-full bg-white/5 text-pink-400 text-xs font-semibold uppercase tracking-wider">
              Pendaftaran & Challenge Diterima
            </span>
            <h2 class="text-3xl sm:text-4xl font-display font-extrabold text-white mt-2 mb-2">
              Terima Kasih, {{ submissionResult.full_name }}!
            </h2>
            <p class="text-gray-400 max-w-lg mx-auto text-sm">
              Jawaban dan pendaftaran minat Anda untuk <strong>{{ challenge?.title || 'National Youth Film Crew & Talent Challenge' }}</strong> telah berhasil tersimpan dalam sistem kami.
            </p>
          </div>

          <!-- Registration Card -->
          <div class="max-w-md mx-auto bg-[#12141A] rounded-2xl border border-white/10 p-6 shadow-xl space-y-3">
            <span class="text-xs text-gray-500 uppercase tracking-widest block font-medium">Nomor Registrasi Unik</span>
            <div class="flex items-center justify-center gap-2 bg-white/5 py-3 px-4 rounded-xl border border-white/10">
              <span class="text-xl sm:text-2xl font-mono font-bold text-primary tracking-wider">
                {{ submissionResult.registration_number }}
              </span>
              <button 
                @click="copyRegNumber"
                class="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title="Salin Nomor Registrasi"
              >
                <span class="material-icons text-base">{{ copySuccess ? 'done' : 'content_copy' }}</span>
              </button>
            </div>
            <p v-if="copySuccess" class="text-xs text-green-400">Nomor registrasi berhasil disalin!</p>
            <p class="text-xs text-gray-500">
              Simpan nomor registrasi ini sebagai bukti keikutsertaan Anda dalam program challenge.
            </p>
          </div>

          <!-- Next Steps Info -->
          <div class="max-w-md mx-auto p-4 rounded-xl bg-white/5 border border-white/10 text-left text-xs text-gray-300 space-y-2">
            <h4 class="font-bold text-white flex items-center gap-1.5">
              <span class="material-icons text-sm text-primary">schedule</span> Tahapan Selanjutnya:
            </h4>
            <ol class="list-decimal list-inside space-y-1 text-gray-400">
              <li>Tim kurator akan menilai analisis audio-visual dan portofolio Anda.</li>
              <li>Peserta dengan potensi terbaik akan dihubungi melalui WhatsApp atau Email resmi.</li>
              <li>Informasi dan pengumuman terpilih akan diumumkan secara berkala melalui platform Yukflix & Kinarya Coop.</li>
            </ol>
          </div>

          <!-- Home Button -->
          <div class="pt-4">
            <router-link 
              to="/" 
              class="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm transition-all"
            >
              <span class="material-icons text-base">home</span>
              <span>Kembali ke Beranda Yukflix</span>
            </router-link>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="w-full border-t border-white/10 py-6 text-center text-xs text-gray-500 mt-auto">
      <div class="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>© 2026 Kinarya Coop & YukFlix. All rights reserved.</span>
        <span>{{ challenge?.title || 'National Youth Film Crew & Talent Challenge' }}</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}

.animate-shake {
  animation: shake 0.4s ease-in-out forwards;
}
</style>
