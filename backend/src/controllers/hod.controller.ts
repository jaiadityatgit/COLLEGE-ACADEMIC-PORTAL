import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import mongoose from "mongoose";
import User from "../models/User.model";
import Student from "../models/Student.model";
import Course from "../models/Course.model";
import Lab from "../models/Lab.model";
import Semester from "../models/Semester.model";
import Announcement from "../models/Announcement.model";
import Attendance from "../models/Attendance.model";
import Grade from "../models/Grade.model";
import Assignment from "../models/Assignment.model";
import Submission from "../models/Submission.model";
import FacultyProfile from "../models/FacultyProfile.model";
import Timetable from "../models/Timetable.model";
import Source from "../models/Source.model";
import Batch from "../models/Batch.model";
import Department from "../models/Department.model";

async function resolveDepartmentId(req: AuthRequest): Promise<string | null> {
  const userId = req.user?.id;
  const collegeId = req.user?.collegeId;
  const user = await User.findOne({ _id: userId, collegeId }).lean();
  return user?.departmentId?.toString() || null;
}

export async function getDashboardOverview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const collegeId = req.user?.collegeId;
    const departmentId = await resolveDepartmentId(req);
    if (!departmentId) { res.status(400).json({ success: false, error: "No department assigned" }); return; }

    const collegeObjectId = new mongoose.Types.ObjectId(collegeId);

    // Fetch primary collections first
    const [
      department,
      students,
      facultyList,
      courses,
      labs,
      activeSemesters,
      announcements
    ] = await Promise.all([
      Department.findOne({ _id: departmentId, collegeId }).lean(),
      Student.find({ departmentId, collegeId }).lean(),
      User.find({ departmentId, collegeId, role: { $in: ["faculty", "hod"] }, isActive: true }).select("name email").lean(),
      Course.find({ departmentId, collegeId, status: "active" }).lean(),
      Lab.find({ departmentId, collegeId, isActive: true }).lean(),
      Semester.find({ departmentId, collegeId, isActive: true }).lean(),
      Announcement.find({ departmentId, collegeId, isArchived: false }).sort({ createdAt: -1 }).limit(5).populate("authorId", "name").lean()
    ]);

    const deptCourseIds = courses.map(c => c._id);
    const deptFacultyIds = facultyList.map(u => u._id);
    const deptStudentUserIds = students.map(s => s.userId);
    const allUserIds = [...deptFacultyIds, ...deptStudentUserIds];
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Parallel secondary aggregations
    const [
      attendanceStats,
      gradeStats,
      recentActivity,
      attendanceTrend
    ] = await Promise.all([
      // Attendance aggregation
      (async () => {
        if (deptCourseIds.length === 0) return { total: 0, present: 0, percentage: 0 };
        const stats = await Attendance.aggregate([
          { $match: { courseId: { $in: deptCourseIds }, collegeId: collegeObjectId } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              present: { $sum: { $cond: [{ $in: ["$status", ["present", "od", "late"]] }, 1, 0] } }
            }
          }
        ]);
        const s = stats[0] || { total: 0, present: 0 };
        return { total: s.total, present: s.present, percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0 };
      })(),

      // Grade pass percentage
      (async () => {
        if (deptCourseIds.length === 0) return { total: 0, passed: 0, percentage: 0 };
        const grades = await Grade.find({ courseId: { $in: deptCourseIds }, collegeId }).lean();
        const total = grades.length;
        const passed = grades.filter(g => g.maxMarks > 0 && (g.marksObtained / g.maxMarks) >= 0.4).length;
        return { total, passed, percentage: total > 0 ? Math.round((passed / total) * 100) : 0 };
      })(),

      // Recent department activity
      Promise.resolve([]),

      // 7-day attendance trend
      deptCourseIds.length > 0 ? Attendance.aggregate([
        { $match: { courseId: { $in: deptCourseIds }, collegeId: collegeObjectId, date: { $gte: sevenDaysAgo.toISOString().slice(0, 10) } } },
        {
          $group: {
            _id: "$date",
            total: { $sum: 1 },
            present: { $sum: { $cond: [{ $in: ["$status", ["present", "od", "late"]] }, 1, 0] } }
          }
        },
        { $sort: { _id: 1 } },
        { $project: { date: "$_id", total: 1, present: 1, percentage: { $cond: [{ $gt: ["$total", 0] }, { $multiply: [{ $divide: ["$present", "$total"] }, 100] }, 0] } } }
      ]) : Promise.resolve([])
    ]);

    res.json({
      success: true,
      data: {
        department,
        totalStudents: students.length,
        totalFaculty: facultyList.length,
        totalCourses: courses.length,
        totalLabs: labs.length,
        activeSemester: activeSemesters[0] || null,
        announcements,
        announcementCount: announcements.length,
        attendance: attendanceStats,
        passPercentage: gradeStats,
        attendanceTrend,
        recentActivity,
        faculty: facultyList,
        courses: courses.map(c => ({ _id: c._id, name: c.name, courseCode: c.courseCode, studentCount: c.studentIds?.length || 0, courseType: c.courseType }))
      }
    });
  } catch (error) { next(error); }
}

