import { Response, NextFunction } from "express";
import Assignment from "../models/Assignment.model";
import Submission from "../models/Submission.model";
import Course from "../models/Course.model";
import Grade from "../models/Grade.model";
import User from "../models/User.model";
import Student from "../models/Student.model";
import { AuthRequest } from "../middleware/auth";
import { notificationService } from "../services/notificationService";
import { getStorageService } from "../services/storageService";
import { logAcademicCorrection } from "../services/auditService";
import path from "path";
import fs from "fs";

export async function createAssignment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { courseId, title, description, instructions, rubric, allowResubmission, attachments, dueDate, totalMarks, notebookId } = req.body;
    const collegeId = req.user?.collegeId;
    const createdBy = req.user?.id;
    const role = req.user?.role;

    // Verify course belongs to college
    const course = await Course.findOne({ _id: courseId, collegeId });
    if (!course) {
      res.status(404).json({ success: false, error: "Course not found" }); return;
    }

    // Faculty course ownership check
    if (role === "faculty" && createdBy) {
      const isAssigned = course.facultyIds.some((fId) => fId.toString() === createdBy);
      if (!isAssigned) {
        res.status(403).json({ success: false, error: "Unauthorized: Course not assigned to this faculty member" }); return;
      }
    }

    const assignment = await Assignment.create({
      collegeId,
      courseId,
      notebookId,
      title,
      description,
      instructions,
      rubric,
      allowResubmission: allowResubmission !== undefined ? allowResubmission : true,
      attachments: attachments || [],
      dueDate,
      totalMarks: totalMarks || 100,
      createdBy,
      status: "published"
    });

    // Notify course students
    if (collegeId && courseId) {
      notificationService.notifyCourseStudents(
        collegeId,
        courseId,
        "New Assignment Posted",
        `New assignment "${title}" posted for ${course.name}. Due on ${new Date(dueDate).toLocaleDateString()}.`,
        "assignment",
        `/subjects/${courseId}/assignments`
      );
    }

    res.status(201).json({ success: true, data: assignment });
  } catch (error) { next(error); }
}

export async function getAssignments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const collegeId = req.user?.collegeId;
    const { courseId } = req.query;

    const query: any = { collegeId, status: { $ne: "closed" } };
    if (courseId) {
      query.courseId = courseId;
    }

    const assignments = await Assignment.find(query)
      .populate("courseId", "name courseCode")
      .sort({ dueDate: 1 })
      .lean();

    res.json({ success: true, data: assignments });
  } catch (error) { next(error); }
}

export async function updateAssignment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const collegeId = req.user?.collegeId;
    const role = req.user?.role;
    const userId = req.user?.id;
    const updateData = req.body;

    const assignment = await Assignment.findOne({ _id: id, collegeId });
    if (!assignment) {
      res.status(404).json({ success: false, error: "Assignment not found" }); return;
    }

    if (role === "faculty" && userId) {
      const course = await Course.findOne({ _id: assignment.courseId, collegeId });
      if (!course || !course.facultyIds.some((f) => f.toString() === userId)) {
        res.status(403).json({ success: false, error: "Unauthorized: Course not assigned to this faculty member" }); return;
      }
    }

    const previousValue = {
      title: assignment.title,
      description: assignment.description,
      instructions: assignment.instructions,
      dueDate: assignment.dueDate,
      totalMarks: assignment.totalMarks,
      submissionMethod: assignment.submissionMethod,
      attachments: assignment.attachments
    };

    const allowedFields = ["title", "description", "instructions", "rubric", "allowResubmission", "attachments", "dueDate", "totalMarks", "submissionMethod", "status"];
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        (assignment as any)[field] = updateData[field];
      }
    }
    await assignment.save();

    const newValue = {
      title: assignment.title,
      description: assignment.description,
      instructions: assignment.instructions,
      dueDate: assignment.dueDate,
      totalMarks: assignment.totalMarks,
      submissionMethod: assignment.submissionMethod,
      attachments: assignment.attachments
    };

    await logAcademicCorrection({
      collegeId: collegeId!,
      actorId: userId || req.user!.id,
      actorRole: role || "faculty",
      action: "assignment_edit",
      entityType: "assignment",
      entityId: assignment._id.toString(),
      courseId: assignment.courseId,
      previousValue,
      newValue,
      reason: req.body.reason || "Assignment updated by faculty"
    });

    res.json({ success: true, data: assignment });
  } catch (error) { next(error); }
}

