import { Router } from "express";
import { uploadSource, listSources, deleteSource, downloadSource } from "../controllers/source.controller";
import { authenticate } from "../middleware/auth";
import multer from "multer";

import fs from "fs";

const uploadDir = process.env.UPLOAD_PATH || "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (_, file, cb) => {
    const allowedMimeTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-powerpoint",
      "application/x-mspowerpoint",
    ];
    const ext = file.originalname.split(".").pop()?.toLowerCase();
    const isAllowedExt = ext === "pdf" || ext === "docx" || ext === "pptx" || ext === "ppt";
    cb(null, allowedMimeTypes.includes(file.mimetype) || isAllowedExt);
  },
});

const router = Router();

router.use(authenticate);
router.post("/upload", upload.single("file"), uploadSource);
router.get("/course/:courseId", listSources);
router.get("/subject/:notebookId", listSources); // Legacy backward-compatibility route
router.get("/:id/download", downloadSource);
router.delete("/:id", deleteSource);

export default router;
