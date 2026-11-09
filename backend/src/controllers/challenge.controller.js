import crypto from 'crypto'
import pool from '../config/db.js'

// Simple IP in-memory rate limiter for submissions
const submissionIpCounts = new Map()
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 mins
const MAX_SUBMISSIONS_PER_IP = 5

function checkRateLimit(ip) {
    const now = Date.now()
    const record = submissionIpCounts.get(ip)
    if (!record) {
        submissionIpCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
        return true
    }
    if (now > record.resetTime) {
        submissionIpCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
        return true
    }
    if (record.count >= MAX_SUBMISSIONS_PER_IP) {
        return false
    }
    record.count++
    return true
}

// Helper to extract YouTube video ID from URL
function extractYouTubeId(url) {
    if (!url) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
}

// Generate unique registration number: NYFC-YYYYMMDD-XXXX
function generateRegNumber() {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    const rand = crypto.randomBytes(2).toString('hex').toUpperCase()
    return `NYFC-${y}${m}${d}-${rand}`
}

/* ==========================================================================
   PUBLIC CONTROLLERS
   ========================================================================== */

export async function getPublicChallenge(req, res) {
    try {
        const { slug } = req.params

        const [challenges] = await pool.query(
            'SELECT `id`, `title`, `slug`, `subtitle`, `description`, `status`, `start_date`, `end_date` FROM `film_challenges` WHERE `slug` = ? AND `status` = "published" LIMIT 1',
            [slug]
        )

        if (challenges.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Challenge tidak ditemukan atau pendaftaran telah ditutup.'
            })
        }

        const challenge = challenges[0]

        // Fetch active videos
        const [videos] = await pool.query(`
            SELECT \`id\`, \`video_order\`, \`title\`, \`youtube_url\`, \`youtube_video_id\`, \`instructions\`
            FROM \`challenge_videos\`
            WHERE \`challenge_id\` = ? AND \`is_active\` = 1
            ORDER BY \`video_order\` ASC
        `, [challenge.id])

        // Fetch active questions
        const [rawQuestions] = await pool.query(`
            SELECT \`id\`, \`video_id\`, \`category\`, \`question_text\`, \`answer_type\`, \`options\`, \`question_order\`
            FROM \`challenge_questions\`
            WHERE \`challenge_id\` = ? AND \`is_active\` = 1
            ORDER BY \`question_order\` ASC, \`created_at\` ASC
        `, [challenge.id])

        const questions = rawQuestions.map(q => {
            let options = q.options
            if (typeof options === 'string') {
                try {
                    options = JSON.parse(options)
                } catch {
                    options = []
                }
            }
            return {
                ...q,
                options: options || []
            }
        })

        return res.json({
            success: true,
            data: {
                challenge,
                videos,
                questions
            }
        })
    } catch (error) {
        console.error('getPublicChallenge error:', error)
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server saat memuat data challenge.'
        })
    }
}

