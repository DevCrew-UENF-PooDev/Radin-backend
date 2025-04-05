import express from "express";
import { createPrivateChat, listUserChats } from "../controllers/chats.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();

router.get("/", asyncHandler(listUserChats));
router.post("/private", asyncHandler(createPrivateChat));

export default router;
