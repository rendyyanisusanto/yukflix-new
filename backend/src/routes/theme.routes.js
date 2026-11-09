import { Router } from 'express'
import { getAll, create, update, setActive, remove } from '../controllers/theme.controller.js'
import authenticate from '../middleware/auth.js'

const router = Router()

router.get('/', getAll)
router.post('/', authenticate, create)
router.put('/:id', authenticate, update)
router.post('/:id/activate', authenticate, setActive)
router.delete('/:id', authenticate, remove)

export default router