export async function submitChallenge(req, res) {
    try {
        const { slug } = req.params
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'

        // Rate limit check
        if (!checkRateLimit(clientIp)) {
            return res.status(429).json({
                success: false,
                message: 'Terlalu banyak permintaan pengiriman dari perangkat Anda. Silakan coba lagi setelah 15 menit.'
            })
        }

        // Honeypot spam check
        if (req.body.website || req.body._hp) {
            return res.status(400).json({
                success: false,
                message: 'Pengiriman ditolak sebagai indikasi spam.'
            })
        }

        const {
            full_name,
            email,
            whatsapp,
            institution,
            province,
            age_range,
            organization_role,
            data_consent,
            experience_skills,
            portfolio_url,
            motivation,
            interests,
            answers
        } = req.body

        // Basic validations
        if (!full_name || full_name.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Nama lengkap wajib diisi.' })
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: 'Format alamat email tidak valid.' })
        }
        if (!whatsapp || whatsapp.trim().length < 8) {
            return res.status(400).json({ success: false, message: 'Nomor WhatsApp wajib diisi minimal 8 digit.' })
        }
        if (!institution || institution.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Asal sekolah / kampus / komunitas wajib diisi.' })
        }
        if (!province) {
            return res.status(400).json({ success: false, message: 'Provinsi wajib dipilih.' })
        }
        if (!age_range) {
            return res.status(400).json({ success: false, message: 'Rentang usia wajib dipilih.' })
        }
        if (!data_consent) {
            return res.status(400).json({ success: false, message: 'Persetujuan data wajib dicentang.' })
        }
        if (!Array.isArray(interests) || interests.length === 0 || interests.length > 3) {
            return res.status(400).json({ success: false, message: 'Pilih minimal 1 dan maksimal 3 bidang minat perfilman.' })
        }

        // Verify challenge exists and is open
        const [challenges] = await pool.query(
            'SELECT `id`, `status` FROM `film_challenges` WHERE `slug` = ? AND `status` = "published" LIMIT 1',
            [slug]
        )

        if (challenges.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Challenge tidak aktif atau pendaftaran telah ditutup.'
            })
        }

        const challengeId = challenges[0].id
        const submissionId = crypto.randomUUID()
        const regNumber = generateRegNumber()

        // Begin transaction
        const connection = await pool.getConnection()
        await connection.beginTransaction()

        try {
            // 1. Insert submission
            await connection.query(`
                INSERT INTO \`challenge_submissions\` (
                    \`id\`, \`challenge_id\`, \`registration_number\`, \`full_name\`, \`email\`,
                    \`whatsapp\`, \`institution\`, \`province\`, \`age_range\`, \`organization_role\`,
                    \`data_consent\`, \`experience_skills\`, \`portfolio_url\`, \`motivation\`, \`review_status\`
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                submissionId,
                challengeId,
                regNumber,
                full_name.trim(),
                email.trim().toLowerCase(),
                whatsapp.trim(),
                institution.trim(),
                province,
                age_range,
                organization_role ? organization_role.trim() : null,
                data_consent ? 1 : 0,
                experience_skills ? experience_skills.trim() : null,
                portfolio_url ? portfolio_url.trim() : null,
                motivation ? motivation.trim() : null,
                'submitted'
            ])

            // 2. Insert interests (up to 3)
            for (const interest of interests) {
                if (interest && interest.trim()) {
                    await connection.query(`
                        INSERT INTO \`challenge_submission_interests\` (\`id\`, \`submission_id\`, \`interest_name\`)
                        VALUES (?, ?, ?)
                    `, [crypto.randomUUID(), submissionId, interest.trim()])
                }
            }

            // 3. Insert answers
            if (Array.isArray(answers)) {
                for (const item of answers) {
                    if (item.question_id && item.answer_text !== undefined && item.answer_text !== null) {
                        const ansStr = Array.isArray(item.answer_text) 
                            ? JSON.stringify(item.answer_text) 
                            : String(item.answer_text)

                        if (ansStr.trim()) {
                            await connection.query(`
                                INSERT INTO \`challenge_answers\` (\`id\`, \`submission_id\`, \`question_id\`, \`answer_text\`)
                                VALUES (?, ?, ?, ?)
                            `, [crypto.randomUUID(), submissionId, item.question_id, ansStr.trim()])
                        }
                    }
                }
            }

            await connection.commit()
            connection.release()

            return res.status(201).json({
                success: true,
                data: {
                    registration_number: regNumber,
                    full_name,
                    email,
                    submitted_at: new Date().toISOString()
                }
            })
        } catch (dbErr) {
            await connection.rollback()
            connection.release()
            throw dbErr
        }
    } catch (error) {
        console.error('submitChallenge error:', error)
        return res.status(500).json({
            success: false,
            message: 'Gagal mengirimkan jawaban challenge: ' + error.message
        })
    }
}

