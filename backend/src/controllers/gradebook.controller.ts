import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import Grade from "../models/Grade.model";
import Course from "../models/Course.model";
import User from "../models/User.model";
import mongoose from "mongoose";
import { logAcademicCorrection } from "../services/auditService";

export const getGrades = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, studentId } = req.query;
    const query: any = { collegeId: req.user?.collegeId };

    if (req.user?.role === "student") {
      query.studentId = req.user?.id;
    } else if (studentId) {
      query.studentId = studentId;
    }

    if (courseId) {
      query.courseId = courseId;
    }

    const grades = await Grade.find(query)
      .populate("studentId", "name email")
      .populate("courseId", "name courseCode")
      .populate("examId", "title type")
      .populate("gradedBy", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: grades });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addGrade = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role || "";
    const collegeId = req.user?.collegeId;
    const userId = req.user?.id;

    if (!["faculty", "hod", "department_admin", "college_admin", "super_admin", "admin"].includes(role)) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    const { studentId, courseId, marksObtained, maxMarks, title, type, weightage, remarks, examId, assignmentId, reason } = req.body;

    if (!studentId || !courseId || marksObtained === undefined || maxMarks === undefined) {
      return res.status(400).json({ success: false, error: "Missing required fields (studentId, courseId, marksObtained, maxMarks)" });
    }

    const numMarksObtained = Number(marksObtained);
    const numMaxMarks = Number(maxMarks);

    if (isNaN(numMarksObtained) || isNaN(numMaxMarks) || numMarksObtained < 0 || numMaxMarks <= 0) {
      return res.status(400).json({ success: false, error: "Invalid marks: Obtained marks must be >= 0 and Max marks must be > 0" });
    }

    if (numMarksObtained > numMaxMarks) {
      return res.status(400).json({ success: false, error: "Marks obtained cannot exceed maximum marks" });
    }

    const course = await Course.findOne({ _id: courseId, collegeId });
    if (!course) {
      return res.status(404).json({ success: false, error: "Course not found" });
    }

    if (role === "faculty" && userId) {
      const isAssigned = course.facultyIds.some((f) => f.toString() === userId);
      if (!isAssigned) {
        return res.status(403).json({ success: false, error: "Unauthorized: You are not assigned to teach this course" });
      }
    }

    const isEnrolled = course.studentIds.some((s) => s.toString() === studentId.toString());
    if (!isEnrolled) {
      return res.status(400).json({ success: false, error: "Student is not enrolled in this course" });
    }

    const assessmentTitle = (title || "Internal Assessment").trim();
    const assessmentType = type || "internal";

    const filterQuery: any = {
      collegeId,
      studentId,
      courseId,
      title: assessmentTitle
    };
    if (examId) filterQuery.examId = examId;
    if (assignmentId) filterQuery.assignmentId = assignmentId;

    const existingGrade = await Grade.findOne(filterQuery);

    const updatedGrade = await Grade.findOneAndUpdate(
      filterQuery,
      {
        collegeId,
        studentId,
        courseId,
        title: assessmentTitle,
        type: assessmentType,
        marksObtained: numMarksObtained,
        maxMarks: numMaxMarks,
        weightage: weightage !== undefined ? Number(weightage) : 0,
        remarks: remarks ? String(remarks).trim() : undefined,
        gradedBy: userId,
        ...(examId && { examId }),
        ...(assignmentId && { assignmentId })
      },
      { new: true, upsert: true, runValidators: true }
    );

    if (existingGrade && (existingGrade.marksObtained !== numMarksObtained || existingGrade.maxMarks !== numMaxMarks)) {
      logAcademicCorrection({
        collegeId,
        actorId: userId,
        actorRole: role,
        action: "mark_correction",
        entityType: "grade",
        entityId: updatedGrade._id.toString(),
        courseId,
        studentId,
        previousValue: { marksObtained: existingGrade.marksObtained, maxMarks: existingGrade.maxMarks },
        newValue: { marksObtained: numMarksObtained, maxMarks: numMaxMarks },
        reason: remarks || reason
      });
    }

    res.status(200).json({ success: true, data: updatedGrade });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addBulkGrades = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role || "";
    const collegeId = req.user?.collegeId;
    const userId = req.user?.id;

    if (!["faculty", "hod", "department_admin", "college_admin", "super_admin", "admin"].includes(role)) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    const { courseId, title, type, maxMarks, weightage, records, examId, assignmentId } = req.body;

    if (!courseId || !title || maxMarks === undefined || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, error: "Course ID, title, maxMarks, and non-empty records array are required" });
    }

    const numMaxMarks = Number(maxMarks);
    if (isNaN(numMaxMarks) || numMaxMarks <= 0) {
      return res.status(400).json({ success: false, error: "Max marks must be a positive number" });
    }

    const course = await Course.findOne({ _id: courseId, collegeId });
    if (!course) {
      return res.status(404).json({ success: false, error: "Course not found" });
    }

    if (role === "faculty" && userId) {
      const isAssigned = course.facultyIds.some((f) => f.toString() === userId);
      if (!isAssigned) {
        return res.status(403).json({ success: false, error: "Unauthorized: You are not assigned to teach this course" });
      }
    }

    const enrolledIds = new Set(course.studentIds.map((s) => s.toString()));
    const assessmentTitle = String(title).trim();
    const assessmentType = type || "internal";
    const numWeightage = weightage !== undefined ? Number(weightage) : 0;

    // Fetch existing grades to detect corrections for audit logging
    const targetStudentIds = records.map((r: any) => r.studentId);
    const existingGrades = await Grade.find({
      collegeId,
      courseId,
      title: assessmentTitle,
      studentId: { $in: targetStudentIds }
    }).select("studentId marksObtained maxMarks");
    const existingGradeMap = new Map(existingGrades.map((g: any) => [g.studentId.toString(), g]));

    const bulkOps = [];

    for (const r of records) {
      if (!r.studentId || !enrolledIds.has(r.studentId.toString())) {
        return res.status(400).json({ success: false, error: `Student ${r.studentId} is not enrolled in this course` });
      }

      const numMarks = Number(r.marksObtained);
      if (isNaN(numMarks) || numMarks < 0 || numMarks > numMaxMarks) {
        return res.status(400).json({ success: false, error: `Invalid marks ${r.marksObtained} for student ${r.studentId}. Must be between 0 and ${numMaxMarks}` });
      }

      const filter: any = {
        collegeId,
        studentId: r.studentId,
        courseId,
        title: assessmentTitle
      };
      if (examId) filter.examId = examId;
      if (assignmentId) filter.assignmentId = assignmentId;

      bulkOps.push({
        updateOne: {
          filter,
          update: {
            $set: {
              collegeId,
              studentId: r.studentId,
              courseId,
              title: assessmentTitle,
              type: assessmentType,
              marksObtained: numMarks,
              maxMarks: numMaxMarks,
              weightage: numWeightage,
              remarks: r.remarks ? String(r.remarks).trim() : undefined,
              gradedBy: userId,
              ...(examId && { examId }),
              ...(assignmentId && { assignmentId })
            }
          },
          upsert: true
        }
      });
    }

    if (bulkOps.length > 0) {
      await Grade.bulkWrite(bulkOps);
    }

    // Record audit trails for corrections
    for (const r of records) {
      const existing = existingGradeMap.get(r.studentId.toString());
      const numMarks = Number(r.marksObtained);
      if (existing && (existing.marksObtained !== numMarks || existing.maxMarks !== numMaxMarks)) {
        logAcademicCorrection({
          collegeId,
          actorId: userId,
          actorRole: role,
          action: "mark_correction",
          entityType: "grade",
          entityId: existing._id.toString(),
          courseId,
          studentId: r.studentId,
          previousValue: { marksObtained: existing.marksObtained, maxMarks: existing.maxMarks },
          newValue: { marksObtained: numMarks, maxMarks: numMaxMarks },
          reason: r.remarks || req.body.reason
        });
      }
    }

    res.json({ success: true, message: `Grades recorded for ${records.length} students` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateGrade = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role || "";
    const collegeId = req.user?.collegeId;
    const userId = req.user?.id;

    if (!["faculty", "hod", "department_admin", "college_admin", "super_admin", "admin"].includes(role)) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    const existingGrade = await Grade.findOne({ _id: req.params.id, collegeId });
    if (!existingGrade) return res.status(404).json({ success: false, error: "Grade record not found" });

    if (role === "faculty" && userId) {
      const course = await Course.findOne({ _id: existingGrade.courseId, collegeId });
      if (!course || !course.facultyIds.some((f) => f.toString() === userId)) {
        return res.status(403).json({ success: false, error: "Unauthorized to edit grades for this course" });
      }
    }

    const { marksObtained, maxMarks, remarks, weightage, reason } = req.body;
    const oldMarks = existingGrade.marksObtained;
    const oldMax = existingGrade.maxMarks;

    if (marksObtained !== undefined) {
      const numMarks = Number(marksObtained);
      const effectiveMax = maxMarks !== undefined ? Number(maxMarks) : existingGrade.maxMarks;
      if (isNaN(numMarks) || numMarks < 0 || numMarks > effectiveMax) {
        return res.status(400).json({ success: false, error: "Invalid marks obtained" });
      }
      existingGrade.marksObtained = numMarks;
    }

    if (maxMarks !== undefined) {
      const numMax = Number(maxMarks);
      if (isNaN(numMax) || numMax <= 0 || numMax < existingGrade.marksObtained) {
        return res.status(400).json({ success: false, error: "Invalid maximum marks" });
      }
      existingGrade.maxMarks = numMax;
    }

    if (remarks !== undefined) existingGrade.remarks = remarks;
    if (weightage !== undefined) existingGrade.weightage = Number(weightage);
    existingGrade.gradedBy = new mongoose.Types.ObjectId(userId) as any;

    await existingGrade.save();

    if (oldMarks !== existingGrade.marksObtained || oldMax !== existingGrade.maxMarks) {
      logAcademicCorrection({
        collegeId,
        actorId: userId,
        actorRole: role,
        action: "mark_correction",
        entityType: "grade",
        entityId: existingGrade._id.toString(),
        courseId: existingGrade.courseId,
        studentId: existingGrade.studentId,
        previousValue: { marksObtained: oldMarks, maxMarks: oldMax },
        newValue: { marksObtained: existingGrade.marksObtained, maxMarks: existingGrade.maxMarks },
        reason: remarks || reason
      });
    }

    res.json({ success: true, data: existingGrade });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteGrade = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role || "";
    if (!["hod", "department_admin", "college_admin", "super_admin", "admin"].includes(role)) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }
    await Grade.findOneAndDelete({ _id: req.params.id, collegeId: req.user?.collegeId });
    res.json({ success: true, message: "Deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Compute Semester Results (CGPA)
export const getResults = async (req: AuthRequest, res: Response) => {
  try {
    const targetStudentId = req.user?.role === "student" ? req.user?.id : req.query.studentId;
    if (!targetStudentId) {
      return res.status(400).json({ success: false, error: "Student ID required" });
    }

    // Aggregation to compute total marks per course
    const results = await Grade.aggregate([
      { $match: { collegeId: new mongoose.Types.ObjectId(req.user?.collegeId), studentId: new mongoose.Types.ObjectId(targetStudentId as string) } },
      { 
        $group: {
          _id: "$courseId",
          totalObtained: { $sum: { $multiply: ["$marksObtained", { $divide: [{ $ifNull: ["$weightage", 100] }, 100] }] } },
          totalMax: { $sum: { $multiply: ["$maxMarks", { $divide: [{ $ifNull: ["$weightage", 100] }, 100] }] } },
        }
      }
    ]);

    const courseIds = results.map((r) => r._id);
    const courses = await Course.find({ _id: { $in: courseIds } }).select("title courseCode").lean();
    const courseMap = new Map(courses.map((c: any) => [c._id.toString(), c]));

    let overallCGPA = 0;
    let cgpaSum = 0;
    let totalCourses = 0;

    const transcript = [];
    for (const r of results) {
      const course = courseMap.get(r._id?.toString()) || { title: "Course", courseCode: "" };
      const percentage = r.totalMax > 0 ? (r.totalObtained / r.totalMax) * 100 : 0;
      let gradeLetter = "F";
      let gradePoint = 0;
      
      if (percentage >= 90) { gradeLetter = "A"; gradePoint = 4.0; }
      else if (percentage >= 80) { gradeLetter = "B"; gradePoint = 3.0; }
      else if (percentage >= 70) { gradeLetter = "C"; gradePoint = 2.0; }
      else if (percentage >= 60) { gradeLetter = "D"; gradePoint = 1.0; }

      if (r.totalMax > 0) {
        cgpaSum += gradePoint;
        totalCourses++;
      }

      transcript.push({
        course,
        totalObtained: r.totalObtained,
        totalMax: r.totalMax,
        percentage,
        gradeLetter,
        gradePoint
      });
    }

    if (totalCourses > 0) {
      overallCGPA = Number((cgpaSum / totalCourses).toFixed(2));
    }

    res.json({ success: true, data: { transcript, overallCGPA } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
