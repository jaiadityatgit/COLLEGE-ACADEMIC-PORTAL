import { Response, NextFunction } from "express";
import Announcement from "../models/Announcement.model";
import User from "../models/User.model";
import Course from "../models/Course.model";
import Student from "../models/Student.model";
import Batch from "../models/Batch.model";
import TeachingAssignment from "../models/TeachingAssignment.model";
import AuditLog from "../models/AuditLog.model";
import { AuthRequest } from "../middleware/auth";
import { notificationService } from "../services/notificationService";

export async function createAnnouncement(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      title,
      body,
      type,
      priority,
      category,
      departmentId,
      batchId,
      section,
      courseId,
      notebookId,
      attachmentUrls,
      audience,
      isPinned
    } = req.body;

    const collegeId = req.user?.collegeId;
    const authorId = req.user?.id;
    const role = req.user?.role || "";

    // 1. Role validation: Student is strictly READ-ONLY
    if (role === "student") {
      res.status(403).json({ success: false, error: "Unauthorized: Students cannot publish announcements" });
      return;
    }

    if (!title || !body) {
      res.status(400).json({ success: false, error: "Title and body are required" });
      return;
    }

    const resolvedCategory = category || "general";
    let targetAudience = audience || "department";

    // 2. Faculty permissions: can ONLY publish course-specific notices for courses they teach
    if (role === "faculty") {
      if (audience && audience !== "course") {
        res.status(403).json({
          success: false,
          error: "Unauthorized: Faculty may only publish course-specific announcements"
        });
        return;
      }

      if (!courseId) {
        res.status(400).json({ success: false, error: "Faculty must select a course for course-specific announcements" });
        return;
      }

      const course = await Course.findOne({ _id: courseId, collegeId });
      let isAssigned = course && Array.isArray(course.facultyIds) && course.facultyIds.some(f => f.toString() === authorId);
      if (!isAssigned) {
        try {
          const hasTeachingAssign = await TeachingAssignment.exists({
            collegeId,
            facultyId: authorId,
            courseId,
            status: "active"
          });
          if (hasTeachingAssign) isAssigned = true;
        } catch {
          // ignore error if model is mocked without exists
        }
      }

      if (!isAssigned) {
        res.status(403).json({ success: false, error: "Unauthorized: You are not assigned to teach this course" });
        return;
      }

      targetAudience = "course";
    }

    // 3. HOD permissions: can publish department and batch/section notices for their department; NOT college-wide
    if (role === "hod" || role === "department_admin") {
      if (targetAudience === "college") {
        res.status(403).json({
          success: false,
          error: "Unauthorized: HOD cannot publish college-wide announcements. Contact institution admin."
        });
        return;
      }
    }

    // 4. Batch/Section validation
    let resolvedBatchId = batchId;
    let resolvedSection = section ? section.trim().toUpperCase() : undefined;
    if (targetAudience === "batch" || targetAudience === "section") {
      if (!resolvedBatchId && !resolvedSection) {
        res.status(400).json({ success: false, error: "Batch or Section must be specified for batch/section notices" });
        return;
      }
      if (resolvedBatchId) {
        const batchDoc = await Batch.findOne({ _id: resolvedBatchId, collegeId });
        if (batchDoc && batchDoc.section && !resolvedSection) {
          resolvedSection = batchDoc.section;
        }
      }
    }

    const announcement = await Announcement.create({
      title: String(title).trim(),
      body: String(body).trim(),
      type: type || "notice",
      priority: priority || "normal",
      category: resolvedCategory,
      authorId,
      collegeId,
      departmentId: role === "faculty" ? undefined : departmentId,
      batchId: resolvedBatchId,
      section: resolvedSection,
      courseId,
      notebookId,
      attachmentUrls,
      audience: targetAudience,
      isPinned: role === "faculty" ? false : !!isPinned
    });

    // Audit log for institutional / departmental notices
    if (targetAudience === "college" || targetAudience === "department" || resolvedCategory === "exam" || resolvedCategory === "holiday") {
      try {
        await AuditLog.create({
          collegeId,
          actorId: authorId,
          actorRole: role,
          action: "announcement_create",
          entityType: "announcement",
          entityId: announcement._id.toString(),
          courseId: courseId || undefined,
          newValue: {
            title,
            audience: targetAudience,
            category: resolvedCategory,
            departmentId,
            batchId: resolvedBatchId,
            section: resolvedSection
          },
          reason: `Published ${targetAudience} notice: ${title}`
        });
      } catch {
        // safe audit logging
      }
    }

    // High-signal notification routing
    if (collegeId) {
      if (courseId) {
        notificationService.notifyCourseStudents(
          collegeId,
          courseId,
          `Course Notice: ${title}`,
          body.slice(0, 100) + (body.length > 100 ? "…" : ""),
          "announcement",
          `/subjects/${courseId}/announcements`
        );
      } else {
        notificationService.notifyAllDepartmentStudents(
          collegeId,
          `Notice: ${title}`,
          body.slice(0, 100) + (body.length > 100 ? "…" : ""),
          "announcement",
          `/announcements`
        );
      }
    }

    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    next(error);
  }
}

