import express from "express";
import { getAllUsers, searchUsers } from "../controllers/users.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();

router.get("/search", asyncHandler(searchUsers));
router.get("/all", asyncHandler(getAllUsers));

export default router;
