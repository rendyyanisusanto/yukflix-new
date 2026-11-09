import crypto from 'crypto'
import pool from '../config/db.js'

export async function getAll(req, res) {
    try {
        const [rows] = await pool.query('SELECT * FROM `genres` ORDER BY `name` ASC')
        return res.json({
            success: true,
            data: rows
        })
    } catch (error) {
        console.error('Get genres error:', error)
        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil data genre: ' + error.message
        })
    }
}

export async function getById(req, res) {
    try {
        const { id } = req.params
        const [rows] = await pool.query('SELECT * FROM `genres` WHERE `id` = ? LIMIT 1', [id])

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Genre tidak ditemukan.'
            })
        }

        return res.json({
            success: true,
            data: rows[0]
        })
    } catch (error) {
        console.error('Get genre by id error:', error)
        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil genre: ' + error.message
        })
    }
}

export async function create(req, res) {
    try {
        const { name, slug } = req.body

        if (!name || !slug) {
            return res.status(400).json({
                success: false,
                message: 'Nama dan slug genre wajib diisi.'
            })
        }

        const id = crypto.randomUUID()
        await pool.query(
            'INSERT INTO `genres` (`id`, `name`, `slug`) VALUES (?, ?, ?)',
            [id, name, slug]
        )

        const [created] = await pool.query('SELECT * FROM `genres` WHERE `id` = ?', [id])
        return res.status(201).json({
            success: true,
            data: created[0]
        })
    } catch (error) {
        console.error('Create genre error:', error)
        return res.status(500).json({
            success: false,
            message: 'Gagal membuat genre: ' + error.message
        })
    }
}

export async function update(req, res) {
    try {
        const { id } = req.params
        const { name, slug } = req.body

        await pool.query(
            'UPDATE `genres` SET `name` = COALESCE(?, `name`), `slug` = COALESCE(?, `slug`) WHERE `id` = ?',
            [name, slug, id]
        )

        const [updated] = await pool.query('SELECT * FROM `genres` WHERE `id` = ?', [id])
        if (updated.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Genre tidak ditemukan.'
            })
        }

        return res.json({
            success: true,
            data: updated[0]
        })
    } catch (error) {
        console.error('Update genre error:', error)
        return res.status(500).json({
            success: false,
            message: 'Gagal memperbarui genre: ' + error.message
        })
    }
}

export async function remove(req, res) {
    try {
        const { id } = req.params
        await pool.query('DELETE FROM `genres` WHERE `id` = ?', [id])
        return res.json({
            success: true,
            message: 'Genre berhasil dihapus.'
        })
    } catch (error) {
        console.error('Delete genre error:', error)
        return res.status(500).json({
            success: false,
            message: 'Gagal menghapus genre: ' + error.message
        })
    }
}

