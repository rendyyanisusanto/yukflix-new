import apiClient from './apiClient'

export const faqService = {
    async getAll() {
        const { data, error } = await apiClient.get('/faqs')
        return { data, error }
    },

    async getById(id) {
        const { data, error } = await apiClient.get(`/faqs/${id}`)
        return { data, error }
    },

    async create(faq) {
        const { data, error } = await apiClient.post('/faqs', {
            question: faq.question,
            sort_order: faq.sort_order,
            is_active: faq.is_active,
            answers: faq.answers
        })
        return { data, error }
    },

    async update(id, faq) {
        const { data, error } = await apiClient.put(`/faqs/${id}`, {
            question: faq.question,
            sort_order: faq.sort_order,
            is_active: faq.is_active,
            answers: faq.answers
        })
        return { data, error }
    },

    async delete(id) {
        const { error } = await apiClient.delete(`/faqs/${id}`)
        return { error }
    },

    async addAnswer(faqId, answer, sortOrder = 0) {
        const { data, error } = await apiClient.post('/faqs/answers', {
            faq_id: faqId,
            answer: answer,
            sort_order: sortOrder
        })
        return { data, error }
    },

    async updateAnswer(answerId, answer) {
        const { data, error } = await apiClient.put(`/faqs/answers/${answerId}`, {
            answer
        })
        return { data, error }
    },

    async deleteAnswer(answerId) {
        const { error } = await apiClient.delete(`/faqs/answers/${answerId}`)
        return { error }
    }
}

export default faqService
