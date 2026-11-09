import crypto from 'crypto'
import pool from '../config/db.js'

// Helper to attach genres and BTS to films
async function attachRelations(films) {
    if (!films || films.length === 0) return []

    const filmIds = films.map(f => f.id)
    const placeholders = filmIds.map(() => '?').join(',')

    // Fetch genres for these films
    const [fgRows] = await pool.query(`
        SELECT fg.film_id, fg.genre_id, g.id as g_id, g.name as g_name, g.slug as g_slug
        FROM film_genres fg
        JOIN genres g ON fg.genre_id = g.id
        WHERE fg.film_id IN (${placeholders})
    `, filmIds)

    // Fetch BTS for these films
    const [btsRows] = await pool.query(`
        SELECT * FROM behind_the_scenes
        WHERE film_id IN (${placeholders})
        ORDER BY created_at DESC
    `, filmIds)

    // Map by film_id
    const genresMap = {}
    for (const row of fgRows) {
        if (!genresMap[row.film_id]) genresMap[row.film_id] = []
        genresMap[row.film_id].push({
            genre_id: row.genre_id,
            genres: {
                id: row.g_id,
                name: row.g_name,
                slug: row.g_slug
            }
        })
    }

    const btsMap = {}
    for (const row of btsRows) {
        if (!btsMap[row.film_id]) btsMap[row.film_id] = []
        btsMap[row.film_id].push(row)
    }

    return films.map(film => ({
        ...film,
        is_featured: Boolean(film.is_featured),
        is_coming_soon: Boolean(film.is_coming_soon),
        film_genres: genresMap[film.id] || [],
        behind_the_scenes: btsMap[film.id] || []
    }))
}

export async function getAll(req, res) {
    try {
        const { featured, coming_soon, limit } = req.query
        let query = 'SELECT * FROM `films` WHERE 1=1'
        const params = []

        if (featured !== undefined) {
            query += ' AND `is_featured` = ?'
            params.push(featured === 'true' || featured === '1' ? 1 : 0)
        }

        if (coming_soon !== undefined) {
            query += ' AND `is_coming_soon` = ?'
            params.push(coming_soon === 'true' || coming_soon === '1' ? 1 : 0)
        }

        query += ' ORDER BY `created_at` DESC'

        if (limit) {
            query += ' LIMIT ?'
            params.push(parseInt(limit, 10))
        }

        const [rows] = await pool.query(query, params)
        const filmsWithRelations = await attachRelations(rows)

        return res.json({
            success: true,
            data: filmsWithRelations
        })
    } catch (error) {
        console.error('Get films error:', error)
        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil data film: ' + error.message
        })
    }
}

export async function getById(req, res) {
    try {
        const { id } = req.params
        const [rows] = await pool.query('SELECT * FROM `films` WHERE `id` = ? LIMIT 1', [id])

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Film tidak ditemukan.'
            })
        }

        const filmsWithRelations = await attachRelations(rows)
        return res.json({
            success: true,
            data: filmsWithRelations[0]
        })
    } catch (error) {
        console.error('Get film by id error:', error)
        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil detail film: ' + error.message
        })
    }
}

export async function getBySlug(req, res) {
    try {
        const { slug } = req.params
        const [rows] = await pool.query('SELECT * FROM `films` WHERE `slug` = ? LIMIT 1', [slug])

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Film tidak ditemukan.'
            })
        }

        const filmsWithRelations = await attachRelations(rows)
        return res.json({
            success: true,
            data: filmsWithRelations[0]
        })
    } catch (error) {
        console.error('Get film by slug error:', error)
        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil detail film: ' + error.message
        })
    }
}

