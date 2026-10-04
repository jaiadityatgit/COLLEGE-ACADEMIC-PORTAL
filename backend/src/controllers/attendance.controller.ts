import { Response } from "express";
import Attendance from "../models/Attendance.model";
import Course from "../models/Course.model";
import User from "../models/User.model";
import { AuthRequest } from "../middleware/auth";
import { logAcademicCorrection } from "../services/auditService";

export const getAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, studentId, date, batchId, month, startDate, endDate } = req.query;
    const query: any = { collegeId: req.user?.collegeId };

    if (req.user?.role === "student") query.studentId = req.user?.id;
    else if (studentId) query.studentId = studentId;

    if (batchId) query.batchId = batchId;

    if (req.user?.role === "faculty") {
      if (courseId) {
        query.courseId = courseId;
      } else {
        query.facultyId = req.user?.id;
      }
    } else if (courseId) {
      query.courseId = courseId;
    }

    if (date) {
      query.date = date;
    } else if (month) {
      query.date = { $regex: `^${String(month).trim()}` };
    } else if (startDate && endDate) {
      query.date = { $gte: String(startDate), $lte: String(endDate) };
    }

    const records = await Attendance.find(query)
      .populate("studentId", "name email")
      .populate("courseId", "courseCode title name")
      .populate("facultyId", "name")
      .sort({ date: -1 });

    res.json({ success: true, data: records });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const ALLOWED_ATTENDANCE_STATUSES = ["present", "absent", "od"];

