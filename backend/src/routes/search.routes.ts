import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { globalSearch } from "../controllers/search.controller";

const router = Router();

router.post("/", authenticate, globalSearch);

export default router;
