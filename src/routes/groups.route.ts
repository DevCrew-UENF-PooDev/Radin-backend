import express from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { createGroup, getGroupMembers, joinInGroup, listAllGroups } from "../controllers/groups.controller";

const router = express.Router();

router.get("/", asyncHandler(listAllGroups));
router.post("/", asyncHandler(createGroup));
router.get("/:id/members", asyncHandler(getGroupMembers));
router.patch("/:id/join", asyncHandler(joinInGroup));

export default router;
