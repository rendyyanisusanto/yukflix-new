import supabase from './supabase'

export const genreService = {
    async getAll() {
        const { data, error } = await supabase
            .from('genres')
            .select('*')
            .order('name')

        return { data, error }
    },

    async getById(id) {
        const { data, error } = await supabase
            .from('genres')
            .select('*')
            .eq('id', id)
            .single()

        return { data, error }
    },

    async create(genre) {
        const { data, error } = await supabase
            .from('genres')
            .insert([genre])
            .select()
            .single()

        return { data, error }
    },

    async update(id, genre) {
        const { data, error } = await supabase
            .from('genres')
            .update(genre)
            .eq('id', id)
            .select()
            .single()

        return { data, error }
    },

    async delete(id) {
        const { error } = await supabase
            .from('genres')
            .delete()
            .eq('id', id)

        return { error }
    }
}
