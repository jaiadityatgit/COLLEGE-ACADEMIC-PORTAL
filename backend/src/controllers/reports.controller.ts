import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import Attendance from "../models/Attendance.model";
import Assignment from "../models/Assignment.model";
import Submission from "../models/Submission.model";
import Grade from "../models/Grade.model";
import Course from "../models/Course.model";
import mongoose from "mongoose";

/**
 * Reports & Analytics Controller for EE-VDT Department OS
 */
export async function getAttendanceReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const collegeId = req.user?.collegeId;
    const { courseId } = req.query;

    const match: any = { collegeId: new mongoose.Types.ObjectId(collegeId) };
    if (courseId) match.courseId = new mongoose.Types.ObjectId(courseId as string);

    const stats = await Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const byStudent = await Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$studentId",
          total: { $sum: 1 },
          present: {
            $sum: {
              $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          studentId: "$_id",
          total: 1,
          present: 1,
          percentage: {
            $multiply: [{ $divide: ["$present", "$total"] }, 100]
          }
        }
      },
      { $sort: { percentage: 1 } }
    ]);

    // Populate student names
    const populatedStudents = await Promise.all(
      byStudent.map(async (item) => {
        const student = await mongoose.model("User").findById(item.studentId).select("name email rollNumber").lean();
        return {
          student,
          total: item.total,
          present: item.present,
          percentage: Math.round(item.percentage)
        };
      })
    );

    res.json({
      success: true,
      data: {
        summary: stats,
        studentRoster: populatedStudents,
        atRiskCount: populatedStudents.filter(s => s.percentage < 75).length
      }
    });
  } catch (error) { next(error); }
}

export async function getAssignmentsReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const collegeId = req.user?.collegeId;
    const { courseId } = req.query;

    const query: any = { collegeId };
    if (courseId) query.courseId = courseId;

    const assignments = await Assignment.find(query).lean();
    const assignmentIds = assignments.map(a => a._id);

    const submissions = await Submission.find({ assignmentId: { $in: assignmentIds }, collegeId }).lean();

    const report = assignments.map(a => {
      const subs = submissions.filter(s => s.assignmentId.toString() === a._id.toString());
      const graded = subs.filter(s => s.status === "graded");
      const avgMarks = graded.length > 0
        ? Math.round(graded.reduce((acc, s) => acc + (s.marks || 0), 0) / graded.length)
        : 0;

      return {
        assignmentId: a._id,
        title: a.title,
        dueDate: a.dueDate,
        totalMarks: a.totalMarks,
        totalSubmissions: subs.length,
        gradedSubmissions: graded.length,
        averageMarks: avgMarks
      };
    });

    res.json({ success: true, data: report });
  } catch (error) { next(error); }
}

export async function getGradesReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const collegeId = req.user?.collegeId;
    const { courseId } = req.query;

    const match: any = { collegeId: new mongoose.Types.ObjectId(collegeId) };
    if (courseId) match.courseId = new mongoose.Types.ObjectId(courseId as string);

    const grades = await Grade.find(match).populate("studentId", "name email rollNumber").lean();

    const distribution = {
      A: grades.filter(g => (g.marksObtained / g.maxMarks) >= 0.9).length,
      B: grades.filter(g => (g.marksObtained / g.maxMarks) >= 0.8 && (g.marksObtained / g.maxMarks) < 0.9).length,
      C: grades.filter(g => (g.marksObtained / g.maxMarks) >= 0.7 && (g.marksObtained / g.maxMarks) < 0.8).length,
      D: grades.filter(g => (g.marksObtained / g.maxMarks) >= 0.6 && (g.marksObtained / g.maxMarks) < 0.7).length,
      F: grades.filter(g => (g.marksObtained / g.maxMarks) < 0.6).length,
    };

    res.json({
      success: true,
      data: {
        totalGradeEntries: grades.length,
        distribution,
        grades
      }
    });
  } catch (error) { next(error); }
}