export async function getAnnouncements(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const collegeId = req.user?.collegeId;
    const userId = req.user?.id;
    const role = req.user?.role;
    const { courseId, notebookId, departmentId, batchId, category } = req.query;

    let query: any = { collegeId, isArchived: false };

    if (category) {
      query.category = category;
    }

    // Direct filter if specified
    if (courseId) {
      query.courseId = courseId;
    } else if (notebookId) {
      query.notebookId = notebookId;
    } else {
      // Role-based recipient resolution
      if (role === "college_admin" || role === "super_admin") {
        if (departmentId) query.departmentId = departmentId;
        if (batchId) query.batchId = batchId;
      } else if (role === "student") {
        // Authoritative Student scoping
        const studentProfile = await Student.findOne({ userId, collegeId }).lean();
        const userCourses = await Course.find({
          collegeId,
          $or: [
            { studentIds: userId },
            ...(studentProfile ? [{ _id: { $in: studentProfile.enrolledCourseIds || [] } }] : [])
          ]
        }).select("_id").lean();

        const courseIds = userCourses.map(c => c._id);
        const orConditions: any[] = [{ audience: "college" }];

        if (studentProfile) {
          if (studentProfile.departmentId) {
            orConditions.push({ audience: "department", departmentId: studentProfile.departmentId });
          }
          if (studentProfile.batchId) {
            orConditions.push({ audience: { $in: ["batch", "section"] }, batchId: studentProfile.batchId });
          }
          if (studentProfile.section && studentProfile.departmentId) {
            orConditions.push({
              audience: "section",
              section: studentProfile.section,
              departmentId: studentProfile.departmentId
            });
          }
        }

        if (courseIds.length > 0) {
          orConditions.push({ audience: "course", courseId: { $in: courseIds } });
          orConditions.push({ audience: "notebook", courseId: { $in: courseIds } });
        }

        query.$or = orConditions;
      } else if (role === "faculty") {
        // Authoritative Faculty scoping
        const userDoc = await User.findById(userId).select("departmentId assignedCourseIds").lean();
        const [teachingAssignments, taughtCourses] = await Promise.all([
          TeachingAssignment.find({ collegeId, facultyId: userId, status: "active" }).lean(),
          Course.find({ collegeId, facultyIds: userId }).select("_id").lean()
        ]);

        const assignedCourseIds = Array.from(new Set([
          ...(userDoc?.assignedCourseIds?.map((id: any) => id.toString()) || []),
          ...taughtCourses.map(c => c._id.toString()),
          ...teachingAssignments.map(t => t.courseId.toString())
        ]));

        const batchIds = teachingAssignments.map(t => t.batchId).filter(Boolean);
        const deptId = userDoc?.departmentId;

        const orConditions: any[] = [{ audience: "college" }];
        if (deptId) {
          orConditions.push({ audience: "department", departmentId: deptId });
        }
        if (assignedCourseIds.length > 0) {
          orConditions.push({ audience: "course", courseId: { $in: assignedCourseIds } });
        }
        if (batchIds.length > 0) {
          orConditions.push({ audience: { $in: ["batch", "section"] }, batchId: { $in: batchIds } });
        }

        query.$or = orConditions;
      } else if (role === "hod" || role === "department_admin") {
        // HOD sees college announcements + their department announcements
        const userDoc = await User.findById(userId).select("departmentId").lean();
        const deptId = userDoc?.departmentId;
        query.$or = [
          { audience: "college" },
          ...(deptId ? [{ departmentId: deptId }] : [])
        ];
      }
    }

    const announcements = await Announcement.find(query)
      .populate("authorId", "name role designation")
      .populate("departmentId", "departmentName departmentCode")
      .populate("courseId", "name courseCode")
      .populate("batchId", "name section")
      .sort({ isPinned: -1, priority: -1, createdAt: -1 })
      .lean();

    res.json({ success: true, data: announcements });
  } catch (error) {
    next(error);
  }
}