export async function getFacultyDirectory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const collegeId = req.user?.collegeId;
    const departmentId = await resolveDepartmentId(req);
    if (!departmentId) { res.status(400).json({ success: false, error: "No department assigned" }); return; }

    const collegeObjectId = new mongoose.Types.ObjectId(collegeId);

    // Primary fetches
    const [facultyUsers, courses] = await Promise.all([
      User.find({ departmentId, collegeId, role: { $in: ["faculty", "hod"] }, isActive: true }).select("name email role designation lastLogin").lean(),
      Course.find({ departmentId, collegeId, status: "active" }).lean()
    ]);

    const facultyIds = facultyUsers.map(f => f._id);

    // Secondary fetches - single batch aggregation for pending grading
    const allAssignments = await Assignment.find({ courseId: { $in: courses.map(c => c._id) }, collegeId }).select("_id courseId").lean();
    const assignmentIds = allAssignments.map(a => a._id);

    const [profiles, attendanceCounts, assignmentCounts, pendingSubmissions] = await Promise.all([
      FacultyProfile.find({ userId: { $in: facultyIds }, collegeId }).lean(),
      Attendance.aggregate([
        { $match: { facultyId: { $in: facultyIds }, collegeId: collegeObjectId } },
        { $group: { _id: "$facultyId", count: { $sum: 1 } } }
      ]),
      Assignment.aggregate([
        { $match: { createdBy: { $in: facultyIds }, collegeId: collegeObjectId } },
        { $group: { _id: "$createdBy", count: { $sum: 1 } } }
      ]),
      Submission.aggregate([
        { $match: { assignmentId: { $in: assignmentIds }, collegeId: collegeObjectId, status: { $in: ["submitted", "late"] } } },
        { $group: { _id: "$assignmentId", count: { $sum: 1 } } }
      ])
    ]);

    // Map assignment pending counts to courses and faculty
    const assignmentPendingMap: Record<string, number> = {};
    pendingSubmissions.forEach((p: any) => {
      assignmentPendingMap[p._id.toString()] = p.count;
    });

    const directory = facultyUsers.map((fac: any) => {
      const profile = profiles.find((p: any) => p.userId.toString() === fac._id.toString());
      const facCourses = courses.filter((c: any) => c.facultyIds.some((fid: any) => fid.toString() === fac._id.toString()));
      const facCourseIds = facCourses.map((c: any) => c._id.toString());
      
      const facAssignmentIds = allAssignments
        .filter((a: any) => facCourseIds.includes(a.courseId.toString()))
        .map((a: any) => a._id.toString());

      const pendingGrading = facAssignmentIds.reduce((sum, aid) => sum + (assignmentPendingMap[aid] || 0), 0);
      const attCount = attendanceCounts.find((a: any) => a._id.toString() === fac._id.toString())?.count || 0;
      const assignCount = assignmentCounts.find((a: any) => a._id.toString() === fac._id.toString())?.count || 0;

      return {
        _id: fac._id,
        name: fac.name,
        email: fac.email,
        role: fac.role,
        designation: profile?.designation || fac.designation || "Faculty",
        qualification: profile?.qualification || "",
        specialization: profile?.specialization || [],
        experience: profile?.experience || 0,
        employeeId: profile?.employeeId || "",
        officeRoom: profile?.officeRoom || "",
        officeHours: profile?.officeHours || "",
        subjectsHandled: facCourses.map((c: any) => ({ _id: c._id, name: c.name, courseCode: c.courseCode })),
        teachingHours: facCourses.length * 4,
        attendanceSessionsMarked: attCount,
        assignmentsCreated: assignCount,
        pendingGrading,
        lastLogin: fac.lastLogin
      };
    });

    res.json({ success: true, data: directory });
  } catch (error) { next(error); }
}

