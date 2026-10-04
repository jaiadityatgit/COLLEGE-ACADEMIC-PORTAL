import { Router } from "express";
import { authenticate as authMiddleware, authorize } from "../middleware/auth";
import { 
  getEvents, 
  createEvent, 
  updateEvent, 
  deleteEvent 
} from "../controllers/calendar.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", getEvents);
router.post("/", authorize("faculty", "hod", "department_admin", "college_admin", "super_admin", "admin"), createEvent);
router.patch("/:id", authorize("faculty", "hod", "department_admin", "college_admin", "super_admin", "admin"), updateEvent);
router.delete("/:id", authorize("faculty", "hod", "department_admin", "college_admin", "super_admin", "admin"), deleteEvent);

export default router;
