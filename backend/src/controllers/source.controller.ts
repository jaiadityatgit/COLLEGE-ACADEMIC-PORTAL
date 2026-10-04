import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import Source from "../models/Source.model";
import Course from "../models/Course.model";
import Notebook from "../models/Notebook.model";
import { getStorageService } from "../services/storageService";
import path from "path";
import fs from "fs";

/**
 * Upload a course material file (PDF, DOCX, PPT, PPTX).
 * File is persisted via configured storage provider (Local, R2, S3)
 * and a Source record is created immediately with status "ready".
 * Fully supports both courseId and legacy notebookId parameters.
 */
export async function uploadSource(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }
    if (!req.file) {
      res.status(400).json({ success: false, error: "No file provided" });
      return;
    }

    const { courseId, notebookId, category } = req.body;
    if (!courseId && !notebookId) {
      res.status(400).json({ success: false, error: "courseId or notebookId is required" });
      return;
    }

    let targetCourseId = courseId;
    let targetNotebookId = notebookId;

    // Resolve courseId from notebook if only notebookId is passed
    if (!targetCourseId && targetNotebookId) {
      const notebook = await Notebook.findOne({ _id: targetNotebookId, collegeId: req.user.collegeId });
      if (notebook && notebook.courseId) {
        targetCourseId = notebook.courseId.toString();
      }
    }

    // Resolve notebookId from course if only courseId is passed
    if (!targetNotebookId && targetCourseId) {
      const notebook = await Notebook.findOne({ courseId: targetCourseId, collegeId: req.user.collegeId });
      if (notebook) {
        targetNotebookId = notebook._id.toString();
      }
    }

    // Verify course exists
    if (targetCourseId) {
      const course = await Course.findOne({ _id: targetCourseId, collegeId: req.user.collegeId });
      if (!course) {
        res.status(404).json({ success: false, error: "Course not found or access denied" });
        return;
      }
      if (req.user.role === "student") {
        const isEnrolled = course.studentIds.some((sId) => sId.toString() === req.user!.id);
        if (!isEnrolled) {
          res.status(403).json({ success: false, error: "Unauthorized: Student is not enrolled in this course" });
          return;
        }
      }
    }

    const uploaderRole = req.user.role;
    const uploadedByRole: "faculty" | "student" =
      uploaderRole === "faculty" || uploaderRole === "college_admin" || uploaderRole === "super_admin"
        ? "faculty"
        : "student";

    const ext = req.file.originalname.split(".").pop()?.toLowerCase() || "";
    let fileType: "pdf" | "docx" | "pptx" | "ppt" = "pdf";
    if (ext === "docx") fileType = "docx";
    else if (ext === "pptx") fileType = "pptx";
    else if (ext === "ppt") fileType = "ppt";

    // Persist file via Storage Provider (Local, R2, S3)
    const storageService = getStorageService();
    const uploadResult = await storageService.uploadFile(req.file, "materials");

    const source = await Source.create({
      name: req.file.originalname,
      type: fileType,
      category: category || "other",
      path: uploadResult.path || uploadResult.key,
      courseId: targetCourseId || undefined,
      notebookId: targetNotebookId || undefined,
      collegeId: req.user.collegeId,
      uploadedBy: req.user.id,
      uploadedByRole,
      status: "ready",
      metadata: {
        fileSize: req.file.size,
        ...(uploadResult.key ? { key: uploadResult.key } : {})
      }
    });

    source.url = `/api/v1/sources/${source._id}/download`;
    await source.save();

    res.status(201).json({ success: true, data: source });
  } catch (error) {
    next(error);
  }
}

/**
 * Download or view a source file by ID.
 * Enforces multi-tenant isolation, course enrollment checks, and streams from configured storage provider.
 */
