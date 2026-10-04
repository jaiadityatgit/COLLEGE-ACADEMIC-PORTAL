import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { 
  createDepartment, 
  getDepartments, 
  updateDepartment, 
  archiveDepartment, 
  getDepartmentCourses, 
  assignCourseToDepartment,
  getMyDepartment
} from "../controllers/department.controller";

const router = Router();

router.use(authenticate);

router.get("/mine", getMyDepartment);
router.get("/", getDepartments);
router.post("/", authorize("college_admin", "super_admin", "admin"), createDepartment);
router.patch("/:id", authorize("college_admin", "super_admin", "admin"), updateDepartment);
router.delete("/:id", authorize("college_admin", "super_admin", "admin"), archiveDepartment);
router.get("/:id/courses", getDepartmentCourses);
router.post("/:id/courses", authorize("college_admin", "super_admin", "admin"), assignCourseToDepartment);

export default router;
