import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

import authRoutes from './routes/auth.routes.js'
import filmRoutes from './routes/film.routes.js'
import genreRoutes from './routes/genre.routes.js'
import faqRoutes from './routes/faq.routes.js'
import themeRoutes from './routes/theme.routes.js'
import settingsRoutes from './routes/settings.routes.js'
import uploadRoutes from './routes/upload.routes.js'
import statsRoutes from './routes/stats.routes.js'
import challengeRoutes from './routes/challenge.routes.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// CORS
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean)
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
            callback(null, true)
        } else {
            callback(null, true) // Allow all in development
        }
    },
    credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Static media uploads serving
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')))

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'kinarya-yukflix-backend',
        timestamp: new Date().toISOString()
    })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/films', filmRoutes)
app.use('/api/genres', genreRoutes)
app.use('/api/faqs', faqRoutes)
app.use('/api/themes', themeRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/challenges', challengeRoutes)

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Endpoint ${req.method} ${req.url} tidak ditemukan.`
    })
})

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err)
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Terjadi kesalahan internal pada server.'
    })
})

export default app

