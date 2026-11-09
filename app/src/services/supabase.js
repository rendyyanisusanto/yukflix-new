import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions
export const auth = {
    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        return { data, error }
    },

    async signOut() {
        const { error } = await supabase.auth.signOut()
        return { error }
    },

    async getSession() {
        const { data: { session } } = await supabase.auth.getSession()
        return session
    },

    async getUser() {
        const { data: { user } } = await supabase.auth.getUser()
        return user
    },

    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange(callback)
    }
}

// Storage helpers
export const storage = {
    async uploadFile(bucket, path, file) {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false
            })
        return { data, error }
    },

    async deleteFile(bucket, path) {
        const { data, error } = await supabase.storage
            .from(bucket)
            .remove([path])
        return { data, error }
    },

    getPublicUrl(bucket, path) {
        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(path)
        return data.publicUrl
    }
}

export default supabase