export async function getStudentAnalytics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const collegeId = req.user?.collegeId;
    const departmentId = await resolveDepartmentId(req);
    if (!departmentId) { res.status(400).json({ success: false, error: "No department assigned" }); return; }

    const { semester, section, courseId } = req.query;
    const collegeObjectId = new mongoose.Types.ObjectId(collegeId);

    // Get students with optional filters
    const studentFilter: any = { departmentId, collegeId };
    if (section) {
      const batch = await Batch.findOne({ departmentId, collegeId, section: section as string, isActive: true }).lean();
      if (batch) studentFilter.batchId = batch._id;
    }
    if (semester) {
      const sem = await Semester.findOne({ departmentId, collegeId, number: Number(semester) }).lean();
      if (sem) studentFilter.currentSemesterId = sem._id;
    }

    const students = await Student.find(studentFilter).populate("userId", "name email").lean();
    const studentUserIds = students.map(s => s.userId);

    // Course filter
    let deptCourseFilter: any = { departmentId, collegeId, status: "active" };
    if (courseId) deptCourseFilter._id = courseId;
    const deptCourses = await Course.find(deptCourseFilter).lean();
    const deptCourseIds = deptCourses.map(c => c._id);

    // Attendance per student
    const attendanceByStudent = await Attendance.aggregate([
      { $match: { studentId: { $in: studentUserIds.map(u => typeof u === 'object' && '_id' in u ? (u as any)._id : u) }, courseId: { $in: deptCourseIds }, collegeId: collegeObjectId } },
      {
        $group: {
          _id: "$studentId",
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $in: ["$status", ["present", "od", "late"]] }, 1, 0] } }
        }
      },
      { $project: { studentId: "$_id", total: 1, present: 1, percentage: { $cond: [{ $gt: ["$total", 0] }, { $multiply: [{ $divide: ["$present", "$total"] }, 100] }, 0] } } }
    ]);

    // Grades per student
    const gradesByStudent = await Grade.aggregate([
      { $match: { courseId: { $in: deptCourseIds }, collegeId: collegeObjectId } },
      {
        $group: {
          _id: "$studentId",
          totalMarksObtained: { $sum: "$marksObtained" },
          totalMaxMarks: { $sum: "$maxMarks" },
          gradeCount: { $sum: 1 }
        }
      },
      { $project: { studentId: "$_id", avgPercentage: { $cond: [{ $gt: ["$totalMaxMarks", 0] }, { $multiply: [{ $divide: ["$totalMarksObtained", "$totalMaxMarks"] }, 100] }, 0] }, gradeCount: 1 } }
    ]);

    // Attendance distribution buckets
    const distribution = { excellent: 0, good: 0, average: 0, poor: 0, critical: 0 };
    attendanceByStudent.forEach(a => {
      const pct = Math.round(a.percentage);
      if (pct >= 90) distribution.excellent++;
      else if (pct >= 75) distribution.good++;
      else if (pct >= 60) distribution.average++;
      else if (pct >= 40) distribution.poor++;
      else distribution.critical++;
    });

    // At-risk students
    const atRiskStudents = attendanceByStudent
      .filter(a => a.percentage < 75)
      .map(a => {
        const student = students.find(s => {
          const uid = typeof s.userId === 'object' && '_id' in s.userId ? (s.userId as any)._id : s.userId;
          return uid?.toString() === a._id?.toString();
        });
        return {
          studentId: a._id,
          name: student?.userId && typeof student.userId === 'object' && 'name' in student.userId ? (student.userId as any).name : "Unknown",
          rollNumber: student?.rollNumber || "",
          attendancePercentage: Math.round(a.percentage),
          totalClasses: a.total,
          present: a.present
        };
      })
      .sort((a, b) => a.attendancePercentage - b.attendancePercentage);

    // Top performers
    const topPerformers = gradesByStudent
      .filter(g => g.avgPercentage > 0)
      .sort((a, b) => b.avgPercentage - a.avgPercentage)
      .slice(0, 10)
      .map(g => {
        const student = students.find(s => {
          const uid = typeof s.userId === 'object' && '_id' in s.userId ? (s.userId as any)._id : s.userId;
          return uid?.toString() === g._id?.toString();
        });
        return {
          studentId: g._id,
          name: student?.userId && typeof student.userId === 'object' && 'name' in student.userId ? (student.userId as any).name : "Unknown",
          rollNumber: student?.rollNumber || "",
          avgPercentage: Math.round(g.avgPercentage),
          gradeCount: g.gradeCount
        };
      });

    // Weak subjects (lowest pass rate per course using single batch aggregation)
    const gradeStatsByCourse = await Grade.aggregate([
      { $match: { courseId: { $in: deptCourseIds }, collegeId: collegeObjectId } },
      {
        $group: {
          _id: "$courseId",
          total: { $sum: 1 },
          failed: { $sum: { $cond: [{ $lt: [{ $divide: ["$marksObtained", "$maxMarks"] }, 0.4] }, 1, 0] } }
        }
      }
    ]);

    const gradeMap: Record<string, { total: number; failed: number }> = {};
    gradeStatsByCourse.forEach(g => {
      gradeMap[g._id.toString()] = { total: g.total, failed: g.failed };
    });

    const weakSubjects = deptCourses.map(course => {
      const stats = gradeMap[course._id.toString()] || { total: 0, failed: 0 };
      return {
        courseId: course._id,
        courseName: course.name,
        courseCode: course.courseCode,
        totalGrades: stats.total,
        failCount: stats.failed,
        failRate: stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0
      };
    });
    weakSubjects.sort((a, b) => b.failRate - a.failRate);

    // Available filters
    const batches = await Batch.find({ departmentId, collegeId, isActive: true }).select("name section code").lean();
    const semesters = await Semester.find({ departmentId, collegeId }).select("name number").lean();

    res.json({
      success: true,
      data: {
        totalStudents: students.length,
        attendanceDistribution: distribution,
        atRiskStudents,
        topPerformers,
        weakSubjects: weakSubjects.slice(0, 10),
        filters: {
          batches,
          semesters: semesters.map(s => ({ _id: s._id, name: s.name, number: s.number })),
          courses: deptCourses.map(c => ({ _id: c._id, name: c.name, courseCode: c.courseCode }))
        }
      }
    });
  } catch (error) { next(error); }
}

