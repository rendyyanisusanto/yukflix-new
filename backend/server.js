import app from './src/app.js'
import { testConnection } from './src/config/db.js'

const PORT = process.env.PORT || 5000

async function startServer() {
    console.log('[Server] Checking MySQL database connection...')
    const isDbConnected = await testConnection()

    if (!isDbConnected) {
        console.warn('[Server] WARNING: Could not connect to MySQL database. Server will still start, but database operations may fail.')
    }

    app.listen(PORT, () => {
        console.log(`[Server] Kinarya Yukflix Backend is running on http://localhost:${PORT}`)
        console.log(`[Server] Health check: http://localhost:${PORT}/api/health`)
    })
}

startServer()

