import mongoose from "mongoose";
import Notification from "../models/Notification.model";
import Course from "../models/Course.model";
import User from "../models/User.model";

/**
 * Central Notification Engine for EE-VDT Department OS
 */
export const notificationService = {
  /**
   * Create a single notification for a specific user
   */
  notifyUser: async (
    collegeId: string | mongoose.Types.ObjectId,
    userId: string | mongoose.Types.ObjectId,
    title: string,
    message: string,
    type: "attendance" | "grade" | "announcement" | "system" | "exam" | "assignment" | "timetable",
    actionUrl?: string
  ) => {
    try {
      return await Notification.create({
        collegeId,
        userId,
        title,
        message,
        type,
        actionUrl,
      });
    } catch (err) {
      console.error("[notificationService] Failed to notify user:", err);
    }
  },

  /**
   * Notify all students enrolled in a specific course
   */
  notifyCourseStudents: async (
    collegeId: string | mongoose.Types.ObjectId,
    courseId: string | mongoose.Types.ObjectId,
    title: string,
    message: string,
    type: "attendance" | "grade" | "announcement" | "system" | "exam" | "assignment" | "timetable",
    actionUrl?: string
  ) => {
    try {
      const course = await Course.findById(courseId).select("studentIds name courseCode").lean();
      if (!course || !course.studentIds || course.studentIds.length === 0) return;

      const docs = course.studentIds.map((studentId) => ({
        collegeId,
        userId: studentId,
        title,
        message,
        type,
        actionUrl: actionUrl || `/subjects/${courseId}`,
      }));

      await Notification.insertMany(docs);
    } catch (err) {
      console.error("[notificationService] Failed to notify course students:", err);
    }
  },

  /**
   * Notify all students in the college / department
   */
  notifyAllDepartmentStudents: async (
    collegeId: string | mongoose.Types.ObjectId,
    title: string,
    message: string,
    type: "attendance" | "grade" | "announcement" | "system" | "exam" | "assignment" | "timetable",
    actionUrl?: string
  ) => {
    try {
      const students = await User.find({ collegeId, role: "student", isActive: true }).select("_id").lean();
      if (students.length === 0) return;

      const docs = students.map((st) => ({
        collegeId,
        userId: st._id,
        title,
        message,
        type,
        actionUrl,
      }));

      await Notification.insertMany(docs);
    } catch (err) {
      console.error("[notificationService] Failed to notify department students:", err);
    }
  },
};
