import express from "express";
import { listUserChats } from "../controllers/chats.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();

router.get("/", asyncHandler(listUserChats));

export default router;
