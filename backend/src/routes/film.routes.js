import { Router } from 'express'
import {
    getAll,
    getById,
    getBySlug,
    create,
    update,
    remove,
    addBTS,
    deleteBTS
} from '../controllers/film.controller.js'
import authenticate from '../middleware/auth.js'

const router = Router()

// Public read routes
router.get('/', getAll)
router.get('/slug/:slug', getBySlug)
router.get('/:id', getById)

// Protected mutation routes
router.post('/', authenticate, create)
router.put('/:id', authenticate, update)
router.delete('/:id', authenticate, remove)

// BTS routes
router.post('/bts', authenticate, addBTS)
router.delete('/bts/:id', authenticate, deleteBTS)

export default router

