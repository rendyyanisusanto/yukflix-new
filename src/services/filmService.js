import supabase, { storage } from './supabase'

export const filmService = {
    async getAll() {
        const { data, error } = await supabase
            .from('films')
            .select(`
        *,
        film_genres(
          genres(id, name)
        )
      `)
            .order('created_at', { ascending: false })

        return { data, error }
    },

    async getById(id) {
        const { data, error } = await supabase
            .from('films')
            .select(`
        *,
        film_genres(
          genre_id,
          genres(id, name)
        ),
        behind_the_scenes(*)
      `)
            .eq('id', id)
            .single()

        return { data, error }
    },

    async create(film) {
        const { data, error } = await supabase
            .from('films')
            .insert([film])
            .select()
            .single()

        return { data, error }
    },

    async update(id, film) {
        const { data, error } = await supabase
            .from('films')
            .update(film)
            .eq('id', id)
            .select()
            .single()

        return { data, error }
    },

    async delete(id) {
        const { error } = await supabase
            .from('films')
            .delete()
            .eq('id', id)

        return { error }
    },

    async setGenres(filmId, genreIds) {
        // Delete existing genre associations
        await supabase
            .from('film_genres')
            .delete()
            .eq('film_id', filmId)

        // Insert new associations
        if (genreIds && genreIds.length > 0) {
            const associations = genreIds.map(genreId => ({
                film_id: filmId,
                genre_id: genreId
            }))

            const { error } = await supabase
                .from('film_genres')
                .insert(associations)

            return { error }
        }

        return { error: null }
    },

    async uploadImage(file, bucket) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`

        const { data, error } = await storage.uploadFile(bucket, fileName, file)

        if (error) return { data: null, error }

        const publicUrl = storage.getPublicUrl(bucket, fileName)
        return { data: { path: fileName, url: publicUrl }, error: null }
    },

    async uploadPoster(file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `posters/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`

        const { data, error } = await storage.uploadFile('media', fileName, file)

        if (error) return { data: null, error }

        const publicUrl = storage.getPublicUrl('media', fileName)
        return { data: { path: fileName, url: publicUrl }, error: null }
    },

    async uploadBackdrop(file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `backdrops/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`

        const { data, error } = await storage.uploadFile('media', fileName, file)

        if (error) return { data: null, error }

        const publicUrl = storage.getPublicUrl('media', fileName)
        return { data: { path: fileName, url: publicUrl }, error: null }
    },

    // Behind The Scenes
    async addBTS(bts) {
        const { data, error } = await supabase
            .from('behind_the_scenes')
            .insert([bts])
            .select()
            .single()

        return { data, error }
    },

    async deleteBTS(id) {
        const { error } = await supabase
            .from('behind_the_scenes')
            .delete()
            .eq('id', id)

        return { error }
    },

    async uploadBTSThumbnail(file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `bts/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`

        const { data, error } = await storage.uploadFile('media', fileName, file)

        if (error) return { data: null, error }

        const publicUrl = storage.getPublicUrl('media', fileName)
        return { data: { path: fileName, url: publicUrl }, error: null }
    }
}
