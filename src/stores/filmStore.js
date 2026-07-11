import { defineStore } from 'pinia'
import { ref } from 'vue'
import supabase from '../services/supabase'

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
            const { data, error: err } = await supabase
                .from('films')
                .select(`
          *,
          film_genres(
            genres(id, name)
          ),
          behind_the_scenes(*)
        `)
                .eq('is_featured', true)
                .order('created_at', { ascending: false })

            if (err) throw err
            featuredFilms.value = data
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
            const { data, error: err } = await supabase
                .from('films')
                .select(`
          *,
          film_genres(
            genres(id, name)
          )
        `)
                .eq('is_coming_soon', true)
                .order('created_at', { ascending: false })

            if (err) throw err
            comingSoonFilms.value = data
        } catch (err) {
            error.value = err.message
            console.error('Error fetching coming soon films:', err)
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
        fetchComingSoonFilms
    }
})
