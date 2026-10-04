import { Router } from "express";
import {
  getProfile,
  updateProfile,
  getUsers,
  createUser,
  createStudent,
  bulkValidateStudents,
  bulkImportStudents,
  createFaculty,
  getRecentActivity
} from "../controllers/user.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/activity", getRecentActivity);
router.get("/me", getProfile);
router.patch("/me", updateProfile);

// Admin & HOD user querying
router.get("/", authorize("college_admin", "super_admin", "hod", "department_admin"), getUsers);
router.post("/", authorize("college_admin", "super_admin"), createUser);

// Student account provisioning
router.post("/students", authorize("college_admin", "super_admin", "hod", "department_admin"), createStudent);
router.post("/students/bulk-validate", authorize("college_admin", "super_admin", "hod", "department_admin"), bulkValidateStudents);
router.post("/students/bulk-import", authorize("college_admin", "super_admin", "hod", "department_admin"), bulkImportStudents);

// Faculty provisioning
router.post("/faculty", authorize("college_admin", "super_admin"), createFaculty);

export default router;