export async function deleteAssignment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const collegeId = req.user?.collegeId;
    const role = req.user?.role;
    const userId = req.user?.id;

    const assignment = await Assignment.findOne({ _id: id, collegeId });
    if (!assignment) {
      res.status(404).json({ success: false, error: "Assignment not found" }); return;
    }

    if (role === "faculty" && userId) {
      const course = await Course.findOne({ _id: assignment.courseId, collegeId });
      if (!course || !course.facultyIds.some((f) => f.toString() === userId)) {
        res.status(403).json({ success: false, error: "Unauthorized: Course not assigned to this faculty member" }); return;
      }
    }

    assignment.status = "closed";
    await assignment.save();

    res.json({ success: true, data: {} });
  } catch (error) { next(error); }
}

export async function duplicateAssignment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { targetCourseId } = req.body;
    const collegeId = req.user?.collegeId;
    const role = req.user?.role;
    const userId = req.user?.id;

    const existing = await Assignment.findOne({ _id: id, collegeId }).lean();
    if (!existing) {
      res.status(404).json({ success: false, error: "Assignment not found" }); return;
    }

    const courseIdToUse = targetCourseId || existing.courseId;
    if (role === "faculty" && userId) {
      const course = await Course.findOne({ _id: courseIdToUse, collegeId });
      if (!course || !course.facultyIds.some((f) => f.toString() === userId)) {
        res.status(403).json({ success: false, error: "Unauthorized: Course not assigned to this faculty member" }); return;
      }
    }

    const duplicated = await Assignment.create({
      ...existing,
      _id: undefined,
      title: `${existing.title} (Copy)`,
      courseId: courseIdToUse,
      createdBy: userId,
      createdAt: undefined,
      updatedAt: undefined
    });

    res.status(201).json({ success: true, data: duplicated });
  } catch (error) { next(error); }
}

export async function submitAssignment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params; // assignmentId
    const { files, notes, notebookId } = req.body;
    const collegeId = req.user?.collegeId;
    const studentId = req.user?.id;
    const role = req.user?.role;

    const assignment = await Assignment.findOne({ _id: id, collegeId });
    if (!assignment) {
      res.status(404).json({ success: false, error: "Assignment not found" }); return;
    }

    // Student Enrollment Check
    const course = await Course.findOne({ _id: assignment.courseId, collegeId });
    if (!course) {
      res.status(404).json({ success: false, error: "Course not found" }); return;
    }

    if (role === "student" && studentId) {
      const isEnrolled = course.studentIds.some((sId) => sId.toString() === studentId);
      if (!isEnrolled) {
        res.status(403).json({ success: false, error: "Unauthorized: Student is not enrolled in this course" }); return;
      }
    }

    const existingSub = await Submission.findOne({ assignmentId: id, studentId, collegeId });
    const submissionHistory = existingSub ? existingSub.submissionHistory || [] : [];
    if (existingSub && existingSub.notes) {
      submissionHistory.push({
        notes: existingSub.notes,
        files: existingSub.files,
        submittedAt: existingSub.submittedAt
      });
    }

    // Upsert submission
    const submission = await Submission.findOneAndUpdate(
      { assignmentId: id, studentId, collegeId },
      { 
        $set: { 
          files: files || [], 
          notes: notes || "", 
          notebookId, 
          submittedAt: new Date(),
          status: new Date() > assignment.dueDate ? "late" : "submitted",
          submissionHistory
        },
        $inc: { version: 1 }
      },
      { new: true, upsert: true }
    );

    // Faculty notification on student submission
    if (collegeId && course.facultyIds && course.facultyIds.length > 0 && studentId) {
      const studentUser = await User.findById(studentId).select("name").lean();
      const studentName = studentUser?.name || "A student";
      for (const facultyId of course.facultyIds) {
        notificationService.notifyUser(
          collegeId,
          facultyId.toString(),
          "Assignment Submission Received",
          `${studentName} submitted work for "${assignment.title}".`,
          "assignment",
          `/subjects/${course._id}?tab=assignments`
        );
      }
    }

    res.json({ success: true, data: submission });
  } catch (error) { next(error); }
}

