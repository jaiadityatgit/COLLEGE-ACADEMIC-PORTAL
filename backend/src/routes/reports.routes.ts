import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import {
  getAttendanceReport,
  getAssignmentsReport,
  getGradesReport
} from "../controllers/reports.controller";

const router = Router();

router.use(authenticate);
router.use(authorize("faculty", "hod", "department_admin", "college_admin", "super_admin", "admin"));

router.get("/attendance", getAttendanceReport);
router.get("/assignments", getAssignmentsReport);
router.get("/grades", getGradesReport);

export default router;
