import apiClient from './apiClient'

export const settingsService = {
    async getAll() {
        const { data, error } = await apiClient.get('/settings')
        return { data, error }
    },

    async updateAll(settings) {
        const { data, error } = await apiClient.put('/settings', settings)
        return { data, error }
    }
}

export default settingsService