/* ==========================================================================
   ADMIN CONTROLLERS (PROTECTED)
   ========================================================================== */

// 1. Challenges List & Details
export async function getAdminChallenges(req, res) {
    try {
        const [rows] = await pool.query(`
            SELECT 
                c.*,
                (SELECT COUNT(*) FROM challenge_videos WHERE challenge_id = c.id) as total_videos,
                (SELECT COUNT(*) FROM challenge_questions WHERE challenge_id = c.id) as total_questions,
                (SELECT COUNT(*) FROM challenge_submissions WHERE challenge_id = c.id) as total_submissions
            FROM film_challenges c
            ORDER BY c.created_at DESC
        `)

        return res.json({
            success: true,
            data: rows
        })
    } catch (error) {
        console.error('getAdminChallenges error:', error)
        return res.status(500).json({ success: false, message: error.message })
    }
}

export async function getAdminChallengeDetail(req, res) {
    try {
        const { id } = req.params

        const [challenges] = await pool.query('SELECT * FROM film_challenges WHERE id = ?', [id])
        if (challenges.length === 0) {
            return res.status(404).json({ success: false, message: 'Challenge tidak ditemukan.' })
        }

        const [videos] = await pool.query(
            'SELECT * FROM challenge_videos WHERE challenge_id = ? ORDER BY video_order ASC',
            [id]
        )

        const [questions] = await pool.query(
            'SELECT * FROM challenge_questions WHERE challenge_id = ? ORDER BY question_order ASC, created_at ASC',
            [id]
        )

        const formattedQuestions = questions.map(q => ({
            ...q,
            options: typeof q.options === 'string' ? JSON.parse(q.options || '[]') : (q.options || [])
        }))

        return res.json({
            success: true,
            data: {
                challenge: challenges[0],
                videos,
                questions: formattedQuestions
            }
        })
    } catch (error) {
        console.error('getAdminChallengeDetail error:', error)
        return res.status(500).json({ success: false, message: error.message })
    }
}

