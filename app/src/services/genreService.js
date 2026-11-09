import apiClient from './apiClient'

export const genreService = {
    async getAll() {
        const { data, error } = await apiClient.get('/genres')
        return { data, error }
    },

    async getById(id) {
        const { data, error } = await apiClient.get(`/genres/${id}`)
        return { data, error }
    },

    async create(genre) {
        const { data, error } = await apiClient.post('/genres', genre)
        return { data, error }
    },

    async update(id, genre) {
        const { data, error } = await apiClient.put(`/genres/${id}`, genre)
        return { data, error }
    },

    async delete(id) {
        const { error } = await apiClient.delete(`/genres/${id}`)
        return { error }
    }
}

export default genreService
