import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { 
  getCourses, 
  getCourseById,
  createCourse,
  getCourseStudents,
  getCourseFaculty,
  enrollStudent,
  removeStudent,
  assignFaculty
} from "../controllers/course.controller";

const router = Router();

router.use(authenticate);

router.get("/", getCourses);
router.post("/", authorize("faculty", "hod", "department_admin", "college_admin", "super_admin", "admin"), createCourse);
router.get("/:courseId", getCourseById);

// Enrollment routes
router.get("/:courseId/students", getCourseStudents);
router.get("/:courseId/faculty", getCourseFaculty);
router.post("/:courseId/enroll", authorize("hod", "department_admin", "college_admin", "super_admin", "admin"), enrollStudent);
router.delete("/:courseId/enroll/:studentId", authorize("hod", "department_admin", "college_admin", "super_admin", "admin"), removeStudent);
router.patch("/:courseId/faculty", authorize("hod", "department_admin", "college_admin", "super_admin", "admin"), assignFaculty);

export default router;
