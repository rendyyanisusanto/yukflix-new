import apiClient from './apiClient'

export const filmService = {
    async getAll() {
        const { data, error } = await apiClient.get('/films')
        return { data, error }
    },

    async getById(id) {
        const { data, error } = await apiClient.get(`/films/${id}`)
        return { data, error }
    },

    async getBySlug(slug) {
        const { data, error } = await apiClient.get(`/films/slug/${slug}`)
        return { data, error }
    },

    async create(film) {
        const { data, error } = await apiClient.post('/films', film)
        return { data, error }
    },

    async update(id, film) {
        const { data, error } = await apiClient.put(`/films/${id}`, film)
        return { data, error }
    },

    async delete(id) {
        const { error } = await apiClient.delete(`/films/${id}`)
        return { error }
    },

    async setGenres(filmId, genreIds) {
        const { error } = await apiClient.put(`/films/${filmId}`, {
            selected_genres: genreIds
        })
        return { error }
    },

    async uploadImage(file, bucket = 'media') {
        const { data, error } = await apiClient.upload(file, bucket)
        if (error) return { data: null, error }
        return { data: { path: data.path, url: data.url }, error: null }
    },

    async uploadPoster(file) {
        const { data, error } = await apiClient.upload(file, 'posters')
        if (error) return { data: null, error }
        return { data: { path: data.path, url: data.url }, error: null }
    },

    async uploadBackdrop(file) {
        const { data, error } = await apiClient.upload(file, 'backdrops')
        if (error) return { data: null, error }
        return { data: { path: data.path, url: data.url }, error: null }
    },

    // Behind The Scenes
    async addBTS(bts) {
        const { data, error } = await apiClient.post('/films/bts', bts)
        return { data, error }
    },

    async deleteBTS(id) {
        const { error } = await apiClient.delete(`/films/bts/${id}`)
        return { error }
    },

    async uploadBTSThumbnail(file) {
        const { data, error } = await apiClient.upload(file, 'bts')
        if (error) return { data: null, error }
        return { data: { path: data.path, url: data.url }, error: null }
    }
}

export default filmService
