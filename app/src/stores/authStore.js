import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '../services/apiClient'

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null)
    const session = ref(null)
    const loading = ref(false)

    async function login(email, password) {
        loading.value = true
        try {
            const { data, error } = await apiClient.post('/auth/login', { email, password })
            if (error) throw error

            user.value = data.user
            session.value = {
                user: data.user,
                token: data.token
            }
            apiClient.setToken(data.token)
            return { success: true }
        } catch (error) {
            return { success: false, error: error.message || 'Login gagal' }
        } finally {
            loading.value = false
        }
    }

    async function logout() {
        loading.value = true
        try {
            await apiClient.post('/auth/logout')
            apiClient.clearToken()
            user.value = null
            session.value = null
            return { success: true }
        } catch (error) {
            apiClient.clearToken()
            user.value = null
            session.value = null
            return { success: true }
        } finally {
            loading.value = false
        }
    }

    async function checkAuth() {
        const token = apiClient.getToken()
        if (!token) {
            user.value = null
            session.value = null
            return
        }

        loading.value = true
        try {
            const { data, error } = await apiClient.get('/auth/me')
            if (error) {
                apiClient.clearToken()
                user.value = null
                session.value = null
            } else if (data?.user) {
                user.value = data.user
                session.value = { user: data.user, token }
            }
        } catch (error) {
            console.error('Auth check failed:', error)
            apiClient.clearToken()
            user.value = null
            session.value = null
        } finally {
            loading.value = false
        }
    }

    function initAuthListener() {
        // Listen for storage events across tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'yukflix_auth_token' && !e.newValue) {
                user.value = null
                session.value = null
            }
        })
    }

    const isAuthenticated = () => !!user.value
    const isAdmin = () => isAuthenticated()

    return {
        user,
        session,
        loading,
        login,
        logout,
        checkAuth,
        initAuthListener,
        isAuthenticated,
        isAdmin
    }
})
