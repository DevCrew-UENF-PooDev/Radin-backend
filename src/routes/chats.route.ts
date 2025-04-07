import express from "express";
import { createPrivateChat, listUserChats, syncChats } from "../controllers/chats.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();

router.get("/", asyncHandler(listUserChats));
router.post("/private", asyncHandler(createPrivateChat));
router.post("/messages/sync-multiple", asyncHandler(syncChats));

export default router;
