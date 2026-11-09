import apiClient from './apiClient'

export const themeService = {
    async getAll() {
        const { data, error } = await apiClient.get('/themes')
        return { data, error }
    },

    async create(theme) {
        const { data, error } = await apiClient.post('/themes', theme)
        return { data, error }
    },

    async update(id, theme) {
        const { data, error } = await apiClient.put(`/themes/${id}`, theme)
        return { data, error }
    },

    async setActive(id) {
        const { data, error } = await apiClient.post(`/themes/${id}/activate`)
        return { data, error }
    },

    async delete(id) {
        const { error } = await apiClient.delete(`/themes/${id}`)
        return { error }
    }
}

export default themeService

