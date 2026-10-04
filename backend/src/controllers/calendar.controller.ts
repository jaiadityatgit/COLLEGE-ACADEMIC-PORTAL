import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import CalendarEvent from "../models/CalendarEvent.model";
import Announcement from "../models/Announcement.model";
import Course from "../models/Course.model";

export const getEvents = async (req: AuthRequest, res: Response) => {
  try {
    const query: any = { collegeId: req.user?.collegeId };
    
    const { audienceId, type } = req.query;
    if (audienceId) {
      query.$or = [{ audience: "global" }, { audienceId }];
    }
    if (type) {
      query.type = type;
    }

    const events = await CalendarEvent.find(query).sort({ startDate: 1 });
    res.json({ success: true, data: events });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role || "";
    const collegeId = req.user?.collegeId;
    const userId = req.user?.id;

    if (!["faculty", "hod", "department_admin", "college_admin", "super_admin", "admin"].includes(role)) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    const { title, description, type, startDate, endDate, audience, audienceId, notifyAudience } = req.body;

    if (!title || !startDate || !type) {
      return res.status(400).json({ success: false, error: "Title, type, and start date are required" });
    }

    // Institutional Rule: Only HOD and Admins can declare official holidays
    if (type === "holiday" && !["hod", "department_admin", "college_admin", "super_admin", "admin"].includes(role)) {
      return res.status(403).json({ success: false, error: "Only HOD and Administrators can declare official holidays" });
    }

    // Faculty can only create course-level events for courses they teach
    if (role === "faculty") {
      if (audience === "course" && audienceId) {
        const course = await Course.findOne({ _id: audienceId, collegeId });
        if (!course || !course.facultyIds.some((f) => f.toString() === userId)) {
          return res.status(403).json({ success: false, error: "Unauthorized: You are not assigned to this course" });
        }
      } else if (audience === "department" || audience === "global") {
        return res.status(403).json({ success: false, error: "Faculty can only create course-level calendar entries" });
      }
    }

    const newEvent = new CalendarEvent({
      title: String(title).trim(),
      description: description ? String(description).trim() : undefined,
      type,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      audience: audience || (type === "holiday" ? "global" : "global"),
      audienceId: audienceId || undefined,
      collegeId
    });

    await newEvent.save();

    // High-signal institutional notice for declared holidays
    if (type === "holiday" && notifyAudience !== false) {
      try {
        const dateStr = new Date(startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        await Announcement.create({
          title: `Holiday Notice: ${title}`,
          body: `Please note that ${dateStr} has been declared an official institutional holiday.${description ? ` Note: ${description}` : ""}`,
          type: "academic",
          priority: "high",
          authorId: userId,
          collegeId,
          audience: "college",
          isPinned: false
        });
      } catch (announcementErr) {
        // Non-blocking for holiday event creation
        console.warn("Could not auto-generate holiday announcement:", announcementErr);
      }
    }

    res.status(201).json({ success: true, data: newEvent });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateEvent = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role || "";
    const collegeId = req.user?.collegeId;
    const userId = req.user?.id;

    if (!["faculty", "hod", "department_admin", "college_admin", "super_admin", "admin"].includes(role)) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    const existing = await CalendarEvent.findOne({ _id: req.params.id, collegeId });
    if (!existing) return res.status(404).json({ success: false, error: "Event not found" });

    if (existing.type === "holiday" && !["hod", "department_admin", "college_admin", "super_admin", "admin"].includes(role)) {
      return res.status(403).json({ success: false, error: "Only HOD and Administrators can modify holidays" });
    }

    if (role === "faculty" && existing.audience === "course" && existing.audienceId) {
      const course = await Course.findOne({ _id: existing.audienceId, collegeId });
      if (!course || !course.facultyIds.some((f) => f.toString() === userId)) {
        return res.status(403).json({ success: false, error: "Unauthorized to edit this event" });
      }
    }

    const updated = await CalendarEvent.findOneAndUpdate(
      { _id: req.params.id, collegeId },
      req.body,
      { new: true }
    );

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role || "";
    const collegeId = req.user?.collegeId;

    if (!["faculty", "hod", "department_admin", "college_admin", "super_admin", "admin"].includes(role)) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    const existing = await CalendarEvent.findOne({ _id: req.params.id, collegeId });
    if (!existing) return res.status(404).json({ success: false, error: "Event not found" });

    if (existing.type === "holiday" && !["hod", "department_admin", "college_admin", "super_admin", "admin"].includes(role)) {
      return res.status(403).json({ success: false, error: "Only HOD and Administrators can delete holidays" });
    }

    await CalendarEvent.findOneAndDelete({ _id: req.params.id, collegeId });
    res.json({ success: true, message: "Deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