export async function getCourseAnalytics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const collegeId = req.user?.collegeId;
    const departmentId = await resolveDepartmentId(req);
    if (!departmentId) { res.status(400).json({ success: false, error: "No department assigned" }); return; }

    const { courseId } = req.query;
    const collegeObjectId = new mongoose.Types.ObjectId(collegeId);
    const courseFilter: any = { departmentId, collegeId, status: "active" };
    if (courseId) courseFilter._id = courseId;

    const courses = await Course.find(courseFilter).populate("facultyIds", "name").lean();

    const analytics = await Promise.all(courses.map(async (course) => {
      const cid = course._id;

      const [attendanceData, assignments, submissions, grades, aiJobs, sources] = await Promise.all([
        Attendance.aggregate([
          { $match: { courseId: cid, collegeId: collegeObjectId } },
          {
            $group: {
              _id: "$date",
              total: { $sum: 1 },
              present: { $sum: { $cond: [{ $in: ["$status", ["present", "od", "late"]] }, 1, 0] } }
            }
          },
          { $sort: { _id: 1 } },
          { $project: { date: "$_id", total: 1, present: 1, percentage: { $cond: [{ $gt: ["$total", 0] }, { $multiply: [{ $divide: ["$present", "$total"] }, 100] }, 0] } } }
        ]),
        Assignment.find({ courseId: cid, collegeId }).lean(),
        Submission.find({ collegeId, assignmentId: { $in: (await Assignment.find({ courseId: cid, collegeId }).select("_id").lean()).map(a => a._id) } }).lean(),
        Grade.find({ courseId: cid, collegeId }).lean(),
        Promise.resolve(0),
        Source.find({ collegeId }).lean()
      ]);

      // Grade distribution
      const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
      grades.forEach((g: any) => {
        const pct = g.maxMarks > 0 ? g.marksObtained / g.maxMarks : 0;
        if (pct >= 0.9) gradeDistribution.A++;
        else if (pct >= 0.8) gradeDistribution.B++;
        else if (pct >= 0.7) gradeDistribution.C++;
        else if (pct >= 0.6) gradeDistribution.D++;
        else gradeDistribution.F++;
      });

      // Assignment completion rate
      const totalExpectedSubmissions = assignments.length * (course.studentIds?.length || 0);
      const completionRate = totalExpectedSubmissions > 0 ? Math.round((submissions.length / totalExpectedSubmissions) * 100) : 0;

      // Avg attendance
      const totalAttRecords = attendanceData.reduce((acc: number, d: any) => acc + d.total, 0);
      const totalPresent = attendanceData.reduce((acc: number, d: any) => acc + d.present, 0);
      const avgAttendance = totalAttRecords > 0 ? Math.round((totalPresent / totalAttRecords) * 100) : 0;

      return {
        _id: course._id,
        name: course.name,
        courseCode: course.courseCode,
        courseType: course.courseType,
        semester: course.semester,
        faculty: course.facultyIds,
        enrollment: course.studentIds?.length || 0,
        avgAttendance,
        attendanceTrend: attendanceData.slice(-14),
        assignmentCount: assignments.length,
        assignmentCompletion: completionRate,
        gradeDistribution,
        totalGrades: grades.length,
        resourceCount: sources.length,
        engagementScore: Math.min(100, Math.round((avgAttendance * 0.5) + (completionRate * 0.5)))
      };
    }));

    res.json({ success: true, data: analytics });
  } catch (error) { next(error); }
}

