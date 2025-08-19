import express from 'express';
import { AuthController } from '#controllers/authController';
import { authenticateToken } from '#middleware/auth';

const router = express.Router();

/**
 * @route GET /api/auth/google
 * @desc Get Google OAuth authorization URL
 * @access Public
 */
router.get('/google', AuthController.getAuthUrl);

/**
 * @route GET /api/auth/google/callback
 * @desc Handle Google OAuth callback
 * @access Public
 */
router.get('/google/callback', AuthController.googleCallback);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public (requires refresh token in cookie)
 */
router.post('/refresh', AuthController.refreshToken);

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Public
 */
router.post('/logout', AuthController.logout);

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', authenticateToken, AuthController.getMe);

export default router;