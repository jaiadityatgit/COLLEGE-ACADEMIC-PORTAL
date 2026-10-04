import { Router } from "express";
import { getLabs, createLab } from "../controllers/lab.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", getLabs);
router.post("/", authorize("hod", "department_admin", "college_admin", "super_admin"), createLab);

export default router;