export async function getLabManagement(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const collegeId = req.user?.collegeId;
    const departmentId = await resolveDepartmentId(req);
    if (!departmentId) { res.status(400).json({ success: false, error: "No department assigned" }); return; }

    const labs = await Lab.find({ departmentId, collegeId, isActive: true })
      .populate("labInchargeId", "name email")
      .populate("courseIds", "name courseCode")
      .lean();

    const labRooms = labs.map(l => l.room);
    const schedules = await Timetable.find({ collegeId, room: { $in: labRooms }, type: "lab" })
      .populate("courseId", "name courseCode")
      .populate("facultyId", "name")
      .lean();

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const labData = labs.map(lab => {
      const labSchedule = schedules.filter(s => s.room === lab.room);
      const currentSession = labSchedule.find(s => s.dayOfWeek === currentDay && s.startTime <= currentTime && s.endTime > currentTime);

      return {
        ...lab,
        schedule: labSchedule.map(s => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          course: s.courseId,
          faculty: s.facultyId
        })),
        isOccupied: !!currentSession,
        currentSession: currentSession ? {
          course: currentSession.courseId,
          faculty: currentSession.facultyId,
          endTime: currentSession.endTime
        } : null
      };
    });

    res.json({ success: true, data: labData });
  } catch (error) { next(error); }
}

