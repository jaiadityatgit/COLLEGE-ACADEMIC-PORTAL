import { Router } from "express";
import { 
  getAttendance, 
  markAttendance, 
  markBulkAttendance, 
  updateAttendance, 
  deleteAttendance, 
  getAttendanceSummary 
} from "../controllers/attendance.controller";
import { authenticate as authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/", getAttendance);
router.post("/", markAttendance);
router.post("/bulk", markBulkAttendance);
router.get("/summary", getAttendanceSummary);
router.patch("/:id", updateAttendance);
router.delete("/:id", deleteAttendance);

export default router;
