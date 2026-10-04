import { Router } from "express";
import {
  getHierarchy,
  createAcademicYear,
  transitionSemester
} from "../controllers/academicStructure.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.use(authenticate);

// Hierarchy tree endpoint (accessible to Admin, HOD, Faculty, Student)
router.get("/hierarchy", getHierarchy);

// Admin-only structural changes
router.post("/academic-years", authorize("college_admin", "super_admin"), createAcademicYear);
router.post("/transition-semester", authorize("college_admin", "super_admin", "hod", "department_admin"), transitionSemester);

export default router;
