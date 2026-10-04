import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import multer from "multer";
import fs from "fs";
import {
  createAssignment,
  getAssignments,
  updateAssignment,
  deleteAssignment,
  duplicateAssignment,
  submitAssignment,
  getSubmissions,
  gradeSubmission,
  getMySubmissions,
  uploadAttachment,
  uploadSubmissionFile,
  downloadAssignmentFile
} from "../controllers/assignment.controller";

const assignmentUploadDir = process.env.ASSIGNMENT_UPLOAD_PATH || "./uploads/assignments";
if (!fs.existsSync(assignmentUploadDir)) {
  fs.mkdirSync(assignmentUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: assignmentUploadDir,
  filename: (_, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const assignmentFileFilter = (_: any, file: Express.Multer.File, cb: any) => {
  const allowedMimes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-powerpoint",
  ];
  const ext = file.originalname.split(".").pop()?.toLowerCase() || "";
  const allowedExts = ["pdf", "docx", "doc", "pptx", "ppt"];
  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid assignment file type. Only PDF, DOCX, and PPTX files are allowed."));
  }
};

const submissionFileFilter = (_: any, file: Express.Multer.File, cb: any) => {
  const allowedMimes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-powerpoint",
    "application/zip",
    "application/x-zip-compressed"
  ];
  const ext = file.originalname.split(".").pop()?.toLowerCase() || "";
  const allowedExts = ["pdf", "docx", "doc", "pptx", "ppt", "zip"];
  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid submission file type. Only PDF, DOCX, PPTX, and ZIP files are allowed."));
  }
};

const uploadAttachmentMulter = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: assignmentFileFilter
});

const uploadSubmissionMulter = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: submissionFileFilter
});

const router = Router();

router.use(authenticate);

// Student routes
router.get("/my-submissions", authorize("student", "admin"), getMySubmissions);
router.post("/:id/submit", authorize("student", "admin"), submitAssignment);
router.post("/upload-submission-file", authorize("student", "admin"), uploadSubmissionMulter.single("file"), uploadSubmissionFile);

// Faculty / Management assignment operations
router.post("/", authorize("faculty", "hod", "admin"), createAssignment);
router.post("/upload-attachment", authorize("faculty", "hod", "admin"), uploadAttachmentMulter.single("file"), uploadAttachment);
router.post("/:id/duplicate", authorize("faculty", "hod", "admin"), duplicateAssignment);
router.patch("/:id", authorize("faculty", "hod", "admin"), updateAssignment);
router.delete("/:id", authorize("faculty", "hod", "admin"), deleteAssignment);
router.get("/:id/submissions", authorize("faculty", "hod", "admin"), getSubmissions);
router.patch("/submissions/:submissionId/grade", authorize("faculty", "hod", "admin"), gradeSubmission);

// Secure Download Endpoints
router.get("/attachments/download", downloadAssignmentFile);
router.get("/submission-files/download", downloadAssignmentFile);

// General assignment list
router.get("/", getAssignments);

export default router;


