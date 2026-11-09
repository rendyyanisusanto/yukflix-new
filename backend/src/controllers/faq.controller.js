import crypto from 'crypto'
import pool from '../config/db.js'

async function attachAnswers(faqs) {
    if (!faqs || faqs.length === 0) return []

    const faqIds = faqs.map(f => f.id)
    const placeholders = faqIds.map(() => '?').join(',')

    const [answers] = await pool.query(`
        SELECT * FROM \`faq_answers\`
        WHERE \`faq_id\` IN (${placeholders})
        ORDER BY \`sort_order\` ASC, \`created_at\` ASC
    `, faqIds)

    const map = {}
    for (const ans of answers) {
        if (!map[ans.faq_id]) map[ans.faq_id] = []
        map[ans.faq_id].push(ans)
    }

    return faqs.map(f => ({
        ...f,
        is_active: Boolean(f.is_active),
        faq_answers: map[f.id] || []
    }))
}

export async function getAll(req, res) {
    try {
        const [rows] = await pool.query('SELECT * FROM `faqs` ORDER BY `sort_order` ASC, `created_at` DESC')
        const result = await attachAnswers(rows)
        return res.json({
            success: true,
            data: result
        })
    } catch (error) {
        console.error('Get FAQs error:', error)
        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil data FAQ: ' + error.message
        })
    }
}

export async function getById(req, res) {
    try {
        const { id } = req.params
        const [rows] = await pool.query('SELECT * FROM `faqs` WHERE `id` = ? LIMIT 1', [id])

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'FAQ tidak ditemukan.'
            })
        }

        const result = await attachAnswers(rows)
        return res.json({
            success: true,
            data: result[0]
        })
    } catch (error) {
        console.error('Get FAQ by id error:', error)
        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil FAQ: ' + error.message
        })
    }
}

export async function create(req, res) {
    try {
        const { question, sort_order = 0, is_active = true, answers } = req.body

        if (!question) {
            return res.status(400).json({
                success: false,
                message: 'Pertanyaan wajib diisi.'
            })
        }

        const id = crypto.randomUUID()
        await pool.query(
            'INSERT INTO `faqs` (`id`, `question`, `sort_order`, `is_active`) VALUES (?, ?, ?, ?)',
            [id, question, sort_order, is_active ? 1 : 0]
        )

        // If answers are passed as array of strings
        if (Array.isArray(answers) && answers.length > 0) {
            for (let i = 0; i < answers.length; i++) {
                const ans = typeof answers[i] === 'string' ? answers[i] : answers[i].answer
                if (ans && ans.trim()) {
                    await pool.query(
                        'INSERT INTO `faq_answers` (`id`, `faq_id`, `answer`, `sort_order`) VALUES (?, ?, ?, ?)',
                        [crypto.randomUUID(), id, ans, i]
                    )
                }
            }
        }

        const [created] = await pool.query('SELECT * FROM `faqs` WHERE `id` = ?', [id])
        const result = await attachAnswers(created)

        return res.status(201).json({
            success: true,
            data: result[0]
        })
    } catch (error) {
        console.error('Create FAQ error:', error)
        return res.status(500).json({
            success: false,
            message: 'Gagal membuat FAQ: ' + error.message
        })
    }
}

export async function update(req, res) {
    try {
        const { id } = req.params
        const { question, sort_order, is_active, answers } = req.body

        await pool.query(`
            UPDATE \`faqs\` SET
                \`question\` = COALESCE(?, \`question\`),
                \`sort_order\` = COALESCE(?, \`sort_order\`),
                \`is_active\` = ?
            WHERE \`id\` = ?
        `, [
            question,
            sort_order !== undefined ? sort_order : null,
            is_active !== undefined ? (is_active ? 1 : 0) : 1,
            id
        ])

        // If answers provided, replace existing answers
        if (Array.isArray(answers)) {
            await pool.query('DELETE FROM `faq_answers` WHERE `faq_id` = ?', [id])
            for (let i = 0; i < answers.length; i++) {
                const ans = typeof answers[i] === 'string' ? answers[i] : answers[i].answer
                if (ans && ans.trim()) {
                    await pool.query(
                        'INSERT INTO `faq_answers` (`id`, `faq_id`, `answer`, `sort_order`) VALUES (?, ?, ?, ?)',
                        [crypto.randomUUID(), id, ans, i]
                    )
                }
            }
        }

        const [updated] = await pool.query('SELECT * FROM `faqs` WHERE `id` = ?', [id])
        if (updated.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'FAQ tidak ditemukan.'
            })
        }

        const result = await attachAnswers(updated)
        return res.json({
            success: true,
            data: result[0]
        })
    } catch (error) {
        console.error('Update FAQ error:', error)
        return res.status(500).json({
            success: false,
            message: 'Gagal memperbarui FAQ: ' + error.message
        })
    }
}

export async function remove(req, res) {
    try {
        const { id } = req.params
        await pool.query('DELETE FROM `faqs` WHERE `id` = ?', [id])
        return res.json({
            success: true,
            message: 'FAQ berhasil dihapus.'
        })
    } catch (error) {
        console.error('Delete FAQ error:', error)
        return res.status(500).json({
            success: false,
            message: 'Gagal menghapus FAQ: ' + error.message
        })
    }
}

// Answer endpoints
export async function addAnswer(req, res) {
    try {
        const { faq_id, answer, sort_order = 0 } = req.body
        const id = crypto.randomUUID()

        await pool.query(
            'INSERT INTO `faq_answers` (`id`, `faq_id`, `answer`, `sort_order`) VALUES (?, ?, ?, ?)',
            [id, faq_id, answer, sort_order]
        )

        const [created] = await pool.query('SELECT * FROM `faq_answers` WHERE `id` = ?', [id])
        return res.status(201).json({
            success: true,
            data: created[0]
        })
    } catch (error) {
        console.error('Add answer error:', error)
        return res.status(500).json({
            success: false,
            message: 'Gagal menambah jawaban: ' + error.message
        })
    }
}

export async function updateAnswer(req, res) {
    try {
        const { id } = req.params
        const { answer, sort_order } = req.body

        await pool.query(`
            UPDATE \`faq_answers\` SET
                \`answer\` = COALESCE(?, \`answer\`),
                \`sort_order\` = COALESCE(?, \`sort_order\`)
            WHERE \`id\` = ?
        `, [answer, sort_order !== undefined ? sort_order : null, id])

        const [updated] = await pool.query('SELECT * FROM `faq_answers` WHERE `id` = ?', [id])
        return res.json({
            success: true,
            data: updated[0]
        })
    } catch (error) {
        console.error('Update answer error:', error)
        return res.status(500).json({
            success: false,
            message: 'Gagal memperbarui jawaban: ' + error.message
        })
    }
}

export async function deleteAnswer(req, res) {
    try {
        const { id } = req.params
        await pool.query('DELETE FROM `faq_answers` WHERE `id` = ?', [id])
        return res.json({
            success: true,
            message: 'Jawaban berhasil dihapus.'
        })
    } catch (error) {
        console.error('Delete answer error:', error)
        return res.status(500).json({
            success: false,
            message: 'Gagal menghapus jawaban: ' + error.message
        })
    }
}

