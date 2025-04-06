import { Router } from 'express';
import { changeArtwork, login, logout, profile, register } from '../controllers/auth.controller';
import { asyncHandler } from '../utils/asyncHandler'
const router = Router();

router.post('/login', asyncHandler(login));
router.patch('/artwork', asyncHandler(changeArtwork));
router.post('/register', asyncHandler(register));
router.post('/logout', asyncHandler(logout));
router.get('/me', asyncHandler(profile));

export default router;
