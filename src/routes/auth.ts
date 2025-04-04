import { Router } from 'express';
import { login, register } from '../controllers/authController';
import { asyncHandler } from '../utils/asyncHandler'
const router = Router();

router.post('/login', asyncHandler(login));
router.post('/register', asyncHandler(register));
// router.get('/me', asyncHandler(profile));

export default router;
