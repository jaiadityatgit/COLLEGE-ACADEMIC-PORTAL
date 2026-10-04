import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import User from "../models/User.model";
import Student from "../models/Student.model";
import FacultyProfile from "../models/FacultyProfile.model";
import Department from "../models/Department.model";
import Batch from "../models/Batch.model";
import Semester from "../models/Semester.model";
import Course from "../models/Course.model";
import AuditLog from "../models/AuditLog.model";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    let profileData: any = { user };

    if (user.role === "student") {
      const studentProfile = await Student.findOne({ userId: user._id })
        .populate("departmentId")
        .populate("batchId")
        .populate("currentSemesterId");
      profileData.studentProfile = studentProfile;
    } else if (user.role === "faculty") {
      const facultyProfile = await FacultyProfile.findOne({ userId: user._id })
        .populate("departmentId");
      profileData.facultyProfile = facultyProfile;
    }

    res.json({ success: true, data: profileData });
  } catch (error) {
    next(error);
  }
}

export async function getUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role, departmentId, batchId, search } = req.query;
    const collegeId = req.user?.collegeId;
    const filter: any = { collegeId };

    if (role) filter.role = role;
    if (departmentId) filter.departmentId = departmentId;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const users = await User.find(filter).select("-passwordHash").sort({ createdAt: -1 }).lean();

    // If role is student or all, join with Student profile
    if (role === "student" || !role) {
      const studentProfiles = await Student.find({ collegeId })
        .populate("departmentId", "departmentName departmentCode")
        .populate("batchId", "name code section")
        .populate("currentSemesterId", "name number academicYear")
        .lean();

      const studentMap = new Map<string, any>();
      studentProfiles.forEach(sp => studentMap.set(sp.userId.toString(), sp));

      const enriched = users.map(u => {
        const sp = studentMap.get(u._id.toString());
        return {
          ...u,
          rollNumber: sp?.rollNumber || "",
          section: sp?.section || sp?.batchId?.section || "",
          batchName: sp?.batchId?.name || "",
          batchId: sp?.batchId?._id || "",
          departmentName: sp?.departmentId?.departmentName || "",
          currentSemesterName: sp?.currentSemesterId?.name || ""
        };
      });

      // Filter by batchId if requested
      if (batchId) {
        const filtered = enriched.filter(u => u.batchId?.toString() === batchId);
        res.json({ success: true, data: filtered });
        return;
      }

      res.json({ success: true, data: enriched });
      return;
    }

    // If role is faculty, join with FacultyProfile
    if (role === "faculty") {
      const facultyProfiles = await FacultyProfile.find({ collegeId }).lean();
      const facMap = new Map<string, any>();
      facultyProfiles.forEach(fp => facMap.set(fp.userId.toString(), fp));

      const enriched = users.map(u => {
        const fp = facMap.get(u._id.toString());
        return {
          ...u,
          employeeId: fp?.employeeId || "",
          designation: fp?.designation || u.designation || "Faculty",
          qualification: fp?.qualification || "",
          specialization: fp?.specialization || []
        };
      });

      res.json({ success: true, data: enriched });
      return;
    }

    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user!.id).select("+passwordHash");

    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    if (name) user.name = name;

    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({ success: false, error: "Current password is required to change password" });
        return;
      }
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        res.status(400).json({ success: false, error: "Incorrect current password" });
        return;
      }
      user.passwordHash = newPassword; // Pre-save hook hashes this
    }

    await user.save();
    res.json({ success: true, data: user, message: "Profile updated successfully" });
  } catch (error) {
    next(error);
  }
}