export async function createAdminChallenge(req, res) {
    try {
        const { title, slug, subtitle, description, status, start_date, end_date } = req.body
        if (!title || !slug) {
            return res.status(400).json({ success: false, message: 'Judul dan slug challenge wajib diisi.' })
        }

        const id = crypto.randomUUID()
        await pool.query(`
            INSERT INTO film_challenges (id, title, slug, subtitle, description, status, start_date, end_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id,
            title,
            slug,
            subtitle || 'Kinarya Coop',
            description || null,
            status || 'draft',
            start_date || null,
            end_date || null
        ])

        const [created] = await pool.query('SELECT * FROM film_challenges WHERE id = ?', [id])
        return res.status(201).json({ success: true, data: created[0] })
    } catch (error) {
        console.error('createAdminChallenge error:', error)
        return res.status(500).json({ success: false, message: error.message })
    }
}

export async function updateAdminChallenge(req, res) {
    try {
        const { id } = req.params
        const { title, slug, subtitle, description, status, start_date, end_date } = req.body

        await pool.query(`
            UPDATE film_challenges SET
                title = COALESCE(?, title),
                slug = COALESCE(?, slug),
                subtitle = COALESCE(?, subtitle),
                description = COALESCE(?, description),
                status = COALESCE(?, status),
                start_date = ?,
                end_date = ?
            WHERE id = ?
        `, [
            title,
            slug,
            subtitle,
            description,
            status,
            start_date || null,
            end_date || null,
            id
        ])

        const [updated] = await pool.query('SELECT * FROM film_challenges WHERE id = ?', [id])
        return res.json({ success: true, data: updated[0] })
    } catch (error) {
        console.error('updateAdminChallenge error:', error)
        return res.status(500).json({ success: false, message: error.message })
    }
}

export async function deleteAdminChallenge(req, res) {
    try {
        const { id } = req.params
        await pool.query('DELETE FROM film_challenges WHERE id = ?', [id])
        return res.json({ success: true, message: 'Challenge berhasil dihapus.' })
    } catch (error) {
        console.error('deleteAdminChallenge error:', error)
        return res.status(500).json({ success: false, message: error.message })
    }
}

// 2. Video Management
export async function addAdminVideo(req, res) {
    try {
        const { id: challengeId } = req.params
        const { title, youtube_url, instructions, video_order = 1, is_active = 1 } = req.body

        if (!title || !youtube_url) {
            return res.status(400).json({ success: false, message: 'Judul dan URL YouTube wajib diisi.' })
        }

        const videoId = crypto.randomUUID()
        const youtubeVideoId = extractYouTubeId(youtube_url)

        await pool.query(`
            INSERT INTO challenge_videos (id, challenge_id, video_order, title, youtube_url, youtube_video_id, instructions, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [videoId, challengeId, video_order, title, youtube_url, youtubeVideoId, instructions || null, is_active ? 1 : 0])

        const [created] = await pool.query('SELECT * FROM challenge_videos WHERE id = ?', [videoId])
        return res.status(201).json({ success: true, data: created[0] })
    } catch (error) {
        console.error('addAdminVideo error:', error)
        return res.status(500).json({ success: false, message: error.message })
    }
}

export async function updateAdminVideo(req, res) {
    try {
        const { videoId } = req.params
        const { title, youtube_url, instructions, video_order, is_active } = req.body

        const youtubeVideoId = youtube_url ? extractYouTubeId(youtube_url) : undefined

        await pool.query(`
            UPDATE challenge_videos SET
                title = COALESCE(?, title),
                youtube_url = COALESCE(?, youtube_url),
                youtube_video_id = COALESCE(?, youtube_video_id),
                instructions = COALESCE(?, instructions),
                video_order = COALESCE(?, video_order),
                is_active = COALESCE(?, is_active)
            WHERE id = ?
        `, [
            title,
            youtube_url,
            youtubeVideoId,
            instructions,
            video_order,
            is_active !== undefined ? (is_active ? 1 : 0) : null,
            videoId
        ])

        const [updated] = await pool.query('SELECT * FROM challenge_videos WHERE id = ?', [videoId])
        return res.json({ success: true, data: updated[0] })
    } catch (error) {
        console.error('updateAdminVideo error:', error)
        return res.status(500).json({ success: false, message: error.message })
    }
}

export async function deleteAdminVideo(req, res) {
    try {
        const { videoId } = req.params
        await pool.query('DELETE FROM challenge_videos WHERE id = ?', [videoId])
        return res.json({ success: true, message: 'Video berhasil dihapus.' })
    } catch (error) {
        console.error('deleteAdminVideo error:', error)
        return res.status(500).json({ success: false, message: error.message })
    }
}

// 3. Question Management
export async function addAdminQuestion(req, res) {
    try {
        const { videoId } = req.params
        const { category, question_text, answer_type = 'essay', options, question_order = 1, is_active = 1 } = req.body

        if (!category || !question_text) {
            return res.status(400).json({ success: false, message: 'Kategori dan pertanyaan wajib diisi.' })
        }

        // Get challenge_id from video
        const [videos] = await pool.query('SELECT challenge_id FROM challenge_videos WHERE id = ?', [videoId])
        if (videos.length === 0) {
            return res.status(404).json({ success: false, message: 'Video tidak ditemukan.' })
        }
        const challengeId = videos[0].challenge_id
        const qId = crypto.randomUUID()
        const optsJson = options ? (typeof options === 'string' ? options : JSON.stringify(options)) : null

        await pool.query(`
            INSERT INTO challenge_questions (id, challenge_id, video_id, category, question_text, answer_type, options, question_order, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [qId, challengeId, videoId, category, question_text, answer_type, optsJson, question_order, is_active ? 1 : 0])

        const [created] = await pool.query('SELECT * FROM challenge_questions WHERE id = ?', [qId])
        return res.status(201).json({
            success: true,
            data: {
                ...created[0],
                options: created[0].options ? JSON.parse(created[0].options) : []
            }
        })
    } catch (error) {
        console.error('addAdminQuestion error:', error)
        return res.status(500).json({ success: false, message: error.message })
    }
}

export async function updateAdminQuestion(req, res) {
    try {
        const { questionId } = req.params
        const { category, question_text, answer_type, options, question_order, is_active, video_id } = req.body

        const optsJson = options !== undefined 
            ? (typeof options === 'string' ? options : JSON.stringify(options)) 
            : null

        await pool.query(`
            UPDATE challenge_questions SET
                video_id = COALESCE(?, video_id),
                category = COALESCE(?, category),
                question_text = COALESCE(?, question_text),
                answer_type = COALESCE(?, answer_type),
                options = COALESCE(?, options),
                question_order = COALESCE(?, question_order),
                is_active = COALESCE(?, is_active)
            WHERE id = ?
        `, [
            video_id,
            category,
            question_text,
            answer_type,
            optsJson,
            question_order,
            is_active !== undefined ? (is_active ? 1 : 0) : null,
            questionId
        ])

        const [updated] = await pool.query('SELECT * FROM challenge_questions WHERE id = ?', [questionId])
        return res.json({
            success: true,
            data: {
                ...updated[0],
                options: updated[0].options ? JSON.parse(updated[0].options) : []
            }
        })
    } catch (error) {
        console.error('updateAdminQuestion error:', error)
        return res.status(500).json({ success: false, message: error.message })
    }
}

export async function deleteAdminQuestion(req, res) {
    try {
        const { questionId } = req.params
        await pool.query('DELETE FROM challenge_questions WHERE id = ?', [questionId])
        return res.json({ success: true, message: 'Pertanyaan berhasil dihapus.' })
    } catch (error) {
        console.error('deleteAdminQuestion error:', error)
        return res.status(500).json({ success: false, message: error.message })
    }
}

// 4. Submissions & Participant Management
export async function getAdminSubmissions(req, res) {
    try {
        const { id: challengeId } = req.params
        const {
            page = 1,
            limit = 10,
            search = '',
            province = '',
            status = '',
            start_date = '',
            end_date = ''
        } = req.query

        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10)
        let where = 'WHERE s.challenge_id = ?'
        const params = [challengeId]

        if (search) {
            where += ' AND (s.full_name LIKE ? OR s.email LIKE ? OR s.registration_number LIKE ? OR s.institution LIKE ?)'
            const q = `%${search.trim()}%`
            params.push(q, q, q, q)
        }

        if (province) {
            where += ' AND s.province = ?'
            params.push(province)
        }

        if (status) {
            where += ' AND s.review_status = ?'
            params.push(status)
        }

        if (start_date) {
            where += ' AND DATE(s.submitted_at) >= ?'
            params.push(start_date)
        }

        if (end_date) {
            where += ' AND DATE(s.submitted_at) <= ?'
            params.push(end_date)
        }

        // Count total
        const [countRows] = await pool.query(
            `SELECT COUNT(*) as total FROM challenge_submissions s ${where}`,
            params
        )
        const total = countRows[0].total

        // Fetch paginated
        const [rows] = await pool.query(`
            SELECT 
                s.id, s.challenge_id, s.registration_number, s.full_name, s.email, s.whatsapp,
                s.institution, s.province, s.age_range, s.organization_role, s.review_status,
                s.review_score, s.submitted_at,
                (SELECT GROUP_CONCAT(interest_name SEPARATOR ', ') FROM challenge_submission_interests WHERE submission_id = s.id) as interests_str,
                (SELECT COUNT(*) FROM challenge_answers WHERE submission_id = s.id) as total_answers
            FROM challenge_submissions s
            ${where}
            ORDER BY s.submitted_at DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit, 10), offset])

        return res.json({
            success: true,
            data: {
                submissions: rows,
                pagination: {
                    total,
                    page: parseInt(page, 10),
                    limit: parseInt(limit, 10),
                    totalPages: Math.ceil(total / parseInt(limit, 10))
                }
            }
        })
    } catch (error) {
        console.error('getAdminSubmissions error:', error)
        return res.status(500).json({ success: false, message: error.message })
    }
}