export async function getSubmissions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params; // assignmentId
    const collegeId = req.user?.collegeId;
    const role = req.user?.role;
    const userId = req.user?.id;

    const assignment = await Assignment.findOne({ _id: id, collegeId }).lean();
    if (!assignment) {
      res.status(404).json({ success: false, error: "Assignment not found" }); return;
    }

    const course = await Course.findOne({ _id: assignment.courseId, collegeId }).lean();
    if (!course) {
      res.status(404).json({ success: false, error: "Course not found" }); return;
    }

    if (role === "faculty" && userId) {
      const isAssigned = course.facultyIds.some((f) => f.toString() === userId);
      if (!isAssigned) {
        res.status(403).json({ success: false, error: "Unauthorized: Course not assigned to this faculty member" }); return;
      }
    }

    // Complete Roster logic: Fetch all enrolled students
    const enrolledUserIds = (course.studentIds || []).map((sId) => sId.toString());
    const [studentUsers, studentRecords, existingSubmissions] = await Promise.all([
      User.find({ _id: { $in: enrolledUserIds }, collegeId }).select("name email").lean(),
      Student.find({ userId: { $in: enrolledUserIds }, collegeId }).select("userId rollNumber").lean(),
      Submission.find({ assignmentId: id, collegeId }).lean()
    ]);

    const studentMap = new Map<string, { _id: string; name: string; email: string; rollNumber?: string }>();
    studentUsers.forEach((u) => {
      const stRecord = studentRecords.find((sr) => sr.userId.toString() === u._id.toString());
      studentMap.set(u._id.toString(), {
        _id: u._id.toString(),
        name: u.name,
        email: u.email,
        rollNumber: stRecord?.rollNumber || ""
      });
    });

    const subMap = new Map<string, any>();
    existingSubmissions.forEach((sub) => {
      subMap.set(sub.studentId.toString(), sub);
    });

    // Build complete roster
    const roster = enrolledUserIds.map((uId) => {
      const studentInfo = studentMap.get(uId) || { _id: uId, name: "Unknown Student", email: "" };
      const sub = subMap.get(uId);

      if (sub) {
        return {
          ...sub,
          studentId: studentInfo,
          isSubmitted: true
        };
      }

      return {
        _id: `pending_${uId}`,
        assignmentId: id,
        studentId: studentInfo,
        files: [],
        notes: "",
        submittedAt: null,
        status: "pending",
        isSubmitted: false,
        marks: undefined,
        feedback: ""
      };
    });

    res.json({ success: true, data: roster });
  } catch (error) { next(error); }
}

