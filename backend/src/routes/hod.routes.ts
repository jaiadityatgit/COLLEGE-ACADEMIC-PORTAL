import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import {
  getDashboardOverview,
  getFacultyDirectory,
  getStudentAnalytics,
  getCourseAnalytics,
  getLabManagement,
  getApprovalQueue,
  processApproval,
  generateReport
} from "../controllers/hod.controller";

const router = Router();

router.use(authenticate);
router.use(authorize("hod", "department_admin", "college_admin", "super_admin"));

router.get("/dashboard", getDashboardOverview);
router.get("/faculty", getFacultyDirectory);
router.get("/student-analytics", getStudentAnalytics);
router.get("/course-analytics", getCourseAnalytics);
router.get("/labs", getLabManagement);
router.get("/approvals", getApprovalQueue);
router.post("/approvals/:id", processApproval);
router.get("/reports", generateReport);

export default router;
