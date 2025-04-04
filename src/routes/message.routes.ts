import { Router } from 'express';
import { sendMessage } from '../controllers/messages.controller';
import dotenv from 'dotenv';
import { asyncHandler } from '../utils/asyncHandler';

dotenv.config();

const router = Router();

router.post('/', asyncHandler(sendMessage));

export default router;
