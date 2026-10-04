import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import TeachingAssignment from "../models/TeachingAssignment.model";
import Course from "../models/Course.model";
import User from "../models/User.model";
import Department from "../models/Department.model";
import Batch from "../models/Batch.model";
import Student from "../models/Student.model";
import Attendance from "../models/Attendance.model";
import AuditLog from "../models/AuditLog.model";
import mongoose from "mongoose";

export async function createTeachingAssignment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { facultyId, courseId, departmentId, academicYear, semester, batchId, section } = req.body;
    const collegeId = req.user?.collegeId;
    const role = req.user?.role;

    if (!["college_admin", "super_admin", "hod", "department_admin"].includes(role || "")) {
      res.status(403).json({ success: false, error: "Unauthorized: Only admin and HOD can assign faculty" });
      return;
    }

    if (!facultyId || !courseId || !academicYear || !semester) {
      res.status(400).json({ success: false, error: "facultyId, courseId, academicYear, and semester are required" });
      return;
    }

    // Verify faculty
    const facultyUser = await User.findOne({ _id: facultyId, collegeId });
    if (!facultyUser || facultyUser.role !== "faculty") {
      res.status(404).json({ success: false, error: "Faculty user not found or is not faculty" });
      return;
    }

    // Verify course
    const course = await Course.findOne({ _id: courseId, collegeId });
    if (!course) {
      res.status(404).json({ success: false, error: "Course not found" });
      return;
    }

    // Resolved department
    let targetDeptId = departmentId || course.departmentId || facultyUser.departmentId;
    if (!targetDeptId) {
      const defaultDept = await Department.findOne({ collegeId, isArchived: false });
      targetDeptId = defaultDept?._id;
    }

    // Check HOD department boundary
    if (role === "hod" || role === "department_admin") {
      const hodUser = await User.findById(req.user?.id).select("departmentId").lean();
      if (hodUser?.departmentId && hodUser.departmentId.toString() !== targetDeptId?.toString()) {
        res.status(403).json({ success: false, error: "HOD can only assign faculty within their department" });
        return;
      }
    }

    // If batchId provided, verify batch
    let resolvedSection = section ? section.trim().toUpperCase() : "A";
    if (batchId) {
      const batchDoc = await Batch.findOne({ _id: batchId, collegeId });
      if (batchDoc && batchDoc.section) {
        resolvedSection = batchDoc.section.trim().toUpperCase();
      }
    }

    // Upsert assignment record
    const assignment = await TeachingAssignment.findOneAndUpdate(
      {
        collegeId,
        facultyId,
        courseId,
        academicYear: academicYear.trim(),
        section: resolvedSection,
        status: "active"
      },
      {
        $set: {
          departmentId: targetDeptId,
          semester: semester.trim(),
          batchId: batchId || undefined,
          section: resolvedSection,
          status: "active"
        }
      },
      { upsert: true, new: true }
    );

    // Keep course.facultyIds and user.assignedCourseIds synchronized
    await Promise.all([
      Course.updateOne(
        { _id: courseId, collegeId },
        { $addToSet: { facultyIds: facultyId } }
      ),
      User.updateOne(
        { _id: facultyId, collegeId },
        { $addToSet: { assignedCourseIds: courseId } }
      )
    ]);

    // Audit log
    await AuditLog.create({
      collegeId,
      actorId: req.user!.id,
      actorRole: role || "admin",
      action: "teaching_assignment",
      entityType: "teaching_assignment",
      entityId: assignment._id.toString(),
      courseId: course._id,
      newValue: {
        facultyId,
        courseId,
        courseName: course.name,
        academicYear,
        semester,
        batchId,
        section: resolvedSection
      },
      reason: `Assigned faculty ${facultyUser.name} to ${course.name} (${academicYear} Sem ${semester} Sec ${resolvedSection})`
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
}

export async function getTeachingAssignments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const collegeId = req.user?.collegeId;
    const { facultyId, courseId, academicYear, departmentId, batchId } = req.query;

    const filter: any = { collegeId, status: "active" };
    if (facultyId) filter.facultyId = facultyId;
    if (courseId) filter.courseId = courseId;
    if (academicYear) filter.academicYear = (academicYear as string).trim();
    if (departmentId) filter.departmentId = departmentId;
    if (batchId) filter.batchId = batchId;

    const assignments = await TeachingAssignment.find(filter)
      .populate("facultyId", "name email designation")
      .populate("courseId", "name courseCode credits courseType")
      .populate("departmentId", "departmentName departmentCode")
      .populate("batchId", "name code section")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: assignments });
  } catch (error) {
    next(error);
  }
}