export async function createUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password, role, collegeId, designation, departmentId } = req.body;

    const callerRole = req.user?.role;
    if (callerRole !== "college_admin" && callerRole !== "super_admin") {
      res.status(403).json({ success: false, error: "Not authorized to create users" });
      return;
    }

    const targetCollegeId = callerRole === "super_admin" && collegeId ? collegeId : req.user?.collegeId;

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      res.status(400).json({ success: false, error: "Email already registered" });
      return;
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: password || "Portal@2026",
      role: role || "student",
      collegeId: targetCollegeId,
      designation,
      departmentId,
      isActive: true
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function createStudent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const collegeId = req.user?.collegeId;
    const callerRole = req.user?.role;

    if (!["college_admin", "super_admin", "hod", "department_admin"].includes(callerRole || "")) {
      res.status(403).json({ success: false, error: "Unauthorized to provision student accounts" });
      return;
    }

    const {
      name,
      email,
      password,
      rollNumber,
      departmentId,
      batchId,
      section,
      currentSemesterId,
      academicYear,
      entryType,
      phoneNumber
    } = req.body;

    const rawRoll = rollNumber || req.body.registerNumber;
    if (!name || !email || !rawRoll) {
      res.status(400).json({
        success: false,
        error: "Required fields missing: name, email, rollNumber (or registerNumber)"
      });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanRoll = String(rawRoll).trim().toUpperCase();

    // 1. Check duplicate email
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      res.status(400).json({ success: false, error: `Email '${cleanEmail}' is already registered` });
      return;
    }

    // 2. Check duplicate roll number in college
    const existingStudent = await Student.findOne({ collegeId, rollNumber: cleanRoll });
    if (existingStudent) {
      res.status(400).json({ success: false, error: `Register Number '${cleanRoll}' already exists` });
      return;
    }

    // 3. Resolve department
    let dept = departmentId ? await Department.findOne({ _id: departmentId, collegeId }) : null;
    if (!dept) {
      dept = await Department.findOne({ collegeId, isArchived: false });
    }
    if (!dept) {
      res.status(404).json({ success: false, error: "Department not found in this institution" });
      return;
    }

    // Resolve batch
    let batch = batchId ? await Batch.findOne({ _id: batchId, collegeId }) : null;
    if (!batch) {
      batch = await Batch.findOne({ departmentId: dept._id, collegeId, isActive: true });
    }
    if (!batch) {
      res.status(404).json({ success: false, error: "Batch not found in this institution" });
      return;
    }

    // Resolve semester
    let sem = currentSemesterId ? await Semester.findOne({ _id: currentSemesterId, collegeId }) : null;
    if (!sem && req.body.semester) {
      sem = await Semester.findOne({ collegeId, number: Number(req.body.semester) });
    }
    if (!sem && batch.currentSemesterId) {
      sem = await Semester.findOne({ _id: batch.currentSemesterId, collegeId });
    }
    if (!sem) {
      sem = await Semester.findOne({ collegeId }).sort({ number: 1 });
    }
    if (!sem) {
      res.status(404).json({ success: false, error: "Semester not found in this institution" });
      return;
    }

    const resolvedSection = section ? section.trim().toUpperCase() : (batch.section || "A");
    const defaultPassword = password || `${cleanRoll}@2026`;

    // 4. Create User (Permanent Account)
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash: defaultPassword,
      role: "student",
      collegeId,
      departmentId: dept._id,
      phoneNumber: phoneNumber?.trim(),
      isActive: true
    });

    // Find active courses to auto-enroll
    const matchingCourses = await Course.find({
      collegeId,
      status: "active"
    }).select("_id").lean();
    const enrolledIds = matchingCourses.map(c => c._id);

    // 5. Create Student Profile
    const student = await Student.create({
      userId: user._id,
      collegeId,
      departmentId: dept._id,
      batchId: batch._id,
      section: resolvedSection,
      academicYear: academicYear || batch.academicYear || sem.academicYear || "2026-27",
      currentSemesterId: sem._id,
      rollNumber: cleanRoll,
      entryType: entryType === "lateral_entry" ? "lateral_entry" : "regular",
      enrolledCourseIds: enrolledIds
    });

    if (enrolledIds.length > 0) {
      await Course.updateMany(
        { _id: { $in: enrolledIds } },
        { $addToSet: { studentIds: user._id } }
      );
    }

    // 6. Increment batch student count
    await Batch.updateOne({ _id: batch._id }, { $inc: { studentCount: 1 } });

    // 7. Audit Student Provisioning
    await AuditLog.create({
      collegeId,
      actorId: req.user!.id,
      actorRole: callerRole || "admin",
      action: "student_provision",
      entityType: "student",
      entityId: user._id.toString(),
      studentId: user._id,
      newValue: {
        userId: user._id,
        name: user.name,
        email: user.email,
        rollNumber: cleanRoll,
        department: dept.departmentCode,
        batch: batch.name,
        section: resolvedSection
      },
      reason: `Provisioned permanent student account for ${user.name} (${cleanRoll})`
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        studentProfile: student
      }
    });
  } catch (error) {
    next(error);
  }
}