export async function getAdminSubmissionDetail(req, res) {
    try {
        const { submissionId } = req.params

        const [submissions] = await pool.query(
            'SELECT * FROM challenge_submissions WHERE id = ? LIMIT 1',
            [submissionId]
        )

        if (submissions.length === 0) {
            return res.status(404).json({ success: false, message: 'Submission tidak ditemukan.' })
        }

        const submission = submissions[0]

        // Fetch interests
        const [interests] = await pool.query(
            'SELECT interest_name FROM challenge_submission_interests WHERE submission_id = ?',
            [submissionId]
        )

        // Fetch answers joined with questions & videos
        const [answers] = await pool.query(`
            SELECT 
                a.id as answer_id, a.answer_text, a.created_at as answered_at,
                q.id as question_id, q.category, q.question_text, q.answer_type, q.options, q.question_order,
                v.id as video_id, v.video_order, v.title as video_title
            FROM challenge_answers a
            JOIN challenge_questions q ON a.question_id = q.id
            LEFT JOIN challenge_videos v ON q.video_id = v.id
            WHERE a.submission_id = ?
            ORDER BY v.video_order ASC, q.question_order ASC
        `, [submissionId])

        return res.json({
            success: true,
            data: {
                submission,
                interests: interests.map(i => i.interest_name),
                answers: answers.map(a => ({
                    ...a,
                    options: a.options ? (typeof a.options === 'string' ? JSON.parse(a.options) : a.options) : []
                }))
            }
        })
    } catch (error) {
        console.error('getAdminSubmissionDetail error:', error)
        return res.status(500).json({ success: false, message: error.message })
    }
}

