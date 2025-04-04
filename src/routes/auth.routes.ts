import { Router } from 'express';
import { login, logout, profile, register } from '../controllers/auth.controller';
import { asyncHandler } from '../utils/asyncHandler'
const router = Router();

router.post('/login', asyncHandler(login));
router.post('/register', asyncHandler(register));
router.post('/logout', asyncHandler(logout));
router.get('/me', asyncHandler(profile));

export default router;
