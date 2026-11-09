import pool from '../config/db.js'

export async function getStats(req, res) {
    try {
        const [[{ totalFilms }]] = await pool.query('SELECT COUNT(*) as totalFilms FROM `films`')
        const [[{ totalGenres }]] = await pool.query('SELECT COUNT(*) as totalGenres FROM `genres`')
        const [[{ comingSoon }]] = await pool.query('SELECT COUNT(*) as comingSoon FROM `films` WHERE `is_coming_soon` = 1')
        const [[{ featured }]] = await pool.query('SELECT COUNT(*) as featured FROM `films` WHERE `is_featured` = 1')

        const [recentFilms] = await pool.query(`
            SELECT \`id\`, \`title\`, \`created_at\`, \`poster_url\`
            FROM \`films\`
            ORDER BY \`created_at\` DESC
            LIMIT 5
        `)

        return res.json({
            success: true,
            data: {
                totalFilms: Number(totalFilms || 0),
                totalGenres: Number(totalGenres || 0),
                comingSoon: Number(comingSoon || 0),
                featured: Number(featured || 0),
                recentFilms: recentFilms || []
            }
        })
    } catch (error) {
        console.error('Get stats error:', error)
        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil statistik dashboard: ' + error.message
        })
    }
}

