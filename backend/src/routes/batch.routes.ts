import { Router } from "express";
import { getBatches, createBatch } from "../controllers/batch.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", getBatches);
router.post("/", authorize("hod", "department_admin", "college_admin", "super_admin"), createBatch);

export default router;
