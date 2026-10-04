import { Router } from "express";
import { authenticate as authMiddleware, authorize } from "../middleware/auth";
import { 
  getExams, 
  createExam, 
  updateExam, 
  deleteExam 
} from "../controllers/exam.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", getExams);
router.post("/", authorize("faculty", "hod", "department_admin", "college_admin", "super_admin", "admin"), createExam);
router.patch("/:id", authorize("faculty", "hod", "department_admin", "college_admin", "super_admin", "admin"), updateExam);
router.delete("/:id", authorize("faculty", "hod", "department_admin", "college_admin", "super_admin", "admin"), deleteExam);

export default router;
