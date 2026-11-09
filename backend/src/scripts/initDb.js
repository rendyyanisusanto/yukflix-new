import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

const DB_HOST = process.env.DB_HOST || '127.0.0.1'
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10)
const DB_USER = process.env.DB_USER || 'root'
const DB_PASSWORD = process.env.DB_PASSWORD || ''
const DB_NAME = process.env.DB_NAME || 'kinarya-yukflix'

async function initDb() {
    console.log(`[InitDB] Connecting to MySQL on ${DB_HOST}:${DB_PORT}...`)
    
    // Connect without database selected first
    const connection = await mysql.createConnection({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD
    })

    try {
        console.log(`[InitDB] Ensuring database \`${DB_NAME}\` exists...`)
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
        await connection.query(`USE \`${DB_NAME}\``)

        console.log('[InitDB] Creating tables...')

        // Admin users table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`admin_users\` (
                \`id\` VARCHAR(36) PRIMARY KEY,
                \`email\` VARCHAR(255) NOT NULL UNIQUE,
                \`password\` VARCHAR(255) NOT NULL,
                \`name\` VARCHAR(100) DEFAULT 'Admin',
                \`role\` VARCHAR(50) DEFAULT 'admin',
                \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `)

        // Films table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`films\` (
                \`id\` VARCHAR(36) PRIMARY KEY,
                \`title\` VARCHAR(255) NOT NULL,
                \`slug\` VARCHAR(255) NOT NULL UNIQUE,
                \`description\` TEXT,
                \`duration_minutes\` INT DEFAULT NULL,
                \`release_date\` DATE DEFAULT NULL,
                \`poster_url\` TEXT,
                \`backdrop_url\` TEXT,
                \`embed_url\` TEXT,
                \`trailers_url\` TEXT,
                \`is_featured\` TINYINT(1) DEFAULT 0,
                \`is_coming_soon\` TINYINT(1) DEFAULT 0,
                \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `)

        // Genres table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`genres\` (
                \`id\` VARCHAR(36) PRIMARY KEY,
                \`name\` VARCHAR(100) NOT NULL UNIQUE,
                \`slug\` VARCHAR(100) NOT NULL UNIQUE,
                \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `)

        // Film-Genres junction
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`film_genres\` (
                \`id\` VARCHAR(36) PRIMARY KEY,
                \`film_id\` VARCHAR(36) NOT NULL,
                \`genre_id\` VARCHAR(36) NOT NULL,
                UNIQUE KEY \`uk_film_genre\` (\`film_id\`, \`genre_id\`),
                CONSTRAINT \`fk_fg_film\` FOREIGN KEY (\`film_id\`) REFERENCES \`films\` (\`id\`) ON DELETE CASCADE,
                CONSTRAINT \`fk_fg_genre\` FOREIGN KEY (\`genre_id\`) REFERENCES \`genres\` (\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `)

        // Behind the scenes table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`behind_the_scenes\` (
                \`id\` VARCHAR(36) PRIMARY KEY,
                \`film_id\` VARCHAR(36) NOT NULL,
                \`title\` VARCHAR(255) DEFAULT NULL,
                \`thumbnail_url\` TEXT,
                \`media_type\` VARCHAR(50) DEFAULT 'photo',
                \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT \`fk_bts_film\` FOREIGN KEY (\`film_id\`) REFERENCES \`films\` (\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `)

        // FAQs table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`faqs\` (
                \`id\` VARCHAR(36) PRIMARY KEY,
                \`question\` TEXT NOT NULL,
                \`sort_order\` INT DEFAULT 0,
                \`is_active\` TINYINT(1) DEFAULT 1,
                \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `)

        // FAQ Answers table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`faq_answers\` (
                \`id\` VARCHAR(36) PRIMARY KEY,
                \`faq_id\` VARCHAR(36) NOT NULL,
                \`answer\` TEXT NOT NULL,
                \`sort_order\` INT DEFAULT 0,
                \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT \`fk_faq_answer\` FOREIGN KEY (\`faq_id\`) REFERENCES \`faqs\` (\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `)

        // Themes table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`themes\` (
                \`id\` VARCHAR(36) PRIMARY KEY,
                \`name\` VARCHAR(100) NOT NULL,
                \`primary_color\` VARCHAR(7) DEFAULT '#c11267',
                \`secondary_color\` VARCHAR(7) DEFAULT '#e94e77',
                \`background_color\` VARCHAR(7) DEFAULT '#0f1115',
                \`text_color\` VARCHAR(7) DEFAULT '#ffffff',
                \`is_active\` TINYINT(1) DEFAULT 0,
                \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `)

        // Site Settings table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`site_settings\` (
                \`key\` VARCHAR(100) PRIMARY KEY,
                \`value\` TEXT,
                \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `)

        console.log('[InitDB] Tables verified successfully.')

        // Seed Admin user
        const adminEmail = 'admin@yukflix.com'
        const [existingAdmin] = await connection.query(
            'SELECT * FROM `admin_users` WHERE `email` = ?',
            [adminEmail]
        )

        if (existingAdmin.length === 0) {
            console.log('[InitDB] Seeding default admin user (admin@yukflix.com / admin123)...')
            const hashedPassword = await bcrypt.hash('admin123', 10)
            await connection.query(
                'INSERT INTO `admin_users` (`id`, `email`, `password`, `name`, `role`) VALUES (?, ?, ?, ?, ?)',
                [crypto.randomUUID(), adminEmail, hashedPassword, 'Administrator', 'admin']
            )
        }

        // Seed Default Settings
        const defaultSettings = [
            ['site_name', 'Yukflix'],
            ['tagline', 'Your Premium Streaming Platform'],
            ['footer_text', '© 2026 Yukflix. All rights reserved.']
        ]

        for (const [key, val] of defaultSettings) {
            await connection.query(
                'INSERT INTO `site_settings` (\`key\`, \`value\`) VALUES (?, ?) ON DUPLICATE KEY UPDATE \`key\`=\`key\`',
                [key, val]
            )
        }

        // Seed Default Theme
        const [existingTheme] = await connection.query('SELECT * FROM `themes` LIMIT 1')
        if (existingTheme.length === 0) {
            console.log('[InitDB] Seeding default theme...')
            await connection.query(`
                INSERT INTO \`themes\` (\`id\`, \`name\`, \`primary_color\`, \`secondary_color\`, \`background_color\`, \`text_color\`, \`is_active\`)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [crypto.randomUUID(), 'YukFlix Default', '#c11267', '#e94e77', '#0f1115', '#ffffff', 1])
        }

        // Seed Default Genres
        const defaultGenres = [
            { name: 'Action', slug: 'action' },
            { name: 'Drama', slug: 'drama' },
            { name: 'Komedi', slug: 'komedi' },
            { name: 'Horor', slug: 'horor' },
            { name: 'Romantis', slug: 'romantis' },
            { name: 'Sci-Fi', slug: 'sci-fi' },
            { name: 'Dokumenter', slug: 'dokumenter' }
        ]

        for (const genre of defaultGenres) {
            await connection.query(
                'INSERT IGNORE INTO `genres` (`id`, `name`, `slug`) VALUES (?, ?, ?)',
                [crypto.randomUUID(), genre.name, genre.slug]
            )
        }

        console.log('[InitDB] Database initialization and seed completed successfully!')
    } catch (err) {
        console.error('[InitDB] Error during initialization:', err)
        throw err
    } finally {
        await connection.end()
    }
}

initDb()

