import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  togglePinAnnouncement,
  markAnnouncementRead,
  archiveAnnouncement
} from "../controllers/announcement.controller";

const router = Router();

router.use(authenticate);

router.get("/", getAnnouncements);
router.post("/", authorize("faculty", "hod", "department_admin", "college_admin", "super_admin", "admin"), createAnnouncement);
router.patch("/:id/pin", authorize("faculty", "hod", "department_admin", "college_admin", "super_admin", "admin"), togglePinAnnouncement);
router.post("/:id/read", markAnnouncementRead);
router.patch("/:id", authorize("faculty", "hod", "department_admin", "college_admin", "super_admin", "admin"), updateAnnouncement);
router.delete("/:id", authorize("faculty", "hod", "department_admin", "college_admin", "super_admin", "admin"), archiveAnnouncement);

export default router;
