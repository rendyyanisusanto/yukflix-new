import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../config/db.js'

export async function login(req, res) {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.'
            })
        }

        const [rows] = await pool.query(
            'SELECT * FROM `admin_users` WHERE `email` = ? LIMIT 1',
            [email.trim().toLowerCase()]
        )

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Email atau password salah.'
            })
        }

        const admin = rows[0]
        const isMatch = await bcrypt.compare(password, admin.password)

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Email atau password salah.'
            })
        }

        const token = jwt.sign(
            { id: admin.id, email: admin.email, role: admin.role, name: admin.name },
            process.env.JWT_SECRET || 'kinarya-yukflix-secret-key-2026',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        )

        const user = {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role
        }

        return res.json({
            success: true,
            data: {
                user,
                token
            }
        })
    } catch (error) {
        console.error('Login error:', error)
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server saat login.'
        })
    }
}

export async function me(req, res) {
    try {
        const [rows] = await pool.query(
            'SELECT `id`, `email`, `name`, `role`, `created_at` FROM `admin_users` WHERE `id` = ? LIMIT 1',
            [req.user.id]
        )

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan.'
            })
        }

        return res.json({
            success: true,
            data: {
                user: rows[0]
            }
        })
    } catch (error) {
        console.error('Get profile error:', error)
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat memeriksa profil.'
        })
    }
}

export async function logout(req, res) {
    return res.json({
        success: true,
        message: 'Logout berhasil.'
    })
}