export const markAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role || "";
    const collegeId = req.user?.collegeId;
    const userId = req.user?.id;

    if (!["faculty", "hod", "department_admin", "college_admin", "super_admin", "admin"].includes(role)) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    const { studentId, courseId, date, sessionType, status, remarks, notebookId, batchId } = req.body;

    if (!studentId || !courseId || !date || !status) {
      return res.status(400).json({ success: false, error: "Missing required attendance fields (studentId, courseId, date, status)" });
    }

    const normalizedStatus = String(status).toLowerCase().trim();
    if (!ALLOWED_ATTENDANCE_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({ success: false, error: `Invalid status "${status}". Allowed: present, absent, od` });
    }

    // Verify course belongs to college
    const course = await Course.findOne({ _id: courseId, collegeId });
    if (!course) {
      return res.status(404).json({ success: false, error: "Course not found" });
    }

    // Faculty course assignment check
    if (role === "faculty" && userId) {
      const isAssigned = course.facultyIds.some((f) => f.toString() === userId);
      if (!isAssigned) {
        return res.status(403).json({ success: false, error: "Unauthorized: You are not assigned to teach this course" });
      }
    }

    // Student enrollment check
    const isEnrolled = course.studentIds.some((s) => s.toString() === studentId.toString());
    if (!isEnrolled) {
      return res.status(400).json({ success: false, error: "Student is not enrolled in this course" });
    }

    const existing = await Attendance.findOne({ collegeId, studentId, courseId, date });
    const prevStatus = existing?.status;

    const record = await Attendance.findOneAndUpdate(
      { collegeId, studentId, courseId, date },
      { 
        status: normalizedStatus, 
        sessionType: sessionType || "lecture", 
        remarks, 
        facultyId: userId, 
        collegeId,
        ...(notebookId && { notebookId }),
        ...(batchId && { batchId })
      },
      { new: true, upsert: true }
    );

    if (existing && prevStatus && prevStatus !== normalizedStatus) {
      logAcademicCorrection({
        collegeId,
        actorId: userId,
        actorRole: role,
        action: "attendance_correction",
        entityType: "attendance",
        entityId: record._id.toString(),
        courseId,
        studentId,
        previousValue: { status: prevStatus },
        newValue: { status: normalizedStatus },
        reason: remarks || req.body.reason
      });
    }

    res.json({ success: true, data: record });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const markBulkAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role || "";
    const collegeId = req.user?.collegeId;
    const userId = req.user?.id;

    if (!["faculty", "hod", "department_admin", "college_admin", "super_admin", "admin"].includes(role)) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    const { courseId, date, sessionType, records, batchId, reason } = req.body;

    if (!courseId || !date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, error: "Course ID, date, and non-empty records array are required" });
    }

    // Verify course belongs to college
    const course = await Course.findOne({ _id: courseId, collegeId });
    if (!course) {
      return res.status(404).json({ success: false, error: "Course not found" });
    }

    // Faculty course assignment check
    if (role === "faculty" && userId) {
      const isAssigned = course.facultyIds.some((f) => f.toString() === userId);
      if (!isAssigned) {
        return res.status(403).json({ success: false, error: "Unauthorized: You are not assigned to teach this course" });
      }
    }

    const enrolledStudentIds = new Set(course.studentIds.map((s) => s.toString()));

    for (const record of records) {
      if (!record.studentId || !enrolledStudentIds.has(record.studentId.toString())) {
        return res.status(400).json({ success: false, error: `Student ${record.studentId} is not enrolled in this course` });
      }
      const st = String(record.status || "").toLowerCase().trim();
      if (!ALLOWED_ATTENDANCE_STATUSES.includes(st)) {
        return res.status(400).json({ success: false, error: `Invalid status "${record.status}". Allowed: present, absent, od` });
      }
    }

    // Fetch existing records to detect corrections for audit log
    const studentIds = records.map((r: any) => r.studentId);
    const existingRecords = await Attendance.find({
      collegeId,
      courseId,
      date,
      studentId: { $in: studentIds }
    }).select("studentId status");
    const existingMap = new Map(existingRecords.map((e: any) => [e.studentId.toString(), e]));

    const bulkOps = records.map((record: any) => ({
      updateOne: {
        filter: { collegeId, studentId: record.studentId, courseId, date },
        update: {
          $set: {
            status: String(record.status).toLowerCase().trim(),
            sessionType: sessionType || "lecture",
            remarks: record.remarks,
            facultyId: userId,
            collegeId,
            ...(batchId && { batchId })
          }
        },
        upsert: true
      }
    }));

    if (bulkOps.length > 0) {
      await Attendance.bulkWrite(bulkOps);
    }

    // Record audit trails on status change
    for (const r of records) {
      const existing = existingMap.get(r.studentId.toString());
      const newStatus = String(r.status).toLowerCase().trim();
      if (existing && existing.status !== newStatus) {
        logAcademicCorrection({
          collegeId,
          actorId: userId,
          actorRole: role,
          action: "attendance_correction",
          entityType: "attendance",
          entityId: existing._id.toString(),
          courseId,
          studentId: r.studentId,
          previousValue: { status: existing.status },
          newValue: { status: newStatus },
          reason: r.remarks || reason
        });
      }
    }

    res.json({ success: true, message: `Bulk attendance marked for ${records.length} students` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role || "";
    if (!["faculty", "hod", "department_admin", "college_admin", "super_admin", "admin"].includes(role)) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    const { status, sessionType, remarks, reason } = req.body;
    
    // Find record first
    const record = await Attendance.findOne({ _id: req.params.id, collegeId: req.user?.collegeId });
    if (!record) return res.status(404).json({ success: false, error: "Record not found" });

    // Enforce faculty restriction (faculty can only update their own records or records for courses they teach)
    if (req.user?.role === "faculty" && record.facultyId.toString() !== req.user?.id) {
      return res.status(403).json({ success: false, error: "Cannot edit this record" });
    }

    const oldStatus = record.status;
    const normalizedStatus = status ? String(status).toLowerCase().trim() : record.status;
    if (status && !ALLOWED_ATTENDANCE_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({ success: false, error: `Invalid status "${status}". Allowed: present, absent, od` });
    }

    record.status = normalizedStatus as any;
    record.sessionType = sessionType || record.sessionType;
    record.remarks = remarks !== undefined ? remarks : record.remarks;
    
    await record.save();

    if (status && oldStatus !== normalizedStatus) {
      logAcademicCorrection({
        collegeId: req.user?.collegeId,
        actorId: req.user?.id,
        actorRole: role,
        action: "attendance_correction",
        entityType: "attendance",
        entityId: record._id.toString(),
        courseId: record.courseId,
        studentId: record.studentId,
        previousValue: { status: oldStatus },
        newValue: { status: normalizedStatus },
        reason: remarks || reason
      });
    }

    res.json({ success: true, data: record });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role || "";
    if (!["hod", "department_admin", "college_admin", "super_admin", "admin"].includes(role)) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    await Attendance.findOneAndDelete({ _id: req.params.id, collegeId: req.user?.collegeId });
    res.json({ success: true, message: "Deleted" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getAttendanceSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, courseId, batchId } = req.query;
    
    let matchStage: any = { collegeId: req.user?.collegeId };
    const mongoose = require("mongoose");
    if (req.user?.role === "student") {
      matchStage.studentId = new mongoose.Types.ObjectId(req.user?.id);
    } else if (studentId) {
      matchStage.studentId = new mongoose.Types.ObjectId(studentId as string);
    }

    if (courseId) {
      matchStage.courseId = new mongoose.Types.ObjectId(courseId as string);
    }
    
    if (batchId) {
      matchStage.batchId = new mongoose.Types.ObjectId(batchId as string);
    }

    const summary = await Attendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { courseId: "$courseId", studentId: "$studentId" },
          totalClasses: { $sum: 1 },
          presentCount: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
          odCount: { $sum: { $cond: [{ $eq: ["$status", "od"] }, 1, 0] } },
          absentCount: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
          lateCount: { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } },
          excusedCount: { $sum: { $cond: [{ $eq: ["$status", "excused"] }, 1, 0] } },
          attendedCount: { $sum: { $cond: [{ $in: ["$status", ["present", "od", "late"]] }, 1, 0] } }
        }
      },
      {
        $project: {
          courseId: "$_id.courseId",
          studentId: "$_id.studentId",
          totalClasses: 1,
          presentCount: 1,
          odCount: 1,
          absentCount: 1,
          lateCount: 1,
          excusedCount: 1,
          attendedCount: 1,
          percentage: {
            $cond: [
              { $gt: ["$totalClasses", 0] },
              {
                $multiply: [
                  { $divide: ["$attendedCount", "$totalClasses"] },
                  100
                ]
              },
              0
            ]
          }
        }
      }
    ]);

    // Batch populate course and student details (prevents N+1 query overhead)
    const courseIds = [...new Set(summary.map((s: any) => s.courseId?.toString()).filter(Boolean))];
    const studentIds = [...new Set(summary.map((s: any) => s.studentId?.toString()).filter(Boolean))];

    const [courses, students] = await Promise.all([
      Course.find({ _id: { $in: courseIds } }).select("courseCode title"),
      User.find({ _id: { $in: studentIds } }).select("name email")
    ]);

    const courseMap = new Map(courses.map((c: any) => [c._id.toString(), c]));
    const studentMap = new Map(students.map((u: any) => [u._id.toString(), u]));

    for (const item of summary) {
      item.course = courseMap.get(item.courseId?.toString()) || null;
      item.student = studentMap.get(item.studentId?.toString()) || null;
    }

    res.json({ success: true, data: summary });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
