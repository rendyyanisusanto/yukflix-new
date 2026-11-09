import apiClient from './apiClient'

export const challengeService = {
    // Public endpoints
    async getPublicChallenge(slug = 'national-youth-film-crew') {
        const { data, error } = await apiClient.get(`/challenges/public/${slug}`)
        return { data, error }
    },

    async submitChallenge(slug, payload) {
        const { data, error } = await apiClient.post(`/challenges/public/${slug}/submit`, payload)
        return { data, error }
    },

    // Admin endpoints
    async getAdminChallenges() {
        const { data, error } = await apiClient.get('/challenges')
        return { data, error }
    },

    async getAdminChallengeDetail(id) {
        const { data, error } = await apiClient.get(`/challenges/${id}`)
        return { data, error }
    },

    async updateAdminChallenge(id, payload) {
        const { data, error } = await apiClient.put(`/challenges/${id}`, payload)
        return { data, error }
    },

    // Video management
    async addVideo(challengeId, payload) {
        const { data, error } = await apiClient.post(`/challenges/${challengeId}/videos`, payload)
        return { data, error }
    },

    async updateVideo(videoId, payload) {
        const { data, error } = await apiClient.put(`/challenges/videos/${videoId}`, payload)
        return { data, error }
    },

    async deleteVideo(videoId) {
        const { data, error } = await apiClient.delete(`/challenges/videos/${videoId}`)
        return { data, error }
    },

    // Question management
    async addQuestion(videoId, payload) {
        const { data, error } = await apiClient.post(`/challenges/videos/${videoId}/questions`, payload)
        return { data, error }
    },

    async updateQuestion(questionId, payload) {
        const { data, error } = await apiClient.put(`/challenges/questions/${questionId}`, payload)
        return { data, error }
    },

    async deleteQuestion(questionId) {
        const { data, error } = await apiClient.delete(`/challenges/questions/${questionId}`)
        return { data, error }
    },

    // Submissions
    async getSubmissions(challengeId, params = {}) {
        const query = new URLSearchParams()
        if (params.page) query.append('page', params.page)
        if (params.limit) query.append('limit', params.limit)
        if (params.search) query.append('search', params.search)
        if (params.province) query.append('province', params.province)
        if (params.status) query.append('status', params.status)
        if (params.start_date) query.append('start_date', params.start_date)
        if (params.end_date) query.append('end_date', params.end_date)

        const qs = query.toString() ? `?${query.toString()}` : ''
        const { data, error } = await apiClient.get(`/challenges/${challengeId}/submissions${qs}`)
        return { data, error }
    },

    async getSubmissionDetail(submissionId) {
        const { data, error } = await apiClient.get(`/challenges/submissions/${submissionId}`)
        return { data, error }
    },

    async reviewSubmission(submissionId, reviewData) {
        const { data, error } = await apiClient.put(`/challenges/submissions/${submissionId}/review`, reviewData)
        return { data, error }
    },

    async getStats(challengeId) {
        const { data, error } = await apiClient.get(`/challenges/${challengeId}/stats`)
        return { data, error }
    },

    getExportCsvUrl(challengeId) {
        const baseUrl = import.meta.env.VITE_API_URL || '/api'
        return `${baseUrl}/challenges/${challengeId}/submissions/export`
    }
}

export default challengeService

