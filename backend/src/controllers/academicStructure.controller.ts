import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import Department from "../models/Department.model";
import Batch from "../models/Batch.model";
import Semester from "../models/Semester.model";
import Course from "../models/Course.model";
import Student from "../models/Student.model";
import TeachingAssignment from "../models/TeachingAssignment.model";
import AuditLog from "../models/AuditLog.model";
import mongoose from "mongoose";

export async function getHierarchy(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const collegeId = req.user?.collegeId;
    if (!collegeId) {
      res.status(400).json({ success: false, error: "College context missing" });
      return;
    }

    const requestedYear = (req.query.academicYear as string)?.trim();

    const [departments, batches, semesters, courses, teachingAssignments, students] = await Promise.all([
      Department.find({ collegeId, isArchived: false }).lean(),
      Batch.find({ collegeId, isActive: true }).lean(),
      Semester.find({ collegeId }).lean(),
      Course.find({ collegeId, status: "active" }).lean(),
      TeachingAssignment.find({ collegeId, status: "active" }).populate("facultyId", "name email").lean(),
      Student.find({ collegeId }).select("departmentId batchId section currentSemesterId enrolledCourseIds rollNumber").lean()
    ]);

    // Discover all distinct academic years
    const yearSet = new Set<string>();
    semesters.forEach(s => { if (s.academicYear) yearSet.add(s.academicYear.trim()); });
    batches.forEach(b => { if (b.academicYear) yearSet.add(b.academicYear.trim()); });
    courses.forEach(c => { if (c.academicYear) yearSet.add(c.academicYear.trim()); });
    teachingAssignments.forEach(t => { if (t.academicYear) yearSet.add(t.academicYear.trim()); });

    if (yearSet.size === 0) {
      yearSet.add("2026-27");
      yearSet.add("2025-26");
    }

    const sortedYears = Array.from(yearSet).sort().reverse();
    const activeYears = requestedYear ? [requestedYear] : sortedYears;

    const hierarchy = activeYears.map(year => {
      const yearSemesters = semesters.filter(s => s.academicYear === year);

      const yearDepartments = departments.map(dept => {
        const deptIdStr = dept._id.toString();

        // Batches for this department
        const deptBatches = batches.filter(b => {
          const matchesDept = b.departmentId.toString() === deptIdStr;
          if (!matchesDept) return false;
          // Match academic year if batch has academicYear, or startYear/endYear
          if (b.academicYear) return b.academicYear === year;
          return true;
        });

        // Group into sections / cohorts
        const structuredBatches = deptBatches.map(batch => {
          const batchIdStr = batch._id.toString();
          const batchStudents = students.filter(s => s.batchId?.toString() === batchIdStr);

          // Get semesters relevant to this department / year
          const deptYearSemesters = yearSemesters.filter(s => s.departmentId.toString() === deptIdStr);

          const structuredSemesters = deptYearSemesters.map(sem => {
            const semNum = String(sem.number);
            const semName = sem.name;

            // Courses for this department & semester
            const semCourses = courses.filter(c => {
              const cDept = c.departmentId ? c.departmentId.toString() : null;
              if (cDept && cDept !== deptIdStr) return false;
              // Check semester match by number or name
              const cSem = String(c.semester || "").trim();
              const semMatch = cSem === semNum || cSem.toLowerCase() === semName.toLowerCase() || cSem.includes(semNum);
              // Check year match
              const cYear = c.academicYear?.trim();
              const yearMatch = !cYear || cYear === year;
              return semMatch && yearMatch;
            });

            const structuredCourses = semCourses.map(course => {
              const cIdStr = course._id.toString();
              const assignments = teachingAssignments.filter(t =>
                t.courseId.toString() === cIdStr &&
                t.academicYear === year &&
                (!t.batchId || t.batchId.toString() === batchIdStr)
              );

              const enrolledStudents = students.filter(s =>
                s.batchId?.toString() === batchIdStr &&
                (s.enrolledCourseIds?.some((id: any) => id.toString() === cIdStr) ||
                 course.studentIds?.some((id: any) => id.toString() === s.userId?.toString()))
              );

              return {
                _id: course._id,
                name: course.name,
                courseCode: course.courseCode,
                credits: course.credits || 3,
                courseType: course.courseType || "theory",
                facultyAssignments: assignments.map((a: any) => ({
                  _id: a._id,
                  facultyId: a.facultyId?._id,
                  facultyName: a.facultyId?.name,
                  facultyEmail: a.facultyId?.email,
                  section: a.section || batch.section || "A"
                })),
                assignedFacultyCount: assignments.length || course.facultyIds?.length || 0,
                enrolledStudentCount: enrolledStudents.length || (course.studentIds?.length ?? 0)
              };
            });

            return {
              _id: sem._id,
              name: sem.name,
              number: sem.number,
              isActive: sem.isActive,
              courses: structuredCourses
            };
          });

          return {
            _id: batch._id,
            name: batch.name,
            code: batch.code,
            section: batch.section || "A",
            startYear: batch.startYear,
            endYear: batch.endYear,
            academicYear: batch.academicYear || year,
            studentCount: batchStudents.length || batch.studentCount || 0,
            semesters: structuredSemesters
          };
        });

        return {
          _id: dept._id,
          departmentCode: dept.departmentCode,
          departmentName: dept.departmentName,
          batches: structuredBatches
        };
      });

      return {
        academicYear: year,
        departments: yearDepartments
      };
    });

    res.json({
      success: true,
      data: {
        academicYears: sortedYears,
        hierarchy
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function createAcademicYear(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { academicYear, startDate, endDate } = req.body;
    const collegeId = req.user?.collegeId;
    const role = req.user?.role;

    if (role !== "college_admin" && role !== "super_admin") {
      res.status(403).json({ success: false, error: "Only admins can create academic years" });
      return;
    }

    if (!academicYear) {
      res.status(400).json({ success: false, error: "academicYear is required (e.g., '2026-27')" });
      return;
    }

    // Register a baseline semester record representing the academic year
    let department = await Department.findOne({ collegeId, isArchived: false });
    if (!department) {
      department = await Department.create({
        collegeId,
        departmentCode: "GEN",
        departmentName: "General Academic"
      });
    }

    const sDate = startDate ? new Date(startDate) : new Date();
    const eDate = endDate ? new Date(endDate) : new Date(new Date().setFullYear(new Date().getFullYear() + 1));

    const semester = await Semester.findOneAndUpdate(
      { collegeId, departmentId: department._id, academicYear: academicYear.trim(), number: 1 },
      {
        $setOnInsert: {
          name: "Semester 1",
          startDate: sDate,
          endDate: eDate,
          isActive: true
        }
      },
      { upsert: true, new: true }
    );

    // Audit creation
    await AuditLog.create({
      collegeId,
      actorId: req.user!.id,
      actorRole: role,
      action: "academic_structure_create",
      entityType: "academic_structure",
      entityId: academicYear,
      newValue: { academicYear, startDate: sDate, endDate: eDate },
      reason: `Registered academic year ${academicYear}`
    });

    res.status(201).json({ success: true, data: { academicYear, semester } });
  } catch (error) {
    next(error);
  }
}

export async function transitionSemester(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { batchId, studentIds, targetSemesterId, enrollCourseIds } = req.body;
    const collegeId = req.user?.collegeId;
    const role = req.user?.role;

    if (!["college_admin", "super_admin", "hod", "department_admin"].includes(role || "")) {
      res.status(403).json({ success: false, error: "Unauthorized to transition semesters" });
      return;
    }

    if (!targetSemesterId) {
      res.status(400).json({ success: false, error: "targetSemesterId is required" });
      return;
    }

    const targetSemester = await Semester.findOne({ _id: targetSemesterId, collegeId });
    if (!targetSemester) {
      res.status(404).json({ success: false, error: "Target semester not found" });
      return;
    }

    const query: any = { collegeId };
    if (batchId) query.batchId = batchId;
    if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
      query.userId = { $in: studentIds };
    }

    const students = await Student.find(query);
    if (students.length === 0) {
      res.status(404).json({ success: false, error: "No matching students found to transition" });
      return;
    }

    const updateDoc: any = { currentSemesterId: targetSemester._id };
    if (enrollCourseIds && Array.isArray(enrollCourseIds)) {
      updateDoc.$addToSet = { enrolledCourseIds: { $each: enrollCourseIds } };
    }

    await Student.updateMany(query, updateDoc);

    // If courses were provided, also add students to course.studentIds
    if (enrollCourseIds && Array.isArray(enrollCourseIds) && enrollCourseIds.length > 0) {
      const userIds = students.map(s => s.userId);
      await Course.updateMany(
        { _id: { $in: enrollCourseIds }, collegeId },
        { $addToSet: { studentIds: { $each: userIds } } }
      );
    }

    // Update batch's currentSemesterId if batchId specified
    if (batchId) {
      await Batch.updateOne({ _id: batchId, collegeId }, { currentSemesterId: targetSemester._id });
    }

    // Audit transition
    await AuditLog.create({
      collegeId,
      actorId: req.user!.id,
      actorRole: role || "admin",
      action: "semester_transition",
      entityType: "academic_structure",
      entityId: batchId || targetSemesterId,
      newValue: {
        batchId,
        targetSemesterId,
        studentCount: students.length,
        enrollCourseIds
      },
      reason: `Transitioned ${students.length} students to ${targetSemester.name} (${targetSemester.academicYear})`
    });

    res.json({
      success: true,
      message: `Successfully transitioned ${students.length} students to ${targetSemester.name}`,
      data: {
        transitionedCount: students.length,
        targetSemester: targetSemester.name
      }
    });
  } catch (error) {
    next(error);
  }
}