export async function getApprovalQueue(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const collegeId = req.user?.collegeId;
    const departmentId = await resolveDepartmentId(req);
    if (!departmentId) { res.status(400).json({ success: false, error: "No department assigned" }); return; }

    const pendingAnnouncements = await Announcement.find({
      departmentId,
      collegeId,
      isArchived: false,
      isPinned: false,
      priority: "high"
    }).populate("authorId", "name").sort({ createdAt: -1 }).lean();

    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCourses = await Course.find({
      departmentId,
      collegeId,
      createdAt: { $gte: thirtyDaysAgo }
    }).populate("facultyIds", "name").sort({ createdAt: -1 }).lean();

    const recentTimetable = await Timetable.find({
      departmentId,
      collegeId,
      updatedAt: { $gte: thirtyDaysAgo }
    }).populate("courseId", "name courseCode").populate("facultyId", "name").sort({ updatedAt: -1 }).lean();

    const items: any[] = [];

    pendingAnnouncements.forEach(a => items.push({
      _id: a._id,
      type: "announcement",
      title: a.title,
      description: a.body?.slice(0, 100) + (a.body && a.body.length > 100 ? "…" : ""),
      requester: (a.authorId as any)?.name || "Unknown",
      priority: a.priority,
      date: a.createdAt,
      status: "pending"
    }));

    recentCourses.forEach(c => items.push({
      _id: c._id,
      type: "course",
      title: `New Course: ${c.name}`,
      description: `${c.courseCode || ""} • ${c.courseType || "theory"} • ${c.studentIds?.length || 0} students`,
      requester: (c.facultyIds as any)?.[0]?.name || "Admin",
      priority: "normal",
      date: c.createdAt,
      status: "pending"
    }));

    recentTimetable.forEach(t => items.push({
      _id: t._id,
      type: "timetable",
      title: `Schedule: ${(t.courseId as any)?.name || "Course"}`,
      description: `Day ${t.dayOfWeek} • ${t.startTime}–${t.endTime}`,
      requester: (t.facultyId as any)?.name || "Unknown",
      priority: "normal",
      date: t.updatedAt,
      status: "pending"
    }));

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({ success: true, data: { items, counts: { announcements: pendingAnnouncements.length, courses: recentCourses.length, timetable: recentTimetable.length, total: items.length } } });
  } catch (error) { next(error); }
}

export async function processApproval(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { action, type } = req.body;
    const collegeId = req.user?.collegeId;

    if (!["approve", "reject"].includes(action)) {
      res.status(400).json({ success: false, error: "Action must be 'approve' or 'reject'" }); return;
    }

    if (type === "announcement") {
      const update = action === "approve" ? { isPinned: true } : { isArchived: true };
      await Announcement.findOneAndUpdate({ _id: id, collegeId }, { $set: update });
    } else if (type === "course") {
      const update = action === "approve" ? { status: "active" } : { status: "archived" };
      await Course.findOneAndUpdate({ _id: id, collegeId }, { $set: update });
    }

    res.json({ success: true, data: { id, action, type } });
  } catch (error) { next(error); }
}

