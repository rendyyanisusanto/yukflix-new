import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import multer from 'multer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsRoot = path.resolve(__dirname, '../../uploads')

// Ensure uploads directories exist
const folders = ['posters', 'backdrops', 'bts', 'media']
folders.forEach(folder => {
    const dir = path.join(uploadsRoot, folder)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
})

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = req.query.folder || req.body.folder || 'media'
        const targetDir = path.join(uploadsRoot, folder)
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true })
        }
        cb(null, targetDir)
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.jpg'
        const uniqueName = `${Math.random().toString(36).substring(2, 10)}-${Date.now()}${ext}`
        cb(null, uniqueName)
    }
})

export const uploadMiddleware = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
})

export function handleUpload(req, res) {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'File tidak ditemukan untuk diunggah.'
        })
    }

    const folder = req.query.folder || req.body.folder || 'media'
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000'
    const fileUrl = `${baseUrl}/uploads/${folder}/${req.file.filename}`

    return res.json({
        success: true,
        data: {
            filename: req.file.filename,
            path: `${folder}/${req.file.filename}`,
            url: fileUrl
        }
    })
}