export async function deleteTeachingAssignment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const collegeId = req.user?.collegeId;
    const role = req.user?.role;

    if (!["college_admin", "super_admin", "hod", "department_admin"].includes(role || "")) {
      res.status(403).json({ success: false, error: "Unauthorized to remove teaching assignments" });
      return;
    }

    const assignment = await TeachingAssignment.findOne({ _id: id, collegeId });
    if (!assignment) {
      res.status(404).json({ success: false, error: "Teaching assignment not found" });
      return;
    }

    assignment.status = "archived";
    await assignment.save();

    // Check if other active assignments remain for this faculty-course
    const otherAssignments = await TeachingAssignment.countDocuments({
      collegeId,
      facultyId: assignment.facultyId,
      courseId: assignment.courseId,
      status: "active"
    });

    if (otherAssignments === 0) {
      await Promise.all([
        Course.updateOne({ _id: assignment.courseId }, { $pull: { facultyIds: assignment.facultyId } }),
        User.updateOne({ _id: assignment.facultyId }, { $pull: { assignedCourseIds: assignment.courseId } })
      ]);
    }

    await AuditLog.create({
      collegeId,
      actorId: req.user!.id,
      actorRole: role || "admin",
      action: "teaching_assignment",
      entityType: "teaching_assignment",
      entityId: assignment._id.toString(),
      courseId: assignment.courseId,
      newValue: { status: "archived" },
      reason: `Removed teaching assignment for faculty ${assignment.facultyId}`
    });

    res.json({ success: true, message: "Teaching assignment archived successfully" });
  } catch (error) {
    next(error);
  }
}

export async function getMyTeachingContexts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    const collegeId = req.user?.collegeId;

    if (!userId || !collegeId) {
      res.status(400).json({ success: false, error: "User or college info missing" });
      return;
    }

    // 1. Authoritative check in TeachingAssignment model
    const assignments = await TeachingAssignment.find({
      collegeId,
      facultyId: userId,
      status: "active"
    })
      .populate("courseId", "name courseCode credits courseType academicYear semester")
      .populate("departmentId", "departmentName departmentCode")
      .populate("batchId", "name code section")
      .lean();

    if (assignments.length > 0) {
      const contexts = assignments.map((a: any) => {
        const course = a.courseId || {};
        const dept = a.departmentId || {};
        const batch = a.batchId || {};
        const section = a.section || batch.section || "A";

        return {
          assignmentId: a._id,
          courseId: course._id,
          courseName: course.name,
          courseCode: course.courseCode || "",
          credits: course.credits || 3,
          courseType: course.courseType || "theory",
          academicYear: a.academicYear,
          semester: a.semester,
          batchId: batch._id || undefined,
          batchName: batch.name || `${dept.departmentCode || "Dept"} Section ${section}`,
          section,
          departmentId: dept._id,
          departmentName: dept.departmentName || "Department",
          departmentCode: dept.departmentCode || ""
        };
      });

      res.json({ success: true, data: contexts });
      return;
    }

    // 2. Graceful Fallback for existing Atlas database records without TeachingAssignment
    const courses = await Course.find({
      collegeId,
      facultyIds: userId,
      status: "active"
    })
      .populate("departmentId", "departmentName departmentCode")
      .lean();

    const fallbackContexts = courses.map((course: any) => {
      const dept = course.departmentId || {};
      const year = course.academicYear || "2026-27";
      const sem = course.semester || "Semester 1";

      return {
        assignmentId: course._id,
        courseId: course._id,
        courseName: course.name,
        courseCode: course.courseCode || "",
        credits: course.credits || 3,
        courseType: course.courseType || "theory",
        academicYear: year,
        semester: sem,
        section: "A",
        departmentId: dept._id,
        departmentName: dept.departmentName || "Department",
        departmentCode: dept.departmentCode || "DEPT"
      };
    });

    res.json({ success: true, data: fallbackContexts });
  } catch (error) {
    next(error);
  }
}

