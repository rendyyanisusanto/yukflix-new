import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '../services/apiClient'

export const useFilmStore = defineStore('film', () => {
    const films = ref([])
    const featuredFilms = ref([])
    const activeFeaturedFilm = ref(null)
    const comingSoonFilms = ref([])
    const loading = ref(false)
    const error = ref(null)

    async function fetchFeaturedFilms() {
        loading.value = true
        error.value = null
        try {
            const { data, error: err } = await apiClient.get('/films?featured=true')
            if (err) throw err
            featuredFilms.value = data || []
        } catch (err) {
            error.value = err.message
            console.error('Error fetching featured films:', err)
        } finally {
            loading.value = false
        }
    }

    async function fetchComingSoonFilms() {
        loading.value = true
        error.value = null
        try {
            const { data, error: err } = await apiClient.get('/films?coming_soon=true')
            if (err) throw err
            comingSoonFilms.value = data || []
        } catch (err) {
            error.value = err.message
            console.error('Error fetching coming soon films:', err)
        } finally {
            loading.value = false
        }
    }

    async function fetchAllFilms() {
        loading.value = true
        error.value = null
        try {
            const { data, error: err } = await apiClient.get('/films')
            if (err) throw err
            films.value = data || []
        } catch (err) {
            error.value = err.message
            console.error('Error fetching all films:', err)
        } finally {
            loading.value = false
        }
    }

    return {
        films,
        featuredFilms,
        activeFeaturedFilm,
        comingSoonFilms,
        loading,
        error,
        fetchFeaturedFilms,
        fetchComingSoonFilms,
        fetchAllFilms
    }
})