export async function gradeSubmission(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { submissionId } = req.params;
    const { marks, feedback } = req.body;
    const collegeId = req.user?.collegeId;
    const role = req.user?.role;
    const userId = req.user?.id;

    // Support both existing submissionId or pending grade request
    let submission = await Submission.findOne({ _id: submissionId, collegeId });
    
    // If faculty is grading an unsubmitted/pending student for the first time
    if (!submission && req.body.assignmentId && req.body.studentId) {
      submission = await Submission.create({
        collegeId,
        assignmentId: req.body.assignmentId,
        studentId: req.body.studentId,
        files: [],
        notes: "Graded directly by faculty",
        submittedAt: new Date(),
        marks: Number(marks),
        feedback: feedback ? feedback.trim() : "",
        status: "graded"
      });
    } else if (submission) {
      submission.marks = Number(marks);
      submission.feedback = feedback ? feedback.trim() : "";
      submission.status = "graded";
      await submission.save();
    }

    if (!submission) {
      res.status(404).json({ success: false, error: "Submission record not found" }); return;
    }

    const assignment = await Assignment.findOne({ _id: submission.assignmentId, collegeId });
    if (!assignment) {
      res.status(404).json({ success: false, error: "Assignment not found" }); return;
    }

    // Course ownership check
    if (role === "faculty" && userId) {
      const course = await Course.findOne({ _id: assignment.courseId, collegeId });
      if (!course || !course.facultyIds.some((f) => f.toString() === userId)) {
        res.status(403).json({ success: false, error: "Unauthorized: Course not assigned to this faculty member" }); return;
      }
    }

    // Synchronize gradebook entry
    await Grade.findOneAndUpdate(
      {
        collegeId,
        studentId: submission.studentId,
        assignmentId: assignment._id
      },
      {
        $set: {
          collegeId,
          studentId: submission.studentId,
          courseId: assignment.courseId,
          assignmentId: assignment._id,
          type: "assignment",
          title: assignment.title,
          marksObtained: Number(marks),
          maxMarks: assignment.totalMarks || 100,
          gradedBy: userId,
          remarks: feedback ? feedback.trim() : "Graded by faculty"
        }
      },
      { upsert: true, new: true }
    );

    // Notify student that work has been graded
    if (collegeId && submission.studentId) {
      notificationService.notifyUser(
        collegeId,
        submission.studentId.toString(),
        "Assignment Graded",
        `Your submission for "${assignment.title}" has been graded: ${marks}/${assignment.totalMarks || 100} marks.`,
        "grade",
        `/subjects/${assignment.courseId}/assignments`
      );
    }

    res.json({ success: true, data: submission });
  } catch (error) { next(error); }
}

export async function getMySubmissions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const collegeId = req.user?.collegeId;
    const studentId = req.user?.id;

    const submissions = await Submission.find({ studentId, collegeId })
      .populate({
        path: "assignmentId",
        select: "title dueDate totalMarks courseId instructions rubric attachments",
        populate: { path: "courseId", select: "name courseCode" }
      })
      .sort({ submittedAt: -1 })
      .lean();

    res.json({ success: true, data: submissions });
  } catch (error) { next(error); }
}

// File attachment operations

export async function uploadAttachment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: "No file provided" }); return;
    }

    const storageService = getStorageService();
    const uploadResult = await storageService.uploadFile(req.file, "assignments");

    const fileData = {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: req.file.originalname,
      filename: path.basename(uploadResult.path || uploadResult.key),
      path: uploadResult.path || uploadResult.key,
      key: uploadResult.key,
      size: req.file.size,
      mimeType: req.file.mimetype,
      url: `/api/v1/assignments/attachments/download?file=${encodeURIComponent(uploadResult.key || req.file.filename)}`
    };

    res.status(201).json({ success: true, data: fileData });
  } catch (error) { next(error); }
}