export async function downloadSource(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const source = await Source.findOne({ _id: id, collegeId: req.user.collegeId });
    if (!source || !source.path) {
      res.status(404).json({ success: false, error: "Material file not found" });
      return;
    }

    if (req.user.role === "student" && source.courseId) {
      const course = await Course.findOne({ _id: source.courseId, collegeId: req.user.collegeId });
      if (course) {
        const isEnrolled = course.studentIds.some((sId) => sId.toString() === req.user!.id);
        const isUploader = source.uploadedBy.toString() === req.user!.id;
        if (!isEnrolled && !isUploader) {
          res.status(403).json({ success: false, error: "Unauthorized: Student is not enrolled in this course" });
          return;
        }
      }
    }

    const inline = req.query.inline === "true";
    const ext = source.name.split(".").pop()?.toLowerCase();
    
    let mimeType = "application/octet-stream";
    if (ext === "pdf") mimeType = "application/pdf";
    else if (ext === "docx") mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    else if (ext === "pptx") mimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    else if (ext === "ppt") mimeType = "application/vnd.ms-powerpoint";

    const disposition = inline ? "inline" : "attachment";
    res.setHeader("Content-Disposition", `${disposition}; filename="${encodeURIComponent(source.name)}"`);

    // Stream from Storage Provider (S3 / R2 / Local)
    const storageService = getStorageService();
    const fileStream = await storageService.getFileStream(source.path);

    if (fileStream) {
      res.setHeader("Content-Type", fileStream.contentType || mimeType);
      if (fileStream.contentLength) {
        res.setHeader("Content-Length", fileStream.contentLength);
      }
      fileStream.stream.pipe(res);
      return;
    }

    // Local fallback resolution if stream not returned directly
    let absolutePath = path.resolve(source.path);
    if (!fs.existsSync(absolutePath)) {
      const uploadDir = process.env.UPLOAD_PATH || "./uploads";
      absolutePath = path.resolve(uploadDir, path.basename(source.path));
    }

    if (fs.existsSync(absolutePath)) {
      res.setHeader("Content-Type", mimeType);
      res.sendFile(absolutePath);
      return;
    }

    res.status(404).json({ success: false, error: "Physical file missing on server" });
  } catch (error) {
    next(error);
  }
}

/**
 * List all sources for a course or subject/notebook.
 * Supports courseId OR legacy notebookId parameters.
 * Dual-query logic ensures backward compatibility with legacy Atlas data.
 */
export async function listSources(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { courseId, notebookId } = req.params;
    const { role, category } = req.query;

    const targetId = courseId || notebookId;
    if (!targetId) {
      res.status(400).json({ success: false, error: "Course or Notebook ID is required" });
      return;
    }

    // Resolve matching courseIds and notebookIds
    let matchedCourseIds: any[] = [];
    let matchedNotebookIds: any[] = [];

    // Check if targetId is a courseId
    const course = await Course.findOne({ _id: targetId, collegeId: req.user!.collegeId });
    if (course) {
      if (req.user!.role === "student") {
        const isEnrolled = course.studentIds.some((sId) => sId.toString() === req.user!.id);
        if (!isEnrolled) {
          res.status(403).json({ success: false, error: "Unauthorized: Student is not enrolled in this course" });
          return;
        }
      }
      matchedCourseIds.push(course._id);
      const notebooks = await Notebook.find({ courseId: course._id, collegeId: req.user!.collegeId }).select("_id");
      matchedNotebookIds.push(...notebooks.map(n => n._id));
    }

    // Check if targetId is a notebookId
    const notebook = await Notebook.findOne({ _id: targetId, collegeId: req.user!.collegeId });
    if (notebook) {
      matchedNotebookIds.push(notebook._id);
      if (notebook.courseId) {
        matchedCourseIds.push(notebook.courseId);
      }
    }

    // If neither course nor notebook was found, attempt direct query with targetId
    const orConditions: any[] = [];
    if (matchedCourseIds.length > 0) {
      orConditions.push({ courseId: { $in: matchedCourseIds } });
    }
    if (matchedNotebookIds.length > 0) {
      orConditions.push({ notebookId: { $in: matchedNotebookIds } });
    }

    // Fallback if neither found by ID reference
    if (orConditions.length === 0) {
      orConditions.push({ courseId: targetId }, { notebookId: targetId });
    }

    const filter: Record<string, unknown> = {
      collegeId: req.user!.collegeId,
      isActive: { $ne: false },
      $or: orConditions
    };

    if (role === "faculty" || role === "student") {
      filter.uploadedByRole = role;
    }
    if (category) {
      filter.category = category;
    }

    const sources = await Source.find(filter).sort({ createdAt: -1 });
    const data = sources.map((s) => {
      const obj = s.toObject();
      if (!obj.url && obj.path) {
        obj.url = `/api/v1/sources/${obj._id}/download`;
      }
      return obj;
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a source file and its record.
 */
export async function deleteSource(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const source = await Source.findOne({ _id: req.params.id, collegeId: req.user!.collegeId });
    if (!source) {
      res.status(404).json({ success: false, error: "Source not found" });
      return;
    }

    // Students can only delete their own sources.
    const isOwner = source.uploadedBy.toString() === req.user!.id;
    const isAdmin =
      ["college_admin", "super_admin", "admin", "hod", "department_admin"].includes(req.user!.role || "");

    if (!isOwner && !isAdmin) {
      res.status(403).json({ success: false, error: "Not authorised to delete this source" });
      return;
    }

    // Remove file via storage provider (Local, S3, R2)
    if (source.path) {
      try {
        const storageService = getStorageService();
        await storageService.deleteFile(source.path);
      } catch (storageErr) {
        console.warn("[storage] File could not be deleted from storage:", storageErr);
      }
    }

    await Source.deleteOne({ _id: source._id });

    res.json({ success: true, message: "Source deleted successfully" });
  } catch (error) {
    next(error);
  }
}
