import crypto from 'crypto'
import pool from '../config/db.js'

export async function getAll(req, res) {
    try {
        const [rows] = await pool.query('SELECT * FROM `themes` ORDER BY `created_at` DESC')
        const formatted = rows.map(t => ({
            ...t,
            is_active: Boolean(t.is_active)
        }))
        return res.json({
            success: true,
            data: formatted
        })
    } catch (error) {
        console.error('Get themes error:', error)
        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil data tema: ' + error.message
        })
    }
}

export async function create(req, res) {
    try {
        const { name, primary_color, secondary_color, background_color, text_color, is_active } = req.body

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Nama tema wajib diisi.'
            })
        }

        const id = crypto.randomUUID()
        const activeVal = is_active ? 1 : 0

        if (activeVal === 1) {
            await pool.query('UPDATE `themes` SET `is_active` = 0')
        }

        await pool.query(`
            INSERT INTO \`themes\` (\`id\`, \`name\`, \`primary_color\`, \`secondary_color\`, \`background_color\`, \`text_color\`, \`is_active\`)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            id,
            name,
            primary_color || '#c11267',
            secondary_color || '#e94e77',
            background_color || '#0f1115',
            text_color || '#ffffff',
            activeVal
        ])

        const [created] = await pool.query('SELECT * FROM `themes` WHERE `id` = ?', [id])
        return res.status(201).json({
            success: true,
            data: {
                ...created[0],
                is_active: Boolean(created[0].is_active)
            }
        })
    } catch (error) {
        console.error('Create theme error:', error)
        return res.status(500).json({
            success: false,
            message: 'Gagal membuat tema: ' + error.message
        })
    }
}

export async function update(req, res) {
    try {
        const { id } = req.params
        const { name, primary_color, secondary_color, background_color, text_color, is_active } = req.body

        if (is_active) {
            await pool.query('UPDATE `themes` SET `is_active` = 0 WHERE `id` != ?', [id])
        }

        await pool.query(`
            UPDATE \`themes\` SET
                \`name\` = COALESCE(?, \`name\`),
                \`primary_color\` = COALESCE(?, \`primary_color\`),
                \`secondary_color\` = COALESCE(?, \`secondary_color\`),
                \`background_color\` = COALESCE(?, \`background_color\`),
                \`text_color\` = COALESCE(?, \`text_color\`),
                \`is_active\` = ?
            WHERE \`id\` = ?
        `, [
            name,
            primary_color,
            secondary_color,
            background_color,
            text_color,
            is_active !== undefined ? (is_active ? 1 : 0) : 0,
            id
        ])

        const [updated] = await pool.query('SELECT * FROM `themes` WHERE `id` = ?', [id])
        if (updated.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tema tidak ditemukan.'
            })
        }

        return res.json({
            success: true,
            data: {
                ...updated[0],
                is_active: Boolean(updated[0].is_active)
            }
        })
    } catch (error) {
        console.error('Update theme error:', error)
        return res.status(500).json({
            success: false,
            message: 'Gagal memperbarui tema: ' + error.message
        })
    }
}

export async function setActive(req, res) {
    try {
        const { id } = req.params
        await pool.query('UPDATE `themes` SET `is_active` = 0')
        await pool.query('UPDATE `themes` SET `is_active` = 1 WHERE `id` = ?', [id])

        const [updated] = await pool.query('SELECT * FROM `themes` WHERE `id` = ?', [id])
        if (updated.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tema tidak ditemukan.'
            })
        }

        return res.json({
            success: true,
            data: {
                ...updated[0],
                is_active: true
            }
        })
    } catch (error) {
        console.error('Activate theme error:', error)
        return res.status(500).json({
            success: false,
            message: 'Gagal mengaktifkan tema: ' + error.message
        })
    }
}

export async function remove(req, res) {
    try {
        const { id } = req.params
        await pool.query('DELETE FROM `themes` WHERE `id` = ?', [id])
        return res.json({
            success: true,
            message: 'Tema berhasil dihapus.'
        })
    } catch (error) {
        console.error('Delete theme error:', error)
        return res.status(500).json({
            success: false,
            message: 'Gagal menghapus tema: ' + error.message
        })
    }
}