export async function create(req, res) {
    try {
        const {
            title,
            slug,
            description,
            duration_minutes,
            release_date,
            poster_url,
            backdrop_url,
            embed_url,
            trailers_url,
            is_featured,
            is_coming_soon,
            selected_genres
        } = req.body

        if (!title || !slug) {
            return res.status(400).json({
                success: false,
                message: 'Judul dan slug film wajib diisi.'
            })
        }

        const id = crypto.randomUUID()
        await pool.query(`
            INSERT INTO \`films\` (
                \`id\`, \`title\`, \`slug\`, \`description\`, \`duration_minutes\`,
                \`release_date\`, \`poster_url\`, \`backdrop_url\`, \`embed_url\`,
                \`trailers_url\`, \`is_featured\`, \`is_coming_soon\`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id,
            title,
            slug,
            description || null,
            duration_minutes || null,
            release_date || null,
            poster_url || null,
            backdrop_url || null,
            embed_url || null,
            trailers_url || null,
            is_featured ? 1 : 0,
            is_coming_soon ? 1 : 0
        ])

        // Insert genres if provided
        if (Array.isArray(selected_genres) && selected_genres.length > 0) {
            for (const genreId of selected_genres) {
                await pool.query(
                    'INSERT IGNORE INTO `film_genres` (`id`, `film_id`, `genre_id`) VALUES (?, ?, ?)',
                    [crypto.randomUUID(), id, genreId]
                )
            }
        }

        const [created] = await pool.query('SELECT * FROM `films` WHERE `id` = ?', [id])
        const result = await attachRelations(created)

        return res.status(201).json({
            success: true,
            data: result[0]
        })
    } catch (error) {
        console.error('Create film error:', error)
        return res.status(500).json({
            success: false,
            message: 'Gagal membuat film: ' + error.message
        })
    }
}

export async function update(req, res) {
    try {
        const { id } = req.params
        const {
            title,
            slug,
            description,
            duration_minutes,
            release_date,
            poster_url,
            backdrop_url,
            embed_url,
            trailers_url,
            is_featured,
            is_coming_soon,
            selected_genres
        } = req.body

        await pool.query(`
            UPDATE \`films\` SET
                \`title\` = COALESCE(?, \`title\`),
                \`slug\` = COALESCE(?, \`slug\`),
                \`description\` = COALESCE(?, \`description\`),
                \`duration_minutes\` = ?,
                \`release_date\` = ?,
                \`poster_url\` = COALESCE(?, \`poster_url\`),
                \`backdrop_url\` = COALESCE(?, \`backdrop_url\`),
                \`embed_url\` = ?,
                \`trailers_url\` = ?,
                \`is_featured\` = ?,
                \`is_coming_soon\` = ?
            WHERE \`id\` = ?
        `, [
            title,
            slug,
            description,
            duration_minutes !== undefined ? duration_minutes : null,
            release_date || null,
            poster_url,
            backdrop_url,
            embed_url || null,
            trailers_url || null,
            is_featured !== undefined ? (is_featured ? 1 : 0) : 0,
            is_coming_soon !== undefined ? (is_coming_soon ? 1 : 0) : 0,
            id
        ])

        // Update genres if provided
        if (selected_genres !== undefined) {
            await pool.query('DELETE FROM `film_genres` WHERE `film_id` = ?', [id])
            if (Array.isArray(selected_genres) && selected_genres.length > 0) {
                for (const genreId of selected_genres) {
                    await pool.query(
                        'INSERT IGNORE INTO `film_genres` (`id`, `film_id`, `genre_id`) VALUES (?, ?, ?)',
                        [crypto.randomUUID(), id, genreId]
                    )
                }
            }
        }

        const [updated] = await pool.query('SELECT * FROM `films` WHERE `id` = ?', [id])
        if (updated.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Film tidak ditemukan.'
            })
        }

        const result = await attachRelations(updated)
        return res.json({
            success: true,
            data: result[0]
        })
    } catch (error) {
        console.error('Update film error:', error)
        return res.status(500).json({
            success: false,
            message: 'Gagal memperbarui film: ' + error.message
        })
    }
}

export async function remove(req, res) {
    try {
        const { id } = req.params
        await pool.query('DELETE FROM `films` WHERE `id` = ?', [id])
        return res.json({
            success: true,
            message: 'Film berhasil dihapus.'
        })
    } catch (error) {
        console.error('Delete film error:', error)
        return res.status(500).json({
            success: false,
            message: 'Gagal menghapus film: ' + error.message
        })
    }
}

// Behind the scenes controllers
export async function addBTS(req, res) {
    try {
        const { film_id, title, thumbnail_url, media_type } = req.body
        const id = crypto.randomUUID()

        await pool.query(`
            INSERT INTO \`behind_the_scenes\` (\`id\`, \`film_id\`, \`title\`, \`thumbnail_url\`, \`media_type\`)
            VALUES (?, ?, ?, ?, ?)
        `, [id, film_id, title || null, thumbnail_url || null, media_type || 'photo'])

        const [created] = await pool.query('SELECT * FROM `behind_the_scenes` WHERE `id` = ?', [id])
        return res.status(201).json({
            success: true,
            data: created[0]
        })
    } catch (error) {
        console.error('Add BTS error:', error)
        return res.status(500).json({
            success: false,
            message: 'Gagal menambah behind the scenes: ' + error.message
        })
    }
}

export async function deleteBTS(req, res) {
    try {
        const { id } = req.params
        await pool.query('DELETE FROM `behind_the_scenes` WHERE `id` = ?', [id])
        return res.json({
            success: true,
            message: 'Behind the scenes berhasil dihapus.'
        })
    } catch (error) {
        console.error('Delete BTS error:', error)
        return res.status(500).json({
            success: false,
            message: 'Gagal menghapus BTS: ' + error.message
        })
    }
}

