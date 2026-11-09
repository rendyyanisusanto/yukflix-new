import jwt from 'jsonwebtoken'

export function authenticate(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : null

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Akses ditolak: Token otentikasi tidak ditemukan.'
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kinarya-yukflix-secret-key-2026')
        req.user = decoded
        next()
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Token otentikasi tidak valid atau telah kedaluwarsa.'
        })
    }
}

export default authenticate

