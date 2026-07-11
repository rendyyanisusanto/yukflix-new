import supabase from './supabase'

export const faqService = {
    async getAll() {
        const { data, error } = await supabase
            .from('faqs')
            .select(`
        *,
        faq_answers (
          id,
          answer,
          sort_order
        )
      `)
            .order('sort_order')

        return { data, error }
    },

    async getById(id) {
        const { data, error } = await supabase
            .from('faqs')
            .select(`
        *,
        faq_answers (
          id,
          answer,
          sort_order
        )
      `)
            .eq('id', id)
            .single()

        return { data, error }
    },

    async create(faq) {
        const { data, error } = await supabase
            .from('faqs')
            .insert([{
                question: faq.question,
                sort_order: faq.sort_order,
                is_active: faq.is_active
            }])
            .select()
            .single()

        return { data, error }
    },

    async update(id, faq) {
        const { data, error } = await supabase
            .from('faqs')
            .update({
                question: faq.question,
                sort_order: faq.sort_order,
                is_active: faq.is_active
            })
            .eq('id', id)
            .select()
            .single()

        return { data, error }
    },

    async delete(id) {
        const { error } = await supabase
            .from('faqs')
            .delete()
            .eq('id', id)

        return { error }
    },

    async addAnswer(faqId, answer, sortOrder = 0) {
        const { data, error } = await supabase
            .from('faq_answers')
            .insert([{
                faq_id: faqId,
                answer: answer,
                sort_order: sortOrder
            }])
            .select()
            .single()

        return { data, error }
    },

    async updateAnswer(answerId, answer) {
        const { data, error } = await supabase
            .from('faq_answers')
            .update({ answer })
            .eq('id', answerId)
            .select()
            .single()

        return { data, error }
    },

    async deleteAnswer(answerId) {
        const { error } = await supabase
            .from('faq_answers')
            .delete()
            .eq('id', answerId)

        return { error }
    }
}
