import { Router } from "express";
import {
  createTeachingAssignment,
  getTeachingAssignments,
  deleteTeachingAssignment,
  getMyTeachingContexts,
  getContextStudents
} from "../controllers/teachingAssignment.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.use(authenticate);

// Faculty personal teaching contexts
router.get("/my-contexts", getMyTeachingContexts);

// Context-scoped students for faculty/admin/HOD
router.get("/context-students", getContextStudents);

// Teaching assignment management (Admin / HOD)
router.get("/", authorize("college_admin", "super_admin", "hod", "department_admin", "faculty"), getTeachingAssignments);
router.post("/", authorize("college_admin", "super_admin", "hod", "department_admin"), createTeachingAssignment);
router.delete("/:id", authorize("college_admin", "super_admin", "hod", "department_admin"), deleteTeachingAssignment);

export default router;