export async function uploadSubmissionFile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: "No file provided" }); return;
    }

    const storageService = getStorageService();
    const uploadResult = await storageService.uploadFile(req.file, "submissions");

    const fileData = {
      id: `subfile_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: req.file.originalname,
      filename: path.basename(uploadResult.path || uploadResult.key),
      path: uploadResult.path || uploadResult.key,
      key: uploadResult.key,
      size: req.file.size,
      mimeType: req.file.mimetype,
      url: `/api/v1/assignments/submission-files/download?file=${encodeURIComponent(uploadResult.key || req.file.filename)}`
    };

    res.status(201).json({ success: true, data: fileData });
  } catch (error) { next(error); }
}

export async function downloadAssignmentFile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthorized" }); return;
    }

    const { file, submissionId, assignmentId } = req.query;
    const filename = (file as string) || (req.query.path as string);
    if (!filename) {
      res.status(400).json({ success: false, error: "Filename parameter is required" }); return;
    }

    const collegeId = req.user.collegeId;
    const role = req.user.role;
    const userId = req.user.id;

    // Security Checks:
    if (submissionId) {
      const submission = await Submission.findOne({ _id: submissionId, collegeId });
      if (!submission) {
        res.status(404).json({ success: false, error: "Submission not found or tenant mismatch" }); return;
      }

      // Student-to-Student isolation
      if (role === "student" && submission.studentId.toString() !== userId) {
        res.status(403).json({ success: false, error: "Access Denied: You cannot view another student's submission file" }); return;
      }

      // Faculty check
      if (role === "faculty") {
        const assign = await Assignment.findById(submission.assignmentId).select("courseId").lean();
        if (assign) {
          const course = await Course.findOne({ _id: assign.courseId, collegeId }).lean();
          if (!course || !course.facultyIds.some((f) => f.toString() === userId)) {
            res.status(403).json({ success: false, error: "Access Denied: Course not assigned to this faculty member" }); return;
          }
        }
      }
    } else if (assignmentId) {
      const assignment = await Assignment.findOne({ _id: assignmentId, collegeId });
      if (!assignment) {
        res.status(404).json({ success: false, error: "Assignment not found or tenant mismatch" }); return;
      }

      const course = await Course.findOne({ _id: assignment.courseId, collegeId }).lean();
      if (!course) {
        res.status(404).json({ success: false, error: "Course not found" }); return;
      }

      if (role === "student" && !course.studentIds.some((s) => s.toString() === userId)) {
        res.status(403).json({ success: false, error: "Access Denied: Student is not enrolled in this course" }); return;
      }
    }

    const baseName = path.basename(filename);
    const inline = req.query.inline === "true";
    const ext = baseName.split(".").pop()?.toLowerCase() || "";

    let mimeType = "application/octet-stream";
    if (ext === "pdf") mimeType = "application/pdf";
    else if (ext === "docx") mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    else if (ext === "doc") mimeType = "application/msword";
    else if (ext === "pptx") mimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    else if (ext === "ppt") mimeType = "application/vnd.ms-powerpoint";
    else if (ext === "zip") mimeType = "application/zip";

    const disposition = inline ? "inline" : "attachment";
    res.setHeader("Content-Disposition", `${disposition}; filename="${encodeURIComponent(baseName.replace(/^\d+-[a-zA-Z0-9]+-/, '').replace(/^\d+-/, ''))}"`);

    // Stream from Storage Provider (S3 / R2 / Local)
    const storageService = getStorageService();
    const fileStream = await storageService.getFileStream(filename);

    if (fileStream) {
      res.setHeader("Content-Type", fileStream.contentType || mimeType);
      if (fileStream.contentLength) {
        res.setHeader("Content-Length", fileStream.contentLength);
      }
      fileStream.stream.pipe(res);
      return;
    }

    // Local filesystem fallback
    let absolutePath = path.resolve("./uploads/assignments", baseName);
    if (!fs.existsSync(absolutePath)) {
      absolutePath = path.resolve("./uploads", baseName);
    }
    if (!fs.existsSync(absolutePath)) {
      absolutePath = path.resolve("./uploads/submissions", baseName);
    }

    if (fs.existsSync(absolutePath)) {
      res.setHeader("Content-Type", mimeType);
      res.sendFile(absolutePath);
      return;
    }

    res.status(404).json({ success: false, error: "Attachment file missing on server" });
  } catch (error) { next(error); }
}


