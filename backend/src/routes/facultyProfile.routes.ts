import { Router } from "express";
import { getFacultyProfiles, getFacultyProfile } from "../controllers/facultyProfile.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", getFacultyProfiles);
router.get("/:userId", getFacultyProfile);

export default router;
