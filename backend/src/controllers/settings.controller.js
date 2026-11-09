import pool from '../config/db.js'

export async function getAll(req, res) {
    try {
        const [rows] = await pool.query('SELECT * FROM `site_settings`')
        return res.json({
            success: true,
            data: rows
        })
    } catch (error) {
        console.error('Get settings error:', error)
        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil pengaturan situs: ' + error.message
        })
    }
}

export async function upsert(req, res) {
    try {
        const settings = req.body // Can be array of { key, value } or object { [key]: value }

        if (Array.isArray(settings)) {
            for (const item of settings) {
                await pool.query(
                    'INSERT INTO `site_settings` (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
                    [item.key, item.value]
                )
            }
        } else if (typeof settings === 'object' && settings !== null) {
            for (const [key, value] of Object.entries(settings)) {
                await pool.query(
                    'INSERT INTO `site_settings` (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
                    [key, value]
                )
            }
        }

        const [rows] = await pool.query('SELECT * FROM `site_settings`')
        return res.json({
            success: true,
            data: rows
        })
    } catch (error) {
        console.error('Upsert settings error:', error)
        return res.status(500).json({
            success: false,
            message: 'Gagal memperbarui pengaturan situs: ' + error.message
        })
    }
}

