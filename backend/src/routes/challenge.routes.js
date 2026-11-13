import { Router } from 'express'
import {
    getPublicChallenge,
    submitChallenge,
    getQuestionCategories,
    createQuestionCategory,
    updateQuestionCategory,
    deleteQuestionCategory,
    getAdminChallenges,
    getAdminChallengeDetail,
    createAdminChallenge,
    updateAdminChallenge,
    deleteAdminChallenge,
    addAdminVideo,
    updateAdminVideo,
    deleteAdminVideo,
    addAdminQuestion,
    updateAdminQuestion,
    deleteAdminQuestion,
    getAdminSubmissions,
    getAdminSubmissionDetail,
    reviewAdminSubmission,
    exportAdminSubmissionsCsv,
    getAdminChallengeStats
} from '../controllers/challenge.controller.js'
import authenticate from '../middleware/auth.js'

const router = Router()

/* ==========================================================================
   PUBLIC ROUTES (NO AUTH REQUIRED)
   ========================================================================== */
router.get('/public/categories', getQuestionCategories)
router.get('/public/:slug', getPublicChallenge)
router.post('/public/:slug/submit', submitChallenge)

/* ==========================================================================
   QUESTION CATEGORIES MASTER (READ PUBLIC/ADMIN, WRITE ADMIN)
   ========================================================================== */
router.get('/categories', getQuestionCategories)
router.post('/categories', authenticate, createQuestionCategory)
router.put('/categories/:id', authenticate, updateQuestionCategory)
router.delete('/categories/:id', authenticate, deleteQuestionCategory)

/* ==========================================================================
   ADMIN ROUTES (AUTH REQUIRED)
   ========================================================================== */
// Challenge CRUD
router.get('/', authenticate, getAdminChallenges)
router.get('/:id', authenticate, getAdminChallengeDetail)
router.post('/', authenticate, createAdminChallenge)
router.put('/:id', authenticate, updateAdminChallenge)
router.delete('/:id', authenticate, deleteAdminChallenge)

// Video CRUD
router.post('/:id/videos', authenticate, addAdminVideo)
router.put('/videos/:videoId', authenticate, updateAdminVideo)
router.delete('/videos/:videoId', authenticate, deleteAdminVideo)

// Question CRUD
router.post('/videos/:videoId/questions', authenticate, addAdminQuestion)
router.put('/questions/:questionId', authenticate, updateAdminQuestion)
router.delete('/questions/:questionId', authenticate, deleteAdminQuestion)

// Submissions & Review
router.get('/:id/submissions', authenticate, getAdminSubmissions)
router.get('/:id/submissions/export', authenticate, exportAdminSubmissionsCsv)
router.get('/submissions/:submissionId', authenticate, getAdminSubmissionDetail)
router.put('/submissions/:submissionId/review', authenticate, reviewAdminSubmission)

// Stats
router.get('/:id/stats', authenticate, getAdminChallengeStats)

export default router