export interface BulkStudentRow {
  name: string;
  email: string;
  rollNumber: string;
  department: string; // code, name, or ID
  batch: string;      // code, name, or ID
  section?: string;
  semester: string;   // number, name, or ID
  phone?: string;
}

export async function bulkValidateStudents(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const collegeId = req.user?.collegeId;
    const callerRole = req.user?.role;

    if (!["college_admin", "super_admin", "hod", "department_admin"].includes(callerRole || "")) {
      res.status(403).json({ success: false, error: "Unauthorized" });
      return;
    }

    let rawRows: any[] = req.body.rows;

    // Support CSV text payload as well
    if (!rawRows && typeof req.body.csvText === "string") {
      rawRows = parseCsvText(req.body.csvText);
    }

    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      res.status(400).json({ success: false, error: "No student records provided. Provide an array of rows or CSV text." });
      return;
    }

    // Load reference data for this college
    const [departments, batches, semesters, existingUsers, existingStudents] = await Promise.all([
      Department.find({ collegeId, isArchived: false }).lean(),
      Batch.find({ collegeId, isActive: true }).lean(),
      Semester.find({ collegeId }).lean(),
      User.find({ collegeId }).select("email").lean(),
      Student.find({ collegeId }).select("rollNumber").lean()
    ]);

    const existingEmailSet = new Set(existingUsers.map(u => u.email.toLowerCase().trim()));
    const existingRollSet = new Set(existingStudents.map(s => s.rollNumber.toUpperCase().trim()));

    const seenEmailsInFile = new Set<string>();
    const seenRollsInFile = new Set<string>();

    const errors: Array<{ row: number; field: string; message: string }> = [];
    const preview: any[] = [];

    rawRows.forEach((raw, idx) => {
      const rowNum = idx + 1;
      const name = String(raw.Name || raw.name || "").trim();
      const email = String(raw["Institutional Email"] || raw.Email || raw.email || "").toLowerCase().trim();
      const rollNumber = String(raw["Register Number"] || raw["Roll Number"] || raw.rollNumber || raw.roll_number || "").toUpperCase().trim();
      const departmentStr = String(raw.Department || raw.department || "").trim();
      const batchStr = String(raw.Batch || raw.batch || "").trim();
      const section = String(raw.Section || raw.section || "").trim().toUpperCase() || "A";
      const semesterStr = String(raw.Semester || raw.semester || "").trim();
      const phone = String(raw.Phone || raw.phone || raw.phoneNumber || "").trim();

      // Required validation
      if (!name) errors.push({ row: rowNum, field: "Name", message: "Name is required" });
      if (!email) errors.push({ row: rowNum, field: "Institutional Email", message: "Institutional Email is required" });
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push({ row: rowNum, field: "Institutional Email", message: "Invalid email format" });
      }
      if (!rollNumber) errors.push({ row: rowNum, field: "Register Number", message: "Register Number is required" });
      if (!departmentStr) errors.push({ row: rowNum, field: "Department", message: "Department is required" });
      if (!batchStr) errors.push({ row: rowNum, field: "Batch", message: "Batch is required" });
      if (!semesterStr) errors.push({ row: rowNum, field: "Semester", message: "Semester is required" });

      // In-file duplicate detection
      if (email) {
        if (seenEmailsInFile.has(email)) {
          errors.push({ row: rowNum, field: "Institutional Email", message: `Duplicate email '${email}' found within the file` });
        } else {
          seenEmailsInFile.add(email);
        }
      }

      if (rollNumber) {
        if (seenRollsInFile.has(rollNumber)) {
          errors.push({ row: rowNum, field: "Register Number", message: `Duplicate Register Number '${rollNumber}' found within the file` });
        } else {
          seenRollsInFile.add(rollNumber);
        }
      }

      // Existing DB duplicate detection
      if (email && existingEmailSet.has(email)) {
        errors.push({ row: rowNum, field: "Institutional Email", message: `Email '${email}' is already registered in the system` });
      }
      if (rollNumber && existingRollSet.has(rollNumber)) {
        errors.push({ row: rowNum, field: "Register Number", message: `Register Number '${rollNumber}' already exists in database` });
      }

      // Match Department
      const matchedDept = departments.find(d =>
        d._id.toString() === departmentStr ||
        d.departmentCode.toLowerCase() === departmentStr.toLowerCase() ||
        d.departmentName.toLowerCase() === departmentStr.toLowerCase()
      );
      if (departmentStr && !matchedDept) {
        errors.push({ row: rowNum, field: "Department", message: `Department '${departmentStr}' does not exist` });
      }

      // Match Batch
      const matchedBatch = batches.find(b =>
        b._id.toString() === batchStr ||
        b.code.toLowerCase() === batchStr.toLowerCase() ||
        b.name.toLowerCase() === batchStr.toLowerCase()
      );
      if (batchStr && !matchedBatch) {
        errors.push({ row: rowNum, field: "Batch", message: `Batch '${batchStr}' does not exist` });
      }

      // Match Semester
      const matchedSem = semesters.find(s =>
        s._id.toString() === semesterStr ||
        String(s.number) === semesterStr ||
        s.name.toLowerCase() === semesterStr.toLowerCase()
      );
      if (semesterStr && !matchedSem) {
        errors.push({ row: rowNum, field: "Semester", message: `Semester '${semesterStr}' does not exist` });
      }

      preview.push({
        row: rowNum,
        name,
        email,
        rollNumber,
        department: matchedDept ? matchedDept.departmentCode : departmentStr,
        departmentId: matchedDept?._id,
        batch: matchedBatch ? matchedBatch.name : batchStr,
        batchId: matchedBatch?._id,
        section,
        semester: matchedSem ? matchedSem.name : semesterStr,
        semesterId: matchedSem?._id,
        phone,
        status: errors.some(e => e.row === rowNum) ? "error" : "valid"
      });
    });

    const isValid = errors.length === 0;

    res.json({
      success: true,
      data: {
        valid: isValid,
        totalRows: rawRows.length,
        validCount: rawRows.length - new Set(errors.map(e => e.row)).size,
        errorCount: errors.length,
        preview,
        errors
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function bulkImportStudents(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const collegeId = req.user?.collegeId;
    const callerRole = req.user?.role;

    if (!["college_admin", "super_admin", "hod", "department_admin"].includes(callerRole || "")) {
      res.status(403).json({ success: false, error: "Unauthorized" });
      return;
    }

    const { students, confirmed } = req.body;

    if (!confirmed) {
      res.status(400).json({ success: false, error: "Explicit confirmation is required before bulk import" });
      return;
    }

    if (!Array.isArray(students) || students.length === 0) {
      res.status(400).json({ success: false, error: "No students provided for import" });
      return;
    }

    // Atomic re-validation to prevent race conditions
    const emails = students.map(s => String(s.email).toLowerCase().trim());
    const rolls = students.map(s => String(s.rollNumber).toUpperCase().trim());

    const [existingUsers, existingStudents] = await Promise.all([
      User.find({ collegeId, email: { $in: emails } }).select("email").lean(),
      Student.find({ collegeId, rollNumber: { $in: rolls } }).select("rollNumber").lean()
    ]);

    if (existingUsers.length > 0) {
      res.status(400).json({
        success: false,
        error: `Import halted: ${existingUsers.length} email(s) already registered (e.g. ${existingUsers[0].email})`
      });
      return;
    }

    if (existingStudents.length > 0) {
      res.status(400).json({
        success: false,
        error: `Import halted: ${existingStudents.length} Register Number(s) already exist (e.g. ${existingStudents[0].rollNumber})`
      });
      return;
    }

    let importedCount = 0;
    const batchCountMap = new Map<string, number>();

    for (const item of students) {
      const cleanEmail = String(item.email).toLowerCase().trim();
      const cleanRoll = String(item.rollNumber).toUpperCase().trim();
      const defaultPassword = `${cleanRoll}@2026`;

      const user = await User.create({
        name: String(item.name).trim(),
        email: cleanEmail,
        passwordHash: defaultPassword,
        role: "student",
        collegeId,
        departmentId: item.departmentId,
        phoneNumber: item.phone?.trim(),
        isActive: true
      });

      await Student.create({
        userId: user._id,
        collegeId,
        departmentId: item.departmentId,
        batchId: item.batchId,
        section: item.section || "A",
        academicYear: item.academicYear || "2026-27",
        currentSemesterId: item.semesterId,
        rollNumber: cleanRoll,
        entryType: "regular",
        enrolledCourseIds: []
      });

      const bId = item.batchId.toString();
      batchCountMap.set(bId, (batchCountMap.get(bId) || 0) + 1);
      importedCount++;
    }

    // Update batch student counts
    for (const [bId, count] of batchCountMap.entries()) {
      await Batch.updateOne({ _id: bId }, { $inc: { studentCount: count } });
    }

    // Audit bulk import
    await AuditLog.create({
      collegeId,
      actorId: req.user!.id,
      actorRole: callerRole || "admin",
      action: "bulk_student_provision",
      entityType: "student",
      entityId: `bulk-import-${Date.now()}`,
      newValue: {
        importedCount,
        sampleRolls: rolls.slice(0, 5)
      },
      reason: `Bulk onboarded ${importedCount} student accounts`
    });

    res.status(201).json({
      success: true,
      message: `Successfully onboarded ${importedCount} students with permanent accounts`,
      data: { importedCount }
    });
  } catch (error) {
    next(error);
  }
}

export async function createFaculty(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const collegeId = req.user?.collegeId;
    const callerRole = req.user?.role;

    if (callerRole !== "college_admin" && callerRole !== "super_admin") {
      res.status(403).json({ success: false, error: "Only admins can provision faculty accounts" });
      return;
    }

    const {
      name,
      email,
      password,
      employeeId,
      designation,
      qualification,
      specialization,
      departmentId,
      phoneNumber,
      officeRoom,
      officeHours
    } = req.body;

    if (!name || !email || !employeeId || !designation || !departmentId) {
      res.status(400).json({
        success: false,
        error: "Required fields missing: name, email, employeeId, designation, departmentId"
      });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanEmpId = employeeId.trim().toUpperCase();

    // Check duplicate email
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      res.status(400).json({ success: false, error: `Email '${cleanEmail}' is already registered` });
      return;
    }

    // Check duplicate employee ID
    const existingFac = await FacultyProfile.findOne({ collegeId, employeeId: cleanEmpId });
    if (existingFac) {
      res.status(400).json({ success: false, error: `Employee ID '${cleanEmpId}' already exists in this institution` });
      return;
    }

    const dept = await Department.findOne({ _id: departmentId, collegeId });
    if (!dept) {
      res.status(404).json({ success: false, error: "Department not found" });
      return;
    }

    const defaultPassword = password || `${cleanEmpId}@2026`;

    // 1. Create User
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash: defaultPassword,
      role: "faculty",
      collegeId,
      departmentId: dept._id,
      designation: designation.trim(),
      phoneNumber: phoneNumber?.trim(),
      isActive: true
    });

    // 2. Create Faculty Profile
    const profile = await FacultyProfile.create({
      userId: user._id,
      collegeId,
      departmentId: dept._id,
      employeeId: cleanEmpId,
      designation: designation.trim(),
      qualification: qualification ? qualification.trim() : "M.Tech / Ph.D.",
      specialization: Array.isArray(specialization) ? specialization : (specialization ? [specialization] : []),
      officeRoom: officeRoom?.trim(),
      officeHours: officeHours?.trim(),
      phoneNumber: phoneNumber?.trim()
    });

    // 3. Increment department faculty count
    await Department.updateOne({ _id: dept._id }, { $inc: { facultyCount: 1 } });

    // 4. Audit
    await AuditLog.create({
      collegeId,
      actorId: req.user!.id,
      actorRole: callerRole,
      action: "faculty_provision",
      entityType: "faculty",
      entityId: user._id.toString(),
      newValue: {
        userId: user._id,
        name: user.name,
        email: user.email,
        employeeId: cleanEmpId,
        designation: designation.trim(),
        department: dept.departmentCode
      },
      reason: `Provisioned permanent faculty account for ${user.name} (${cleanEmpId})`
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          designation: user.designation
        },
        facultyProfile: profile
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getRecentActivity(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ success: true, data: { activities: [], outputs: [] } });
  } catch (error) {
    next(error);
  }
}

// Helper to parse CSV text safely
function parseCsvText(text: string): any[] {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, ""));
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(v => v.trim().replace(/^["']|["']$/g, ""));
    const obj: any = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] || "";
    });
    rows.push(obj);
  }

  return rows;
}
