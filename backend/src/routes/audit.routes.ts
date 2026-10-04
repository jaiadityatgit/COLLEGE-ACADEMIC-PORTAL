import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { getAuditLogs } from "../controllers/audit.controller";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize("hod", "department_admin", "college_admin", "super_admin", "admin"),
  getAuditLogs
);

export default router;
