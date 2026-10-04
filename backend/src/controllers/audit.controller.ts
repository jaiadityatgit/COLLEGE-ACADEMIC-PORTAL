import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import AuditLog from "../models/AuditLog.model";

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role || "";
    if (!["hod", "department_admin", "college_admin", "super_admin", "admin"].includes(role)) {
      return res.status(403).json({ success: false, error: "Unauthorized: Access restricted to HOD and Administrators" });
    }

    const { courseId, studentId, entityType, limit = 50, page = 1 } = req.query;
    const query: any = { collegeId: req.user?.collegeId };

    if (courseId) query.courseId = courseId;
    if (studentId) query.studentId = studentId;
    if (entityType) query.entityType = entityType;

    const numLimit = Math.min(100, Math.max(1, Number(limit)));
    const numPage = Math.max(1, Number(page));
    const skip = (numPage - 1) * numLimit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate("actorId", "name email role designation")
        .populate("studentId", "name email")
        .populate("courseId", "name courseCode")
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(numLimit)
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: numPage,
        limit: numLimit,
        pages: Math.ceil(total / numLimit)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
