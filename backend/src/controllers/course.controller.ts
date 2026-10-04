import { Response, NextFunction } from "express";
import Course from "../models/Course.model";
import Notebook from "../models/Notebook.model";
import Student from "../models/Student.model";
import User from "../models/User.model";
import { AuthRequest } from "../middleware/auth";
import mongoose from "mongoose";

export async function createCourse(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, courseCode, description, semester, academicYear } = req.body;
    const collegeId = req.user?.collegeId;
    const userId = req.user?.id;

    if (!collegeId || !userId) {
      res.status(400).json({ success: false, error: "User or college info missing" });
      return;
    }

    const course = await Course.create({
      name,
      courseCode,
      description,
      semester,
      academicYear,
      collegeId,
      facultyIds: req.user?.role === "faculty" ? [userId] : []
    });

    if (req.user?.role === "faculty") {
      await User.updateOne(
        { _id: userId },
        { $addToSet: { assignedCourseIds: course._id } }
      );
    }

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
}

export async function getCourses(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    const collegeId = req.user?.collegeId;
    const role = req.user?.role;

    if (!collegeId || !userId) {
      res.status(400).json({ success: false, error: "User or college info missing" });
      return;
    }

    const filter: any = { collegeId, status: "active" };
    if (role === "faculty") {
      filter.facultyIds = userId;
    } else if (role === "student") {
      const studentDoc = await Student.findOne({ userId, collegeId }).select("enrolledCourseIds").lean();
      const enrolled = (studentDoc?.enrolledCourseIds || []).filter(Boolean);
      if (enrolled.length > 0) {
        filter.$or = [
          { studentIds: userId },
          { _id: { $in: enrolled } }
        ];
      } else {
        filter.studentIds = userId;
      }
    }

    const courses = await Course.find(filter)
      .populate("facultyIds", "name email designation")
      .lean();

    const courseIds = courses.map((c: any) => c._id);
    const notebooks = await Notebook.find({ collegeId, courseId: { $in: courseIds } }).lean();

    const result = courses.map((course: any) => {
      const nb = notebooks.find((n: any) => n.courseId?.toString() === course._id.toString());
      return {
        ...course,
        studentCount: course.studentIds?.length || 0,
        facultyCount: course.facultyIds?.length || 0,
        notebookId: nb ? nb._id : undefined,
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getCourseById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { courseId } = req.params;
    const collegeId = req.user?.collegeId;

    if (!collegeId) {
      res.status(400).json({ success: false, error: "College info missing" });
      return;
    }

    const course = await Course.findOne({ _id: courseId, collegeId })
      .populate("facultyIds", "name email designation")
      .lean();

    if (!course) {
      res.status(404).json({ success: false, error: "Course not found" });
      return;
    }

    // Role-based student enrollment authorization check
    const role = req.user?.role;
    const userId = req.user?.id;
    if (role === "student" && userId) {
      const isEnrolled = course.studentIds.some((sId) => sId.toString() === userId);
      if (!isEnrolled) {
        res.status(403).json({ success: false, error: "Unauthorized: Student is not enrolled in this course" });
        return;
      }
    }

    // Find or create associated Notebook for this course
    let notebook = await Notebook.findOne({ courseId: course._id, collegeId });
    if (!notebook) {
      notebook = await Notebook.create({
        name: `${course.courseCode || course.name} Workspace`,
        description: `Subject workspace for ${course.name}`,
        courseId: course._id,
        collegeId,
        userId: req.user!.id,
        template: course.courseType === "lab" ? "engineering" : "blank"
      });
    }

    res.json({
      success: true,
      data: {
        ...course,
        notebookId: notebook._id
      }
    });
  } catch (error) {
    next(error);
  }
}



export async function getCourseStudents(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { courseId } = req.params;
    const collegeId = req.user?.collegeId;

    const course = await Course.findOne({ _id: courseId, collegeId });
    if (!course) {
      res.status(404).json({ success: false, error: "Course not found" });
      return;
    }

    if (req.user?.role === "student") {
      const isEnrolled = course.studentIds.some(sId => sId.toString() === req.user?.id);
      if (!isEnrolled) {
        res.status(403).json({ success: false, error: "Unauthorized: Student is not enrolled in this course" });
        return;
      }
    }

    const students = await User.find({ _id: { $in: course.studentIds }, collegeId }).select("name email role").lean();
    const studentDetails = await Student.find({ userId: { $in: course.studentIds }, collegeId }).lean();

    const data = students.map(u => {
      const details = studentDetails.find(s => s.userId.toString() === u._id.toString());
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        rollNumber: details?.rollNumber,
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getCourseFaculty(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { courseId } = req.params;
    const collegeId = req.user?.collegeId;

    const course = await Course.findOne({ _id: courseId, collegeId });
    if (!course) {
      res.status(404).json({ success: false, error: "Course not found" });
      return;
    }

    if (req.user?.role === "student") {
      const isEnrolled = course.studentIds.some(sId => sId.toString() === req.user?.id);
      if (!isEnrolled) {
        res.status(403).json({ success: false, error: "Unauthorized: Student is not enrolled in this course" });
        return;
      }
    }

    const faculty = await User.find({ _id: { $in: course.facultyIds }, collegeId }).select("name email role").lean();
    res.json({ success: true, data: faculty });
  } catch (error) {
    next(error);
  }
}

export async function enrollStudent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { courseId } = req.params;
    const { studentId } = req.body;
    const collegeId = req.user?.collegeId;

    if (!studentId) {
      res.status(400).json({ success: false, error: "studentId is required" });
      return;
    }

    const isIdValid = mongoose.isValidObjectId(studentId);
    const [course, studentRecord] = await Promise.all([
      Course.findOne({ _id: courseId, collegeId }),
      Student.findOne({
        collegeId,
        $or: [
          { userId: studentId },
          ...(isIdValid ? [{ _id: studentId }] : [])
        ]
      })
    ]);

    if (!course || !studentRecord) {
      res.status(404).json({ success: false, error: "Course or Student not found" });
      return;
    }

    const actualUserId = studentRecord.userId;

    if (!course.studentIds.some(sId => sId.toString() === actualUserId.toString())) {
      course.studentIds.push(actualUserId as any);
      await course.save();
    }

    if (!studentRecord.enrolledCourseIds.some((c: any) => c.toString() === course._id.toString())) {
      studentRecord.enrolledCourseIds.push(course._id as any);
      await studentRecord.save();
    }

    res.json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
}

export async function removeStudent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { courseId, studentId } = req.params;
    const collegeId = req.user?.collegeId;

    const isIdValid = mongoose.isValidObjectId(studentId);
    const [course, studentRecord] = await Promise.all([
      Course.findOne({ _id: courseId, collegeId }),
      Student.findOne({
        collegeId,
        $or: [
          { userId: studentId },
          ...(isIdValid ? [{ _id: studentId }] : [])
        ]
      })
    ]);

    if (!course || !studentRecord) {
      res.status(404).json({ success: false, error: "Course or Student not found" });
      return;
    }

    const actualUserId = studentRecord.userId;

    await Course.updateOne(
      { _id: courseId },
      { $pull: { studentIds: actualUserId } }
    );

    await Student.updateOne(
      { _id: studentRecord._id },
      { $pull: { enrolledCourseIds: courseId } }
    );

    res.json({ success: true, message: "Student removed from course" });
  } catch (error) {
    next(error);
  }
}

export async function assignFaculty(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { courseId } = req.params;
    const { facultyIds } = req.body; // Array of user IDs
    const collegeId = req.user?.collegeId;

    if (!Array.isArray(facultyIds)) {
      res.status(400).json({ success: false, error: "facultyIds must be an array" });
      return;
    }

    const course = await Course.findOne({ _id: courseId, collegeId });
    if (!course) {
      res.status(404).json({ success: false, error: "Course not found" });
      return;
    }

    const oldFacultyIds = course.facultyIds.map(id => id.toString());

    // 1. Update Course
    course.facultyIds = facultyIds.map(id => new mongoose.Types.ObjectId(id));
    await course.save();

    // 2. Remove assignedCourseId from old faculty members who are no longer assigned
    const removedIds = oldFacultyIds.filter(id => !facultyIds.includes(id));
    if (removedIds.length > 0) {
      await User.updateMany(
        { _id: { $in: removedIds } },
        { $pull: { assignedCourseIds: course._id } }
      );
    }

    // 3. Add assignedCourseId to new faculty members
    const addedIds = facultyIds.filter(id => !oldFacultyIds.includes(id));
    if (addedIds.length > 0) {
      await User.updateMany(
        { _id: { $in: addedIds } },
        { $addToSet: { assignedCourseIds: course._id } }
      );
    }

    res.json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
}
