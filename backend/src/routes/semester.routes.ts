import { Router } from "express";
import { 
  getSemesters, 
  getActiveSemester, 
  createSemester,
  activateSemester,
  closeSemester
} from "../controllers/semester.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", getSemesters);
router.get("/active", getActiveSemester);
router.post("/", authorize("hod", "department_admin", "college_admin", "super_admin"), createSemester);
router.patch("/:id/activate", authorize("hod", "department_admin", "college_admin", "super_admin"), activateSemester);
router.patch("/:id/close", authorize("hod", "department_admin", "college_admin", "super_admin"), closeSemester);

export default router;
