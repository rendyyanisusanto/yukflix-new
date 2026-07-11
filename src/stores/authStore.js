import { defineStore } from 'pinia'
import { ref } from 'vue'
import { auth } from '../services/supabase'

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null)
    const session = ref(null)
    const loading = ref(false)

    async function login(email, password) {
        loading.value = true
        try {
            const { data, error } = await auth.signIn(email, password)
            if (error) throw error

            user.value = data.user
            session.value = data.session
            return { success: true }
        } catch (error) {
            return { success: false, error: error.message }
        } finally {
            loading.value = false
        }
    }

    async function logout() {
        loading.value = true
        try {
            const { error } = await auth.signOut()
            if (error) throw error

            user.value = null
            session.value = null
            return { success: true }
        } catch (error) {
            return { success: false, error: error.message }
        } finally {
            loading.value = false
        }
    }

    async function checkAuth() {
        loading.value = true
        try {
            const currentSession = await auth.getSession()
            if (currentSession) {
                session.value = currentSession
                user.value = currentSession.user
            }
        } catch (error) {
            console.error('Auth check failed:', error)
        } finally {
            loading.value = false
        }
    }

    function initAuthListener() {
        auth.onAuthStateChange((event, currentSession) => {
            session.value = currentSession
            user.value = currentSession?.user || null
        })
    }

    const isAuthenticated = () => !!user.value
    const isAdmin = () => {
        // You can add role checking here if you have user roles
        return isAuthenticated()
    }

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