export async function generateReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const collegeId = req.user?.collegeId;
    const departmentId = await resolveDepartmentId(req);
    if (!departmentId) { res.status(400).json({ success: false, error: "No department assigned" }); return; }

    const { type } = req.query;
    const collegeObjectId = new mongoose.Types.ObjectId(collegeId);

    const deptCourses = await Course.find({ departmentId, collegeId, status: "active" }).lean();
    const deptCourseIds = deptCourses.map(c => c._id);
    const deptStudents = await Student.find({ departmentId, collegeId }).populate("userId", "name email").lean();
    const deptFaculty = await User.find({ departmentId, collegeId, role: { $in: ["faculty", "hod"] } }).select("name email").lean();

    let reportData: any = null;
    let reportTitle = "";

    switch (type) {
      case "attendance": {
        reportTitle = "Department Attendance Report";
        const records = await Attendance.aggregate([
          { $match: { courseId: { $in: deptCourseIds }, collegeId: collegeObjectId } },
          {
            $group: {
              _id: { studentId: "$studentId", courseId: "$courseId" },
              total: { $sum: 1 },
              present: { $sum: { $cond: [{ $in: ["$status", ["present", "od", "late"]] }, 1, 0] } }
            }
          },
          {
            $lookup: { from: "users", localField: "_id.studentId", foreignField: "_id", as: "student" }
          },
          {
            $lookup: { from: "courses", localField: "_id.courseId", foreignField: "_id", as: "course" }
          },
          {
            $project: {
              studentName: { $arrayElemAt: ["$student.name", 0] },
              studentEmail: { $arrayElemAt: ["$student.email", 0] },
              courseName: { $arrayElemAt: ["$course.name", 0] },
              courseCode: { $arrayElemAt: ["$course.courseCode", 0] },
              total: 1, present: 1,
              percentage: { $cond: [{ $gt: ["$total", 0] }, { $multiply: [{ $divide: ["$present", "$total"] }, 100] }, 0] }
            }
          },
          { $sort: { percentage: 1 } }
        ]);
        reportData = { rows: records, columns: ["studentName", "studentEmail", "courseName", "courseCode", "total", "present", "percentage"] };
        break;
      }
      case "results": {
        reportTitle = "Department Results Report";
        const grades = await Grade.find({ courseId: { $in: deptCourseIds }, collegeId }).populate("studentId", "name email").populate("courseId", "name courseCode").lean();
        reportData = {
          rows: grades.map(g => ({
            studentName: (g.studentId as any)?.name || "",
            studentEmail: (g.studentId as any)?.email || "",
            courseName: (g.courseId as any)?.name || "",
            courseCode: (g.courseId as any)?.courseCode || "",
            type: g.type,
            title: g.title,
            marksObtained: g.marksObtained,
            maxMarks: g.maxMarks,
            percentage: Math.round((g.marksObtained / g.maxMarks) * 100)
          })),
          columns: ["studentName", "studentEmail", "courseName", "courseCode", "type", "title", "marksObtained", "maxMarks", "percentage"]
        };
        break;
      }
      case "faculty-workload": {
        reportTitle = "Faculty Workload Report";
        const rows = await Promise.all(deptFaculty.map(async (fac) => {
          const facCourses = deptCourses.filter(c => c.facultyIds.some(fid => fid.toString() === fac._id.toString()));
          const attCount = await Attendance.countDocuments({ facultyId: fac._id, collegeId });
          const assignCount = await Assignment.countDocuments({ createdBy: fac._id, collegeId });
          return {
            name: fac.name,
            email: fac.email,
            coursesCount: facCourses.length,
            courses: facCourses.map(c => c.name).join(", "),
            attendanceSessionsMarked: attCount,
            assignmentsCreated: assignCount
          };
        }));
        reportData = { rows, columns: ["name", "email", "coursesCount", "courses", "attendanceSessionsMarked", "assignmentsCreated"] };
        break;
      }
      case "student-performance": {
        reportTitle = "Student Performance Report";
        const studentUserIds = deptStudents.map(stu => {
          const uid = typeof stu.userId === 'object' && '_id' in stu.userId ? (stu.userId as any)._id : stu.userId;
          return new mongoose.Types.ObjectId(uid as string);
        });

        const [gradeAgg, attAgg] = await Promise.all([
          Grade.aggregate([
            { $match: { studentId: { $in: studentUserIds }, courseId: { $in: deptCourseIds }, collegeId: collegeObjectId } },
            {
              $group: {
                _id: "$studentId",
                totalObtained: { $sum: "$marksObtained" },
                totalMax: { $sum: "$maxMarks" },
                count: { $sum: 1 }
              }
            }
          ]),
          Attendance.aggregate([
            { $match: { studentId: { $in: studentUserIds }, courseId: { $in: deptCourseIds }, collegeId: collegeObjectId } },
            {
              $group: {
                _id: "$studentId",
                total: { $sum: 1 },
                present: { $sum: { $cond: [{ $in: ["$status", ["present", "od", "late"]] }, 1, 0] } }
              }
            }
          ])
        ]);

        const gradeMap: Record<string, { obt: number; max: number; count: number }> = {};
        gradeAgg.forEach(g => { gradeMap[g._id.toString()] = { obt: g.totalObtained, max: g.totalMax, count: g.count }; });

        const attMap: Record<string, { total: number; present: number }> = {};
        attAgg.forEach(a => { attMap[a._id.toString()] = { total: a.total, present: a.present }; });

        const rows = deptStudents.map(stu => {
          const uid = typeof stu.userId === 'object' && '_id' in stu.userId ? (stu.userId as any)._id : stu.userId;
          const uidStr = uid.toString();
          const g = gradeMap[uidStr] || { obt: 0, max: 0, count: 0 };
          const a = attMap[uidStr] || { total: 0, present: 0 };

          return {
            name: (stu.userId as any)?.name || "",
            email: (stu.userId as any)?.email || "",
            rollNumber: stu.rollNumber,
            gradeAverage: g.max > 0 ? Math.round((g.obt / g.max) * 100) : 0,
            totalAssessments: g.count,
            attendancePercentage: a.total > 0 ? Math.round((a.present / a.total) * 100) : 0
          };
        });

        reportData = { rows, columns: ["name", "email", "rollNumber", "gradeAverage", "totalAssessments", "attendancePercentage"] };
        break;
      }

      case "assignments": {
        reportTitle = "Assignment Statistics Report";
        const assignments = await Assignment.find({ courseId: { $in: deptCourseIds }, collegeId }).populate("courseId", "name courseCode").populate("createdBy", "name").lean();
        const rows = await Promise.all(assignments.map(async (a) => {
          const subs = await Submission.find({ assignmentId: a._id, collegeId }).lean();
          const graded = subs.filter(s => s.status === "graded");
          return {
            title: a.title,
            courseName: (a.courseId as any)?.name || "",
            courseCode: (a.courseId as any)?.courseCode || "",
            createdBy: (a.createdBy as any)?.name || "",
            dueDate: a.dueDate,
            totalMarks: a.totalMarks,
            submissions: subs.length,
            graded: graded.length,
            avgMarks: graded.length > 0 ? Math.round(graded.reduce((acc, s) => acc + (s.marks || 0), 0) / graded.length) : 0
          };
        }));
        reportData = { rows, columns: ["title", "courseName", "courseCode", "createdBy", "dueDate", "totalMarks", "submissions", "graded", "avgMarks"] };
        break;
      }
      default:
        res.status(400).json({ success: false, error: "Invalid report type. Use: attendance, results, faculty-workload, student-performance, assignments" });
        return;
    }

    res.json({ success: true, data: { title: reportTitle, ...reportData, generatedAt: new Date().toISOString() } });
  } catch (error) { next(error); }
}


