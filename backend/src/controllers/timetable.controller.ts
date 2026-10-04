import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import Timetable from "../models/Timetable.model";
import Course from "../models/Course.model";
import { notificationService } from "../services/notificationService";

export const getTimetable = async (req: AuthRequest, res: Response) => {
  try {
    const { departmentId, courseId, facultyId } = req.query;
    const query: any = { collegeId: req.user?.collegeId };

    if (req.user?.role === "student") {
      if (courseId) {
        query.courseId = courseId;
      } else {
        const studentCourses = await Course.find({ collegeId: req.user?.collegeId, studentIds: req.user?.id }).select("_id");
        const courseIds = studentCourses.map(c => c._id);
        if (courseIds.length > 0) {
          query.$or = [{ courseId: { $in: courseIds } }, { courseId: { $exists: false } }];
        }
      }
    } else if (req.user?.role === "faculty") {
      query.$or = [{ facultyId: facultyId || req.user?.id }, { facultyId: { $exists: false } }];
    } else if (req.user?.role === "admin" || req.user?.role === "college_admin" || req.user?.role === "hod" || req.user?.role === "department_admin") {
      if (departmentId) query.departmentId = departmentId;
      if (courseId) query.courseId = courseId;
      if (facultyId) query.facultyId = facultyId;
    }

    const records = await Timetable.find(query)
      .populate("courseId", "name courseCode")
      .populate("facultyId", "name email")
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.json({ success: true, data: records });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createTimetable = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;
    const userId = req.user?.id;
    const collegeId = req.user?.collegeId;

    if (!["faculty", "hod", "department_admin", "college_admin", "super_admin", "admin"].includes(role || "")) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    // If faculty, verify course assignment
    if (role === "faculty") {
      if (req.body.courseId) {
        const course = await Course.findOne({ _id: req.body.courseId, collegeId });
        if (!course || !course.facultyIds.some((f) => f.toString() === userId)) {
          return res.status(403).json({ success: false, error: "Unauthorized: You are not assigned to teach this course" });
        }
      }
    }

    const facultyId = req.body.facultyId || (role === "faculty" ? userId : undefined);

    const { room, ...safeBody } = req.body;

    const newRecord = new Timetable({
      ...safeBody,
      room: "", // Institutional rule: no room management
      facultyId,
      collegeId
    });

    await newRecord.save();

    const populated = await Timetable.findById(newRecord._id)
      .populate("courseId", "name courseCode")
      .populate("facultyId", "name email");

    // Notification to course students without room chatter
    if (newRecord.courseId && collegeId) {
      notificationService.notifyCourseStudents(
        collegeId,
        newRecord.courseId.toString(),
        "Schedule Update",
        `New ${newRecord.type || "class"} session scheduled for ${newRecord.dayOfWeek} at ${newRecord.startTime}`,
        "timetable"
      );
    }

    res.status(201).json({ success: true, data: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateTimetable = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;
    const userId = req.user?.id;
    const collegeId = req.user?.collegeId;

    if (!["faculty", "hod", "department_admin", "college_admin", "super_admin", "admin"].includes(role || "")) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    const existing = await Timetable.findOne({ _id: req.params.id, collegeId });
    if (!existing) return res.status(404).json({ success: false, error: "Not found" });

    // Faculty can only update their own timetable records or courses they teach
    if (role === "faculty" && existing.facultyId?.toString() !== userId) {
      return res.status(403).json({ success: false, error: "Unauthorized to edit this timetable entry" });
    }

    const { room, ...safeBody } = req.body;

    const updated = await Timetable.findOneAndUpdate(
      { _id: req.params.id, collegeId },
      { ...safeBody, room: "" },
      { new: true }
    )
      .populate("courseId", "name courseCode")
      .populate("facultyId", "name email");

    if (!updated) return res.status(404).json({ success: false, error: "Not found" });

    // Trigger clean notification
    if (updated.courseId && collegeId) {
      notificationService.notifyCourseStudents(
        collegeId,
        (updated.courseId as any)._id.toString(),
        "Schedule Changed",
        `Timetable entry updated for ${updated.dayOfWeek} at ${updated.startTime}`,
        "timetable"
      );
    }

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteTimetable = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;
    const userId = req.user?.id;
    const collegeId = req.user?.collegeId;

    if (!["faculty", "hod", "department_admin", "college_admin", "super_admin", "admin"].includes(role || "")) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    const existing = await Timetable.findOne({ _id: req.params.id, collegeId });
    if (!existing) return res.status(404).json({ success: false, error: "Not found" });

    if (role === "faculty" && existing.facultyId?.toString() !== userId) {
      return res.status(403).json({ success: false, error: "Unauthorized to delete this timetable entry" });
    }

    await Timetable.findOneAndDelete({ _id: req.params.id, collegeId });
    res.json({ success: true, message: "Deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
