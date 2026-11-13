import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

export const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kinarya-yukflix',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    dateStrings: ['DATE']
})

export async function testConnection() {
    try {
        const connection = await pool.getConnection()
        console.log(`[Database] Connected successfully to MySQL database "${process.env.DB_NAME || 'kinarya-yukflix'}" on ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || '3306'}`)
        connection.release()
        return true
    } catch (error) {
        console.error('[Database] Connection failed:', error.message)
        return false
    }
}

export default pool

