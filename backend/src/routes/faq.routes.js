import { Router } from 'express'
import {
    getAll,
    getById,
    create,
    update,
    remove,
    addAnswer,
    updateAnswer,
    deleteAnswer
} from '../controllers/faq.controller.js'
import authenticate from '../middleware/auth.js'

const router = Router()

router.get('/', getAll)
router.get('/:id', getById)
router.post('/', authenticate, create)
router.put('/:id', authenticate, update)
router.delete('/:id', authenticate, remove)

router.post('/answers', authenticate, addAnswer)
router.put('/answers/:id', authenticate, updateAnswer)
router.delete('/answers/:id', authenticate, deleteAnswer)

export default router