export async function reviewAdminSubmission(req, res) {
    try {
        const { submissionId } = req.params
        const { review_status, reviewer_notes, review_score } = req.body

        await pool.query(`
            UPDATE challenge_submissions SET
                review_status = COALESCE(?, review_status),
                reviewer_notes = COALESCE(?, reviewer_notes),
                review_score = ?
            WHERE id = ?
        `, [
            review_status,
            reviewer_notes,
            review_score !== undefined ? review_score : null,
            submissionId
        ])

        const [updated] = await pool.query('SELECT * FROM challenge_submissions WHERE id = ?', [submissionId])
        return res.json({ success: true, data: updated[0] })
    } catch (error) {
        console.error('reviewAdminSubmission error:', error)
        return res.status(500).json({ success: false, message: error.message })
    }
}

export async function exportAdminSubmissionsCsv(req, res) {
    try {
        const { id: challengeId } = req.params

        const [rows] = await pool.query(`
            SELECT 
                s.registration_number, s.full_name, s.email, s.whatsapp,
                s.institution, s.province, s.age_range, s.organization_role,
                s.experience_skills, s.portfolio_url, s.motivation,
                s.review_status, s.review_score, s.reviewer_notes, s.submitted_at,
                (SELECT GROUP_CONCAT(interest_name SEPARATOR '; ') FROM challenge_submission_interests WHERE submission_id = s.id) as interests,
                (SELECT COUNT(*) FROM challenge_answers WHERE submission_id = s.id) as answered_count
            FROM challenge_submissions s
            WHERE s.challenge_id = ?
            ORDER BY s.submitted_at DESC
        `, [challengeId])

        // Build CSV
        const headers = [
            'Nomor Registrasi', 'Nama Lengkap', 'Email', 'WhatsApp', 'Institusi',
            'Provinsi', 'Rentang Usia', 'Peran Organisasi', 'Bidang Minat', 'Portfolio URL',
            'Status Penilaian', 'Skor', 'Catatan Reviewer', 'Tanggal Pengiriman', 'Pertanyaan Dijawab'
        ]

        let csv = '\uFEFF' + headers.join(',') + '\n'

        for (const r of rows) {
            const line = [
                `"${r.registration_number}"`,
                `"${(r.full_name || '').replace(/"/g, '""')}"`,
                `"${(r.email || '').replace(/"/g, '""')}"`,
                `"${r.whatsapp}"`,
                `"${(r.institution || '').replace(/"/g, '""')}"`,
                `"${r.province}"`,
                `"${r.age_range}"`,
                `"${(r.organization_role || '').replace(/"/g, '""')}"`,
                `"${(r.interests || '').replace(/"/g, '""')}"`,
                `"${(r.portfolio_url || '').replace(/"/g, '""')}"`,
                `"${r.review_status}"`,
                `"${r.review_score || ''}"`,
                `"${(r.reviewer_notes || '').replace(/"/g, '""')}"`,
                `"${r.submitted_at ? new Date(r.submitted_at).toISOString() : ''}"`,
                `"${r.answered_count}"`
            ]
            csv += line.join(',') + '\n'
        }

        res.setHeader('Content-Type', 'text/csv; charset=utf-8')
        res.setHeader('Content-Disposition', `attachment; filename="yukflix-challenge-submissions-${Date.now()}.csv"`)
        return res.send(csv)
    } catch (error) {
        console.error('exportAdminSubmissionsCsv error:', error)
        return res.status(500).json({ success: false, message: error.message })
    }
}