export async function updateAnnouncement(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const collegeId = req.user?.collegeId;
    const role = req.user?.role || "";
    const userId = req.user?.id;

    const existing = await Announcement.findOne({ _id: id, collegeId });
    if (!existing) {
      res.status(404).json({ success: false, error: "Announcement not found" });
      return;
    }

    // Role check: Author or Admin
    if (role !== "college_admin" && role !== "super_admin" && existing.authorId.toString() !== userId) {
      res.status(403).json({ success: false, error: "Unauthorized to edit this announcement" });
      return;
    }

    const { title, body, priority, isPinned, isArchived, category } = req.body;
    if (title) existing.title = String(title).trim();
    if (body) existing.body = String(body).trim();
    if (priority) existing.priority = priority;
    if (category) existing.category = category;
    if (typeof isPinned === "boolean" && role !== "faculty") existing.isPinned = isPinned;
    if (typeof isArchived === "boolean") existing.isArchived = isArchived;

    await existing.save();

    await AuditLog.create({
      collegeId,
      actorId: userId,
      actorRole: role,
      action: "announcement_update",
      entityType: "announcement",
      entityId: existing._id.toString(),
      newValue: { title, priority, isPinned, isArchived, category },
      reason: "Updated announcement properties"
    });

    res.json({ success: true, data: existing });
  } catch (error) {
    next(error);
  }
}

export async function deleteAnnouncement(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const collegeId = req.user?.collegeId;
    const role = req.user?.role || "";
    const userId = req.user?.id;

    const existing = await Announcement.findOne({ _id: id, collegeId });
    if (!existing) {
      res.status(404).json({ success: false, error: "Announcement not found" });
      return;
    }

    if (role !== "college_admin" && role !== "super_admin" && existing.authorId.toString() !== userId) {
      res.status(403).json({ success: false, error: "Unauthorized to delete this announcement" });
      return;
    }

    existing.isArchived = true;
    await existing.save();

    res.json({ success: true, message: "Announcement archived successfully" });
  } catch (error) {
    next(error);
  }
}

export const archiveAnnouncement = deleteAnnouncement;

export async function togglePinAnnouncement(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const collegeId = req.user?.collegeId;
    const announcement = await Announcement.findOne({ _id: id, collegeId });
    if (!announcement) {
      res.status(404).json({ success: false, error: "Announcement not found" });
      return;
    }
    announcement.isPinned = !announcement.isPinned;
    await announcement.save();
    res.json({ success: true, data: announcement });
  } catch (error) {
    next(error);
  }
}

export async function markAnnouncementRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      res.status(400).json({ success: false, error: "User ID required" });
      return;
    }
    await Announcement.updateOne(
      { _id: id },
      { $addToSet: { readBy: userId } }
    );
    res.json({ success: true, message: "Marked as read" });
  } catch (error) {
    next(error);
  }
}

