import { createClient } from '@supabase/supabase-js'
import mysql from 'mysql2/promise'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsRoot = path.resolve(__dirname, '../../uploads')

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://elpmhrvcuhoclreeapqg.supabase.co'
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_6fnElM6UHw6p7DLaxWbrwg_GQtce8R-'

const DB_HOST = process.env.DB_HOST || '127.0.0.1'
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10)
const DB_USER = process.env.DB_USER || 'root'
const DB_PASSWORD = process.env.DB_PASSWORD || ''
const DB_NAME = process.env.DB_NAME || 'kinarya-yukflix'
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000'

// Ensure local upload directories exist
for (const sub of ['posters', 'backdrops', 'bts', 'media']) {
    const dir = path.join(uploadsRoot, sub)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
}

async function downloadFileLocally(remoteUrl, defaultFolder = 'media') {
    if (!remoteUrl || !remoteUrl.startsWith('http')) return remoteUrl

    try {
        const urlObj = new URL(remoteUrl)
        const parts = urlObj.pathname.split('/')
        const filename = parts.pop()

        // Determine folder (e.g. posters, backdrops, bts)
        let folder = defaultFolder
        for (const f of ['posters', 'backdrops', 'bts']) {
            if (urlObj.pathname.includes(`/${f}/`)) {
                folder = f
                break
            }
        }

        const targetPath = path.join(uploadsRoot, folder, filename)

        // Only download if doesn't exist yet
        if (!fs.existsSync(targetPath)) {
            console.log(`[Download] Downloading: ${folder}/${filename}...`)
            const res = await fetch(remoteUrl)
            if (!res.ok) {
                console.warn(`[Download] Failed to download (${res.status}): ${remoteUrl}`)
                return remoteUrl
            }
            const buffer = await res.arrayBuffer()
            fs.writeFileSync(targetPath, Buffer.from(buffer))
        }

        return `/uploads/${folder}/${filename}`
    } catch (err) {
        console.warn(`[Download] Error downloading ${remoteUrl}:`, err.message)
        return remoteUrl
    }
}

