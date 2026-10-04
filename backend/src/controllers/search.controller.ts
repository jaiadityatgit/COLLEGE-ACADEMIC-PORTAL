import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import Source from "../models/Source.model";
import Department from "../models/Department.model";
import Course from "../models/Course.model";
import Assignment from "../models/Assignment.model";
import Announcement from "../models/Announcement.model";
import User from "../models/User.model";

export async function globalSearch(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      res.status(400).json({ success: false, error: "Query is required" });
      return;
    }

    const regexQuery = { $regex: query, $options: "i" };
    const collegeId = req.user?.collegeId;

    // Search across all LMS entities
    const [departments, courses, assignments, announcements, students, sources] = await Promise.all([
      Department.find({
        collegeId,
        $or: [{ departmentName: regexQuery }, { departmentCode: regexQuery }]
      }).limit(3).lean(),

      Course.find({
        collegeId,
        $or: [{ name: regexQuery }, { courseCode: regexQuery }]
      }).limit(3).lean(),

      Assignment.find({
        collegeId,
        $or: [{ title: regexQuery }, { instructions: regexQuery }, { description: regexQuery }],
        status: { $ne: "closed" }
      }).limit(3).lean(),

      Announcement.find({
        collegeId,
        $or: [{ title: regexQuery }, { body: regexQuery }],
        isArchived: false
      }).limit(3).lean(),

      User.find({
        collegeId,
        role: "student",
        $or: [{ name: regexQuery }, { email: regexQuery }]
      }).limit(3).lean(),

      Source.find({
        collegeId,
        isActive: { $ne: false },
        name: regexQuery
      }).limit(5).lean()
    ]);

    const formattedDepartments = departments.map(d => ({
      id: d._id.toString(),
      sourceName: d.departmentName,
      snippet: d.description || `Department: ${d.departmentCode}`,
      confidence: 1.0,
      appearsIn: ["department"]
    }));

    const formattedCourses = courses.map(c => ({
      id: c._id.toString(),
      sourceName: c.name,
      snippet: c.description || `Course: ${c.courseCode}`,
      confidence: 1.0,
      appearsIn: ["course"]
    }));

    const formattedAssignments = assignments.map(a => ({
      id: a._id.toString(),
      sourceName: a.title,
      snippet: a.description || a.instructions || "Assignment",
      confidence: 1.0,
      appearsIn: ["assignment"]
    }));

    const formattedAnnouncements = announcements.map(a => ({
      id: a._id.toString(),
      sourceName: a.title,
      snippet: a.body,
      confidence: 1.0,
      appearsIn: ["announcement"]
    }));

    const formattedStudents = students.map(s => ({
      id: s._id.toString(),
      sourceName: s.name,
      snippet: `Student | ${s.email}`,
      confidence: 1.0,
      appearsIn: ["student"]
    }));

    const formattedSources = sources.map(s => ({
      id: s._id.toString(),
      sourceName: s.name,
      snippet: `Course Material (${s.type.toUpperCase()})`,
      confidence: 1.0,
      appearsIn: ["course_material"]
    }));

    res.status(200).json({
      success: true,
      data: [
        ...formattedDepartments,
        ...formattedCourses,
        ...formattedAssignments,
        ...formattedAnnouncements,
        ...formattedStudents,
        ...formattedSources
      ]
    });
  } catch (error) {
    next(error);
  }
}
