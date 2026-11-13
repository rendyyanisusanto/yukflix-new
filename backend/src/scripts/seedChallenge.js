import mysql from 'mysql2/promise'
import crypto from 'crypto'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_HOST = process.env.DB_HOST || '127.0.0.1'
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10)
const DB_USER = process.env.DB_USER || 'root'
const DB_PASSWORD = process.env.DB_PASSWORD || ''
const DB_NAME = process.env.DB_NAME || 'kinarya-yukflix'

export async function runChallengeMigrationAndSeed() {
    console.log(`[Challenge Seed] Connecting to MySQL on ${DB_HOST}:${DB_PORT}/${DB_NAME}...`)

    const connection = await mysql.createConnection({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        multipleStatements: true
    })

    try {
        console.log('[Challenge Seed] Executing challenge schema DDL...')
        const schemaPath = path.resolve(__dirname, '../../../database/challenge_schema.sql')
        if (fs.existsSync(schemaPath)) {
            const sql = fs.readFileSync(schemaPath, 'utf8')
            await connection.query(sql)
            console.log('[Challenge Seed] Tables verified.')
        }

        // Ensure category_id exists on challenge_questions if table already existed prior to migration
        const [cqCols] = await connection.query(`SHOW COLUMNS FROM \`challenge_questions\` LIKE 'category_id'`)
        if (cqCols.length === 0) {
            await connection.query(`ALTER TABLE \`challenge_questions\` ADD COLUMN \`category_id\` VARCHAR(36) NULL AFTER \`video_id\``)
            console.log('[Challenge Seed] Added category_id column to challenge_questions.')
        }

        // Seed default categories
        const defaultCategories = [
            { name: 'Director of Photography (DOP) dan camera work', desc: 'Pengamatan pencahayaan, pemilihan lensa, dan estetika pergerakan kamera.', order: 1 },
            { name: 'Camera angle, framing, shot size, dan pergerakan kamera', desc: 'Analisis tipe ukuran shot (framing), sudut pengambilan gambar, dan pergerakan kamera dinamis.', order: 2 },
            { name: 'Wardrobe dan makeup', desc: 'Kesesuaian tata rias, gaya rambut, dan busana karakter terhadap era dan status sosial.', order: 3 },
            { name: 'Props dan production design', desc: 'Penataan tata artistik ruangan, pemilihan properti naratif, dan makna simbolik benda.', order: 4 },
            { name: 'Directing, acting, dan blocking', desc: 'Penyutradaraan emosional, penghayatan peran para aktor, serta blocking di panggung set.', order: 5 },
            { name: 'Location dan setting', desc: 'Pemilihan lokasi riil vs studio dan pengaruh setting lingkungan terhadap tensi dramatis cerita.', order: 6 },
            { name: 'Audio, dialog, dan sound design', desc: 'Ketajaman rekam audio langsung, dialog vokal, sound effect (Foley), serta ambient noise.', order: 7 },
            { name: 'Literasi visual', desc: 'Kemampuan membaca metafora visual, semiotika gambar, dan arti filosofis di balik komposisi visual.', order: 8 },
            { name: 'Literasi audio', desc: 'Pembedahan musik latar, mood score, ritme tempo lagu, serta kontras keheningan adegan.', order: 9 },
            { name: 'Hubungan antara audio dan visual', desc: 'Harmoni pacing editing pemotongan gambar (cutting) dengan birama dan dinamika suara.', order: 10 },
            { name: 'Hubungan adegan dengan SDGs', desc: 'Keterkaitan alur adegan dan isu film dengan 17 Tujuan Pembangunan Berkelanjutan dunia.', order: 11 },
            { name: 'Creative thinking dan ide pengembangan adegan', desc: 'Pengembangan ide plot twist, alternatif resolusi, atau variasi penataan adegan baru.', order: 12 }
        ]

        console.log('[Challenge Seed] Verifying question categories...')
        const categoryMap = new Map()
        for (const cat of defaultCategories) {
            const [existingCat] = await connection.query(
                'SELECT `id`, `name` FROM `challenge_question_categories` WHERE `name` = ? LIMIT 1',
                [cat.name]
            )
            if (existingCat.length > 0) {
                categoryMap.set(cat.name, existingCat[0].id)
            } else {
                const catId = crypto.randomUUID()
                await connection.query(`
                    INSERT INTO \`challenge_question_categories\` (\`id\`, \`name\`, \`description\`, \`order_num\`, \`is_active\`)
                    VALUES (?, ?, ?, ?, 1)
                `, [catId, cat.name, cat.desc, cat.order])
                categoryMap.set(cat.name, catId)
                console.log(`[Challenge Seed] Inserted category: ${cat.name}`)
            }
        }

        // Link existing challenge_questions without category_id to challenge_question_categories
        for (const [name, catId] of categoryMap.entries()) {
            await connection.query(
                'UPDATE `challenge_questions` SET `category_id` = ? WHERE `category` = ? AND (`category_id` IS NULL OR `category_id` = "")',
                [catId, name]
            )
        }

        // Check if default challenge exists
        const challengeSlug = 'national-youth-film-crew-talent'

        // Update legacy slug/title if present
        await connection.query(`
            UPDATE \`film_challenges\`
            SET \`slug\` = 'national-youth-film-crew-talent',
                \`title\` = 'National Youth Film Crew & Talent Challenge'
            WHERE \`slug\` = 'national-youth-film-crew'
        `)

        const [existing] = await connection.query(
            'SELECT * FROM `film_challenges` WHERE `slug` = ? LIMIT 1',
            [challengeSlug]
        )

        let challengeId = null
        if (existing.length > 0) {
            challengeId = existing[0].id
            console.log(`[Challenge Seed] Challenge "${existing[0].title}" already exists (ID: ${challengeId}).`)
        } else {
            challengeId = crypto.randomUUID()
            console.log(`[Challenge Seed] Creating challenge "${challengeSlug}"...`)
            await connection.query(`
                INSERT INTO \`film_challenges\` (
                    \`id\`, \`title\`, \`slug\`, \`subtitle\`, \`description\`, \`status\`, \`start_date\`, \`end_date\`
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                challengeId,
                'National Youth Film Crew & Talent Challenge',
                challengeSlug,
                'Kinarya Coop',
                'Program seleksi dan tantangan uji kompetensi audio-visual, literasi sinematografi, dan eksplorasi isu SDGs bagi pelajar dan generasi muda Indonesia yang berminat berkarier dalam industri perfilman nasional.',
                'published',
                '2026-01-01',
                '2026-12-31'
            ])
        }

        // Check videos
        const [videos] = await connection.query(
            'SELECT * FROM `challenge_videos` WHERE `challenge_id` = ? ORDER BY `video_order` ASC',
            [challengeId]
        )

        if (videos.length === 0) {
            console.log('[Challenge Seed] Seeding 5 default challenge videos...')

            const videoData = [
                {
                    title: 'Video 1: Sinematografi & Camera Movement',
                    url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
                    id: 'jNQXAC9IVRw',
                    instructions: 'Tonton video berikut dengan cermat. Amati tata cahaya (key light, fill light, backlight), komposisi framing, dan pergerakan kamera (camera movement) dalam adegan.'
                },
                {
                    title: 'Video 2: Tata Artistik, Wardrobe & Tata Suara',
                    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    id: 'dQw4w9WgXcQ',
                    instructions: 'Perhatikan detail tata rias, pakaian karakter (wardrobe), tata letak properti ruangan, serta kesesuaian sound effect (Foley) dan ambient noise dengan suasana adegan.'
                },
                {
                    title: 'Video 3: Directing, Akting & Blocking Karakter',
                    url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
                    id: 'aqz-KE-bpKQ',
                    instructions: 'Amati pergerakan aktor di set (blocking), ritme tempo dialog, serta bagaimana sutradara mengarahkan interaksi emosional antar tokoh.'
                },
                {
                    title: 'Video 4: Literasi Audio-Visual & Hubungan Makna',
                    url: 'https://www.youtube.com/watch?v=L_LUpnjgPso',
                    id: 'L_LUpnjgPso',
                    instructions: 'Analisis simbol-simbol visual yang muncul dalam video. Bagaimana nada warna (color grading) dan nada audio berpadu untuk menyampaikan pesan tersirat kepada penonton?'
                },
                {
                    title: 'Video 5: Eksplorasi Isu SDGs & Pengembangan Adegan Kreatif',
                    url: 'https://www.youtube.com/watch?v=M576WGiDBdQ',
                    id: 'M576WGiDBdQ',
                    instructions: 'Cermati konflik sosial, ekonomi, atau lingkungan yang tercermin dalam video. Hubungkan dengan Tujuan Pembangunan Berkelanjutan (SDGs) dan rancang ide pengembangan adegan.'
                }
            ]

            const videoIds = []
            for (let i = 0; i < videoData.length; i++) {
                const v = videoData[i]
                const vId = crypto.randomUUID()
                await connection.query(`
                    INSERT INTO \`challenge_videos\` (
                        \`id\`, \`challenge_id\`, \`video_order\`, \`title\`, \`youtube_url\`, \`youtube_video_id\`, \`instructions\`, \`is_active\`
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [vId, challengeId, i + 1, v.title, v.url, v.id, v.instructions, 1])
                videoIds.push(vId)
            }

            console.log('[Challenge Seed] Seeding questions across 12 categories...')

            // Questions definition
            const questions = [
                // Video 1
                {
                    video_id: videoIds[0],
                    category: 'Director of Photography (DOP) dan camera work',
                    text: 'Bagaimana penata kamera memanfaatkan kontras pencahayaan untuk membedakan suasana psikologis karakter utama pada adegan pembuka? Jelaskan pengamatan Anda.',
                    type: 'essay',
                    options: null,
                    order: 1
                },
                {
                    video_id: videoIds[0],
                    category: 'Camera angle, framing, shot size, dan pergerakan kamera',
                    text: 'Tipe shot size dan sudut kamera apa yang paling dominan digunakan saat adegan mencapai titik klimaks?',
                    type: 'single_choice',
                    options: JSON.stringify([
                        'Extreme Long Shot dengan High Angle untuk menunjukkan isolasi',
                        'Close-Up dengan Eye-Level untuk mempertegas ekspresi emosional',
                        'Dutch Angle dengan Medium Shot untuk memberikan rasa disorientasi',
                        'Over-The-Shoulder Shot dengan Low Angle untuk memperlihatkan dominasi'
                    ]),
                    order: 2
                },

                // Video 2
                {
                    video_id: videoIds[1],
                    category: 'Wardrobe dan makeup',
                    text: 'Jelaskan bagaimana pilihan warna busana (wardrobe) dan gaya tata rias merefleksikan status sosial serta kepribadian tokoh dalam video ini.',
                    type: 'essay',
                    options: null,
                    order: 1
                },
                {
                    video_id: videoIds[1],
                    category: 'Props dan production design',
                    text: 'Properti kunci apa dalam ruangan yang paling kuat berfungsi sebagai simbol naratif dan petunjuk alur cerita?',
                    type: 'single_choice',
                    options: JSON.stringify([
                        'Foto keluarga usang di atas meja kerja',
                        'Jam dinding yang detaknya dipertegas',
                        'Surat kabar bertanggal masa lalu di sudut lantai',
                        'Pakaian kerja yang tergantung di dekat pintu keluar'
                    ]),
                    order: 2
                },
                {
                    video_id: videoIds[1],
                    category: 'Audio, dialog, dan sound design',
                    text: 'Bagaimana perpaduan antara suara latar (ambience sound) dan kejelasan dialog memengaruhi ketegangan adegan? Uraikan bagian audio yang paling berkesan bagi Anda.',
                    type: 'essay',
                    options: null,
                    order: 3
                },

                // Video 3
                {
                    video_id: videoIds[2],
                    category: 'Directing, acting, dan blocking',
                    text: 'Uraikan bagaimana blocking (penataan posisi dan pergerakan aktor di depan kamera) membantu penonton memahami pergeseran dinamika kekuasaan di antara kedua karakter.',
                    type: 'essay',
                    options: null,
                    order: 1
                },
                {
                    video_id: videoIds[2],
                    category: 'Location dan setting',
                    text: 'Menurut pengamatan Anda, mengapa pemilihan lokasi ini sangat mendukung pesan dramatis cerita dibandingkan ruang studio tertutup?',
                    type: 'single_choice',
                    options: JSON.stringify([
                        'Memberikan tekstur visual realistis dan kedalaman ruang yang otentik',
                        'Mengurangi kebutuhan tata cahaya buatan secara drastis',
                        'Menghadirkan kesan keterisolasian yang memperkuat tema keterasingan',
                        'Memudahkan pergerakan kamera 360 derajat tanpa halangan'
                    ]),
                    order: 2
                },

                // Video 4
                {
                    video_id: videoIds[3],
                    category: 'Literasi visual',
                    text: 'Identifikasi minimal dua metafora visual yang ditampilkan dalam video ini dan jelaskan makna filosofis di baliknya.',
                    type: 'essay',
                    options: null,
                    order: 1
                },
                {
                    video_id: videoIds[3],
                    category: 'Literasi audio',
                    text: 'Unsur audio manakah yang paling berperan dalam memicu antisipasi atau perubahan suasana hati penonton?',
                    type: 'single_choice',
                    options: JSON.stringify([
                        'Perubahan tempo string orchestra dari lambat ke ritmis cepat',
                        'Hening total (silence) mendadak sebelum adegan terpenting',
                        'Suara langkah kaki bergema di lorong sepi',
                        'Distorsi frekuensi rendah (low rumble drone) di latar belakang'
                    ]),
                    order: 2
                },
                {
                    video_id: videoIds[3],
                    category: 'Hubungan antara audio dan visual',
                    text: 'Jelaskan bagaimana ritme editing visual (cut pacing) disinkronkan dengan birama musik tema untuk memperkuat efek dramatik.',
                    type: 'essay',
                    options: null,
                    order: 3
                },

                // Video 5
                {
                    video_id: videoIds[4],
                    category: 'Hubungan adegan dengan SDGs',
                    text: 'Isu Tujuan Pembangunan Berkelanjutan (SDGs) nomor berapakah yang paling relevan dengan konflik dalam video ini (misalnya: Pendidikan Berkualitas, Pekerjaan Layak, Konsumsi Bertanggung Jawab, atau Penanganan Perubahan Iklim)? Jelaskan argumentasi Anda.',
                    type: 'essay',
                    options: null,
                    order: 1
                },
                {
                    video_id: videoIds[4],
                    category: 'Creative thinking dan ide pengembangan adegan',
                    text: 'Jika Anda berperan sebagai sutradara atau penulis skenario, ide adegan atau plot twist baru apa yang akan Anda tambahkan di akhir cerita untuk memberikan dampak sosial yang lebih mendalam bagi penonton generasi muda?',
                    type: 'essay',
                    options: null,
                    order: 2
                }
            ]

            for (const q of questions) {
                await connection.query(`
                    INSERT INTO \`challenge_questions\` (
                        \`id\`, \`challenge_id\`, \`video_id\`, \`category_id\`, \`category\`, \`question_text\`, \`answer_type\`, \`options\`, \`question_order\`, \`is_active\`
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    crypto.randomUUID(),
                    challengeId,
                    q.video_id,
                    categoryMap.get(q.category) || null,
                    q.category,
                    q.text,
                    q.type,
                    q.options,
                    q.order,
                    1
                ])
            }

            console.log(`[Challenge Seed] Seeded ${questions.length} questions successfully!`)
        }

        console.log('[Challenge Seed] Done.')
    } catch (err) {
        console.error('[Challenge Seed] Error:', err)
        throw err
    } finally {
        await connection.end()
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runChallengeMigrationAndSeed()
}