async function migrate() {
    console.log('========================================================')
    console.log('🚀 Starting Data Migration: Supabase -> MySQL (kinarya-yukflix)')
    console.log('========================================================')

    console.log(`[Supabase] Connecting to ${SUPABASE_URL}...`)
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    console.log(`[MySQL] Connecting to ${DB_HOST}:${DB_PORT}/${DB_NAME}...`)
    const conn = await mysql.createConnection({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME
    })

    try {
        await conn.query('SET FOREIGN_KEY_CHECKS = 0')

        // 1. Genres
        console.log('\n[1/6] Migrating Genres...')
        const { data: genres, error: gErr } = await supabase.from('genres').select('*')
        if (gErr) throw gErr

        for (const g of (genres || [])) {
            await conn.query('DELETE FROM `genres` WHERE `slug` = ? OR `name` = ? OR `id` = ?', [g.slug, g.name, g.id])
            await conn.query(`
                INSERT INTO \`genres\` (\`id\`, \`name\`, \`slug\`, \`created_at\`)
                VALUES (?, ?, ?, ?)
            `, [g.id, g.name, g.slug, g.created_at ? new Date(g.created_at) : new Date()])
        }
        console.log(`✅ Migrated ${genres?.length || 0} genres.`)

        // 2. Films & Assets
        console.log('\n[2/6] Migrating Films & Downloading media assets...')
        const { data: films, error: fErr } = await supabase.from('films').select('*')
        if (fErr) throw fErr

        for (const film of (films || [])) {
            console.log(`Processing film: "${film.title}"`)
            const localPoster = await downloadFileLocally(film.poster_url, 'posters')
            const localBackdrop = await downloadFileLocally(film.backdrop_url, 'backdrops')

            await conn.query(`
                INSERT INTO \`films\` (
                    \`id\`, \`title\`, \`slug\`, \`description\`, \`duration_minutes\`,
                    \`release_date\`, \`poster_url\`, \`backdrop_url\`, \`embed_url\`,
                    \`trailers_url\`, \`is_featured\`, \`is_coming_soon\`, \`created_at\`, \`updated_at\`
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    \`title\` = VALUES(\`title\`),
                    \`slug\` = VALUES(\`slug\`),
                    \`description\` = VALUES(\`description\`),
                    \`duration_minutes\` = VALUES(\`duration_minutes\`),
                    \`release_date\` = VALUES(\`release_date\`),
                    \`poster_url\` = VALUES(\`poster_url\`),
                    \`backdrop_url\` = VALUES(\`backdrop_url\`),
                    \`embed_url\` = VALUES(\`embed_url\`),
                    \`trailers_url\` = VALUES(\`trailers_url\`),
                    \`is_featured\` = VALUES(\`is_featured\`),
                    \`is_coming_soon\` = VALUES(\`is_coming_soon\`),
                    \`updated_at\` = VALUES(\`updated_at\`)
            `, [
                film.id,
                film.title,
                film.slug,
                film.description || null,
                film.duration_minutes || null,
                film.release_date || null,
                localPoster || null,
                localBackdrop || null,
                film.embed_url || null,
                film.trailers_url || null,
                film.is_featured ? 1 : 0,
                film.is_coming_soon ? 1 : 0,
                film.created_at ? new Date(film.created_at) : new Date(),
                film.updated_at ? new Date(film.updated_at) : new Date()
            ])
        }
        console.log(`✅ Migrated ${films?.length || 0} films.`)

        // 3. Film-Genres Junction
        console.log('\n[3/6] Migrating Film Genres Junction...')
        const { data: filmGenres, error: fgErr } = await supabase.from('film_genres').select('*')
        if (fgErr) throw fgErr

        for (const fg of (filmGenres || [])) {
            await conn.query(`
                INSERT INTO \`film_genres\` (\`id\`, \`film_id\`, \`genre_id\`)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE \`film_id\` = VALUES(\`film_id\`), \`genre_id\` = VALUES(\`genre_id\`)
            `, [fg.id, fg.film_id, fg.genre_id])
        }
        console.log(`✅ Migrated ${filmGenres?.length || 0} film-genre links.`)

        // 4. Behind The Scenes
        console.log('\n[4/6] Migrating Behind The Scenes & thumbnails...')
        const { data: btsList, error: btsErr } = await supabase.from('behind_the_scenes').select('*')
        if (btsErr) throw btsErr

        for (const bts of (btsList || [])) {
            const localThumb = await downloadFileLocally(bts.thumbnail_url, 'bts')
            await conn.query(`
                INSERT INTO \`behind_the_scenes\` (\`id\`, \`film_id\`, \`title\`, \`thumbnail_url\`, \`media_type\`, \`created_at\`)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    \`film_id\` = VALUES(\`film_id\`),
                    \`title\` = VALUES(\`title\`),
                    \`thumbnail_url\` = VALUES(\`thumbnail_url\`),
                    \`media_type\` = VALUES(\`media_type\`)
            `, [
                bts.id,
                bts.film_id,
                bts.title || null,
                localThumb || null,
                bts.media_type || 'photo',
                bts.created_at ? new Date(bts.created_at) : new Date()
            ])
        }
        console.log(`✅ Migrated ${btsList?.length || 0} behind the scenes items.`)

        // 5. FAQs & Answers
        console.log('\n[5/6] Migrating FAQs & Answers...')
        const { data: faqs, error: faqErr } = await supabase.from('faqs').select('*')
        if (faqErr) throw faqErr

        for (const faq of (faqs || [])) {
            await conn.query(`
                INSERT INTO \`faqs\` (\`id\`, \`question\`, \`sort_order\`, \`is_active\`, \`created_at\`)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    \`question\` = VALUES(\`question\`),
                    \`sort_order\` = VALUES(\`sort_order\`),
                    \`is_active\` = VALUES(\`is_active\`)
            `, [
                faq.id,
                faq.question,
                faq.sort_order || 0,
                faq.is_active ? 1 : 0,
                faq.created_at ? new Date(faq.created_at) : new Date()
            ])
        }

        const { data: answers, error: ansErr } = await supabase.from('faq_answers').select('*')
        if (ansErr) throw ansErr

        for (const ans of (answers || [])) {
            await conn.query(`
                INSERT INTO \`faq_answers\` (\`id\`, \`faq_id\`, \`answer\`, \`sort_order\`, \`created_at\`)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    \`faq_id\` = VALUES(\`faq_id\`),
                    \`answer\` = VALUES(\`answer\`),
                    \`sort_order\` = VALUES(\`sort_order\`)
            `, [
                ans.id,
                ans.faq_id,
                ans.answer,
                ans.sort_order || 0,
                ans.created_at ? new Date(ans.created_at) : new Date()
            ])
        }
        console.log(`✅ Migrated ${faqs?.length || 0} FAQs and ${answers?.length || 0} answers.`)

        // 6. Settings & Themes
        console.log('\n[6/6] Migrating Site Settings & Themes...')
        const { data: settings, error: sErr } = await supabase.from('site_settings').select('*')
        if (!sErr && settings) {
            for (const s of settings) {
                if (s.value) { // Only update if value is not empty
                    await conn.query(`
                        INSERT INTO \`site_settings\` (\`key\`, \`value\`, \`updated_at\`)
                        VALUES (?, ?, ?)
                        ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`)
                    `, [s.key, s.value, s.updated_at ? new Date(s.updated_at) : new Date()])
                }
            }
        }

        const { data: themes, error: tErr } = await supabase.from('themes').select('*')
        if (!tErr && themes && themes.length > 0) {
            for (const t of themes) {
                await conn.query(`
                    INSERT INTO \`themes\` (\`id\`, \`name\`, \`primary_color\`, \`secondary_color\`, \`background_color\`, \`text_color\`, \`is_active\`)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        \`name\` = VALUES(\`name\`),
                        \`primary_color\` = VALUES(\`primary_color\`),
                        \`secondary_color\` = VALUES(\`secondary_color\`),
                        \`background_color\` = VALUES(\`background_color\`),
                        \`text_color\` = VALUES(\`text_color\`),
                        \`is_active\` = VALUES(\`is_active\`)
                `, [t.id, t.name, t.primary_color, t.secondary_color, t.background_color, t.text_color, t.is_active ? 1 : 0])
            }
        }
        console.log(`✅ Migrated settings and themes.`)

        await conn.query('SET FOREIGN_KEY_CHECKS = 1')
        console.log('\n========================================================')
        console.log('🎉 Migration finished successfully!')
        console.log('========================================================')
    } catch (err) {
        console.error('❌ Migration failed with error:', err)
        throw err
    } finally {
        await conn.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {})
        await conn.end()
    }
}

migrate()
