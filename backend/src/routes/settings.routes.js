import { Router } from 'express'
import { getAll, upsert } from '../controllers/settings.controller.js'
import authenticate from '../middleware/auth.js'

const router = Router()

router.get('/', getAll)
router.post('/', authenticate, upsert)
router.put('/', authenticate, upsert)

export default router

