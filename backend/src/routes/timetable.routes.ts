import { Router } from "express";
import { authenticate as authMiddleware } from "../middleware/auth";
import { 
  getTimetable, 
  createTimetable, 
  updateTimetable, 
  deleteTimetable 
} from "../controllers/timetable.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", getTimetable);
router.post("/", createTimetable);
router.patch("/:id", updateTimetable);
router.delete("/:id", deleteTimetable);

export default router;