export async function getContextStudents(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const collegeId = req.user?.collegeId;
    const userId = req.user?.id;
    const role = req.user?.role;
    const { courseId, batchId, section } = req.query;

    if (!courseId) {
      res.status(400).json({ success: false, error: "courseId is required" });
      return;
    }

    // Authoritative Course check
    const course = await Course.findOne({ _id: courseId, collegeId }).lean();
    if (!course) {
      res.status(404).json({ success: false, error: "Course not found" });
      return;
    }

    // Backend security boundary: verify faculty assignment
    if (role === "faculty") {
      const isAssigned = course.facultyIds.some((f: any) => f.toString() === userId);
      const hasTeachingAssign = await TeachingAssignment.exists({
        collegeId,
        facultyId: userId,
        courseId,
        status: "active"
      });

      if (!isAssigned && !hasTeachingAssign) {
        res.status(403).json({ success: false, error: "Unauthorized: You are not assigned to teach this course context" });
        return;
      }
    } else if (role === "student") {
      res.status(403).json({ success: false, error: "Unauthorized: Students cannot access faculty roster" });
      return;
    }

    // Build student query
    const studentFilter: any = {
      collegeId
    };

    if (batchId && mongoose.isValidObjectId(batchId)) {
      studentFilter.batchId = batchId;
      if (section && typeof section === "string") {
        studentFilter.section = section.trim().toUpperCase();
      }
    } else {
      studentFilter.$or = [
        { enrolledCourseIds: course._id },
        { userId: { $in: course.studentIds || [] } }
      ];
      if (section && typeof section === "string") {
        studentFilter.section = section.trim().toUpperCase();
      }
    }

    const [students, userDocs, attendanceRecords] = await Promise.all([
      Student.find(studentFilter).populate("batchId", "name code section").lean(),
      User.find({ collegeId }).select("name email role").lean(),
      Attendance.find({ collegeId, courseId }).select("studentId status").lean()
    ]);

    const userMap = new Map<string, any>();
    userDocs.forEach(u => userMap.set(u._id.toString(), u));

    // Calculate attendance metrics
    const attendanceStats = new Map<string, { total: number; attended: number }>();
    attendanceRecords.forEach(att => {
      const sId = att.studentId.toString();
      const curr = attendanceStats.get(sId) || { total: 0, attended: 0 };
      curr.total += 1;
      if (att.status === "present" || att.status === "od") {
        curr.attended += 1;
      }
      attendanceStats.set(sId, curr);
    });

    const studentRoster = students.map((s: any) => {
      const u = userMap.get(s.userId.toString()) || {};
      const stats = attendanceStats.get(s.userId.toString()) || { total: 0, attended: 0 };
      const percentage = stats.total > 0 ? Math.round((stats.attended / stats.total) * 100) : 100;

      return {
        _id: s.userId,
        studentProfileId: s._id,
        name: u.name || "Student",
        email: u.email || "",
        rollNumber: s.rollNumber || "",
        section: s.section || s.batchId?.section || "A",
        batchName: s.batchId?.name || "",
        batchId: s.batchId?._id,
        totalClasses: stats.total,
        attendedCount: stats.attended,
        attendancePercentage: percentage
      };
    });

    // Also include any users in course.studentIds who might not have Student profile in legacy data
    if (!batchId && !section && course.studentIds) {
      const existingUserIds = new Set(studentRoster.map(r => r._id.toString()));
      course.studentIds.forEach((sId: any) => {
        const idStr = sId.toString();
        if (!existingUserIds.has(idStr)) {
          const u = userMap.get(idStr);
          if (u) {
            const stats = attendanceStats.get(idStr) || { total: 0, attended: 0 };
            const percentage = stats.total > 0 ? Math.round((stats.attended / stats.total) * 100) : 100;
            studentRoster.push({
              _id: u._id,
              studentProfileId: u._id,
              name: u.name,
              email: u.email,
              rollNumber: "",
              section: "A",
              batchName: "",
              batchId: undefined,
              totalClasses: stats.total,
              attendedCount: stats.attended,
              attendancePercentage: percentage
            });
          }
        }
      });
    }

    res.json({
      success: true,
      data: {
        course: {
          _id: course._id,
          name: course.name,
          courseCode: course.courseCode
        },
        students: studentRoster,
        totalCount: studentRoster.length
      }
    });
  } catch (error) {
    next(error);
  }
}
