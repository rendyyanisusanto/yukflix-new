import { Router } from 'express'
import { uploadMiddleware, handleUpload } from '../controllers/upload.controller.js'
import authenticate from '../middleware/auth.js'

const router = Router()

router.post('/', authenticate, uploadMiddleware.single('file'), handleUpload)

export default router

