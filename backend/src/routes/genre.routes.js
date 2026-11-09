import { Router } from 'express'
import { getAll, getById, create, update, remove } from '../controllers/genre.controller.js'
import authenticate from '../middleware/auth.js'

const router = Router()

router.get('/', getAll)
router.get('/:id', getById)
router.post('/', authenticate, create)
router.put('/:id', authenticate, update)
router.delete('/:id', authenticate, remove)

export default router

