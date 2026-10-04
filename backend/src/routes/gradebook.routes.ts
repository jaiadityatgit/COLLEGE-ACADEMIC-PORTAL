import { Router } from "express";
import { authenticate as authMiddleware } from "../middleware/auth";
import { 
  getGrades, 
  addGrade, 
  addBulkGrades,
  updateGrade, 
  deleteGrade,
  getResults
} from "../controllers/gradebook.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", getGrades);
router.post("/", addGrade);
router.post("/bulk", addBulkGrades);
router.get("/results", getResults);
router.patch("/:id", updateGrade);
router.delete("/:id", deleteGrade);

export default router;
