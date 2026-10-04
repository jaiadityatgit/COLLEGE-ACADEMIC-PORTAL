import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import Exam from "../models/Exam.model";
import Course from "../models/Course.model";

export const getExams = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.query;
    const query: any = { collegeId: req.user?.collegeId };

    if (courseId) query.courseId = courseId;
    
    // For students, ideally filter by their enrolled courses
    if (req.user?.role === "student") {
       // A quick hack: get all active courses for student
       const courses = await Course.find({ studentIds: req.user?.id, collegeId: req.user?.collegeId }).select("_id").lean();
       const cIds = courses.map(c => c._id);
       query.courseId = { $in: cIds };
    } else if (req.user?.role === "faculty" && !courseId) {
       const courses = await Course.find({ facultyIds: req.user?.id, collegeId: req.user?.collegeId }).select("_id").lean();
       const cIds = courses.map(c => c._id);
       query.$or = [{ courseId: { $in: cIds } }, { facultyId: req.user?.id }];
    }

    const exams = await Exam.find(query)
      .populate("courseId", "name courseCode")
      .populate("facultyId", "name email")
      .sort({ date: 1, startTime: 1 });

    res.json({ success: true, data: exams });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createExam = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role || "";
    if (!["faculty", "hod", "department_admin", "college_admin", "super_admin", "admin"].includes(role)) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }
    const newExam = new Exam({ ...req.body, collegeId: req.user?.collegeId, facultyId: req.body.facultyId || req.user?.id });
    await newExam.save();
    res.status(201).json({ success: true, data: newExam });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateExam = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role || "";
    if (!["faculty", "hod", "department_admin", "college_admin", "super_admin", "admin"].includes(role)) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }
    const updated = await Exam.findOneAndUpdate(
      { _id: req.params.id, collegeId: req.user?.collegeId },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteExam = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role || "";
    if (!["faculty", "hod", "department_admin", "college_admin", "super_admin", "admin"].includes(role)) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }
    await Exam.findOneAndDelete({ _id: req.params.id, collegeId: req.user?.collegeId });
    res.json({ success: true, message: "Deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