// 5. Dashboard Statistics
export async function getAdminChallengeStats(req, res) {
    try {
        const { id: challengeId } = req.params

        const [[{ totalSubmissions }]] = await pool.query(
            'SELECT COUNT(*) as totalSubmissions FROM challenge_submissions WHERE challenge_id = ?',
            [challengeId]
        )

        const [[{ unreviewed }]] = await pool.query(
            'SELECT COUNT(*) as unreviewed FROM challenge_submissions WHERE challenge_id = ? AND review_status = "submitted"',
            [challengeId]
        )

        const [[{ shortlisted }]] = await pool.query(
            'SELECT COUNT(*) as shortlisted FROM challenge_submissions WHERE challenge_id = ? AND review_status = "shortlisted"',
            [challengeId]
        )

        const [[{ underReview }]] = await pool.query(
            'SELECT COUNT(*) as underReview FROM challenge_submissions WHERE challenge_id = ? AND review_status = "under_review"',
            [challengeId]
        )

        // Count by province
        const [byProvince] = await pool.query(`
            SELECT province, COUNT(*) as count
            FROM challenge_submissions
            WHERE challenge_id = ?
            GROUP BY province
            ORDER BY count DESC
            LIMIT 10
        `, [challengeId])

        // Count by interest
        const [byInterest] = await pool.query(`
            SELECT csi.interest_name, COUNT(*) as count
            FROM challenge_submission_interests csi
            JOIN challenge_submissions cs ON csi.submission_id = cs.id
            WHERE cs.challenge_id = ?
            GROUP BY csi.interest_name
            ORDER BY count DESC
        `, [challengeId])

        return res.json({
            success: true,
            data: {
                totalSubmissions: Number(totalSubmissions || 0),
                unreviewed: Number(unreviewed || 0),
                shortlisted: Number(shortlisted || 0),
                underReview: Number(underReview || 0),
                byProvince,
                byInterest
            }
        })
    } catch (error) {
        console.error('getAdminChallengeStats error:', error)
        return res.status(500).json({ success: false, message: error.message })
    }
}

