import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/authStore'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize auth store and check session
const authStore = useAuthStore()
authStore.initAuthListener()
authStore.checkAuth()

// Set dark mode by default (as per PRD)
if (typeof window !== 'undefined') {
    document.documentElement.classList.add('dark')
}

app.mount('#app')
