import express from 'express';
import { authenticateToken } from '#middleware/auth';
import { AuthController } from '#controllers/authController';

const router = express.Router();

router.get('/google', AuthController.getAuthUrl);
router.get('/me', authenticateToken, AuthController.getMe);
router.get('/google/callback', AuthController.googleCallback);
router.post('/refresh', AuthController.refreshToken);
router.post('/logout', AuthController.logout);

export default router;