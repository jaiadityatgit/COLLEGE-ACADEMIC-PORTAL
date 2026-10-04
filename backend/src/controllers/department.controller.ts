import { Response, NextFunction } from "express";
import Department from "../models/Department.model";
import Course from "../models/Course.model";
import User from "../models/User.model";
import { AuthRequest } from "../middleware/auth";

export async function createDepartment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { departmentCode, departmentName, description } = req.body;
    const collegeId = req.user?.collegeId;
    if (!collegeId) {
      res.status(400).json({ success: false, error: "College info missing" }); return;
    }
    const department = await Department.create({ collegeId, departmentCode, departmentName, description });
    res.status(201).json({ success: true, data: department });
  } catch (error) { next(error); }
}

export async function getDepartments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const collegeId = req.user?.collegeId;
    const departments = await Department.find({ collegeId, isArchived: false }).lean();
    res.json({ success: true, data: departments });
  } catch (error) { next(error); }
}

export async function updateDepartment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const collegeId = req.user?.collegeId;
    const updateData = req.body;
    const department = await Department.findOneAndUpdate(
      { _id: id, collegeId },
      { $set: updateData },
      { new: true }
    );
    if (!department) {
      res.status(404).json({ success: false, error: "Department not found" }); return;
    }
    res.json({ success: true, data: department });
  } catch (error) { next(error); }
}

export async function archiveDepartment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const collegeId = req.user?.collegeId;
    const department = await Department.findOneAndUpdate(
      { _id: id, collegeId },
      { $set: { isArchived: true } },
      { new: true }
    );
    if (!department) {
      res.status(404).json({ success: false, error: "Department not found" }); return;
    }
    res.json({ success: true, data: {} });
  } catch (error) { next(error); }
}

export async function getDepartmentCourses(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const collegeId = req.user?.collegeId;
    const courses = await Course.find({ departmentId: id, collegeId }).lean();
    res.json({ success: true, data: courses });
  } catch (error) { next(error); }
}

export async function assignCourseToDepartment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { courseId } = req.body;
    const collegeId = req.user?.collegeId;
    
    const course = await Course.findOneAndUpdate(
      { _id: courseId, collegeId },
      { $set: { departmentId: id } },
      { new: true }
    );
    
    if (!course) {
      res.status(404).json({ success: false, error: "Course not found" }); return;
    }
    
    // Update course count
    await Department.updateOne(
      { _id: id, collegeId },
      { $inc: { courseCount: 1 } }
    );
    
    res.json({ success: true, data: course });
  } catch (error) { next(error); }
}

export async function getMyDepartment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const collegeId = req.user?.collegeId;
    const userId = req.user?.id;
    
    let departmentId = null;
    if (req.user?.role === "student") {
      const Student = require("../models/Student.model").default;
      const student = await Student.findOne({ userId, collegeId });
      departmentId = student?.departmentId;
    } else {
      const user = await User.findOne({ _id: userId, collegeId });
      departmentId = user?.departmentId;
    }
    
    if (!departmentId) {
      res.status(404).json({ success: false, error: "No department assigned" }); return;
    }
    
    const department = await Department.findOne({ _id: departmentId, collegeId }).lean();
    const courses = await Course.find({ departmentId, collegeId }).lean();
    const faculty = await User.find({ departmentId, role: "faculty", collegeId }).select("name email").lean();
    
    res.json({ 
      success: true, 
      data: {
        department,
        courses,
        faculty
      }
    });
  } catch (error) { next(error); }
}
