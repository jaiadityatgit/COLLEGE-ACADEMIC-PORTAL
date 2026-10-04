import request from "supertest";
import app from "../app";
import jwt from "jsonwebtoken";

// Mock database config
jest.mock("../config/database", () => ({
  connectDatabase: jest.fn().mockResolvedValue(undefined),
  disconnectDatabase: jest.fn().mockResolvedValue(undefined),
  getDatabaseKind: jest.fn().mockReturnValue("memory"),
  isDatabaseAtlas: jest.fn().mockReturnValue(false),
  isDatabaseMemory: jest.fn().mockReturnValue(true),
}));

// Define mock identifiers
var mockCollegeId = "60c72b2f9b1d8b0015b8d235";
var mockDeptId = "60c72b2f9b1d8b0015b8d230";
var mockOtherDeptId = "60c72b2f9b1d8b0015b8d231";
var mockBatchAId = "60c72b2f9b1d8b0015b8d250";
var mockBatchBId = "60c72b2f9b1d8b0015b8d251";
var mockSemesterId = "60c72b2f9b1d8b0015b8d260";
var mockCourseXId = "60c72b2f9b1d8b0015b8d241";
var mockCourseYId = "60c72b2f9b1d8b0015b8d242";

var mockAdminId = "60c72b2f9b1d8b0015b8d299";
var mockHodId = "60c72b2f9b1d8b0015b8d240";
var mockFacultyId = "60c72b2f9b1d8b0015b8d236";
var mockOtherFacultyId = "60c72b2f9b1d8b0015b8d237";
var mockStudentAId = "60c72b2f9b1d8b0015b8d238";
var mockStudentBId = "60c72b2f9b1d8b0015b8d239";

var adminToken: string;
var hodToken: string;
var facultyToken: string;
var otherFacultyToken: string;
var studentAToken: string;
var studentBToken: string;

function mockQuery(data: any) {
  const q: any = {
    populate: jest.fn().mockImplementation(() => q),
    select: jest.fn().mockImplementation(() => q),
    sort: jest.fn().mockImplementation(() => q),
    skip: jest.fn().mockImplementation(() => q),
    limit: jest.fn().mockImplementation(() => q),
    lean: jest.fn().mockImplementation(() => Promise.resolve(data)),
    then: (resolve: any, reject: any) => Promise.resolve(data).then(resolve, reject),
    catch: (reject: any) => Promise.resolve(data).catch(reject)
  };
  return q;
}

var inMemory: any = {
  users: [
    { _id: mockAdminId, name: "Admin", email: "admin@college.edu", role: "college_admin", collegeId: mockCollegeId },
    { _id: mockHodId, name: "Dr. HOD", email: "hod@college.edu", role: "hod", collegeId: mockCollegeId, departmentId: mockDeptId },
    { _id: mockFacultyId, name: "Prof. Alan", email: "alan@college.edu", role: "faculty", collegeId: mockCollegeId, departmentId: mockDeptId, assignedCourseIds: [mockCourseXId] },
    { _id: mockOtherFacultyId, name: "Prof. Bob", email: "bob@college.edu", role: "faculty", collegeId: mockCollegeId, departmentId: mockDeptId, assignedCourseIds: [] },
    { _id: mockStudentAId, name: "Student A", email: "student.a@college.edu", role: "student", collegeId: mockCollegeId, departmentId: mockDeptId },
    { _id: mockStudentBId, name: "Student B", email: "student.b@college.edu", role: "student", collegeId: mockCollegeId, departmentId: mockDeptId }
  ] as any[],
  departments: [
    { _id: mockDeptId, collegeId: mockCollegeId, departmentCode: "ECE", departmentName: "Electronics", isArchived: false },
    { _id: mockOtherDeptId, collegeId: mockCollegeId, departmentCode: "CSE", departmentName: "Computer Science", isArchived: false }
  ] as any[],
  batches: [
    { _id: mockBatchAId, collegeId: mockCollegeId, departmentId: mockDeptId, name: "2026-30 Section A", code: "ECE-A-2026", section: "A", academicYear: "2026-27", studentCount: 1, isActive: true },
    { _id: mockBatchBId, collegeId: mockCollegeId, departmentId: mockDeptId, name: "2026-30 Section B", code: "ECE-B-2026", section: "B", academicYear: "2026-27", studentCount: 1, isActive: true }
  ] as any[],
  semesters: [
    { _id: mockSemesterId, collegeId: mockCollegeId, departmentId: mockDeptId, name: "Semester 1", number: 1, academicYear: "2026-27", isActive: true }
  ] as any[],
  courses: [
    { _id: mockCourseXId, collegeId: mockCollegeId, departmentId: mockDeptId, name: "Digital Electronics", courseCode: "EC101", academicYear: "2026-27", semester: "1", facultyIds: [mockFacultyId], studentIds: [mockStudentAId, mockStudentBId], status: "active" },
    { _id: mockCourseYId, collegeId: mockCollegeId, departmentId: mockDeptId, name: "Signals & Systems", courseCode: "EC102", academicYear: "2026-27", semester: "1", facultyIds: [], studentIds: [mockStudentAId], status: "active" }
  ] as any[],
  students: [
    { _id: "sp_1", userId: mockStudentAId, collegeId: mockCollegeId, departmentId: mockDeptId, batchId: mockBatchAId, section: "A", academicYear: "2026-27", currentSemesterId: mockSemesterId, rollNumber: "26ECE001", enrolledCourseIds: [mockCourseXId, mockCourseYId] },
    { _id: "sp_2", userId: mockStudentBId, collegeId: mockCollegeId, departmentId: mockDeptId, batchId: mockBatchBId, section: "B", academicYear: "2026-27", currentSemesterId: mockSemesterId, rollNumber: "26ECE002", enrolledCourseIds: [mockCourseXId] }
  ] as any[],
  teachingAssignments: [
    { _id: "ta_1", collegeId: mockCollegeId, facultyId: mockFacultyId, courseId: mockCourseXId, departmentId: mockDeptId, academicYear: "2026-27", semester: "1", batchId: mockBatchAId, section: "A", status: "active" }
  ] as any[],
  announcements: [] as any[],
  auditLogs: [] as any[]
};

// Mock Notebook model
jest.mock("../models/Notebook.model", () => ({
  find: jest.fn().mockImplementation(() => mockQuery([])),
  findOne: jest.fn().mockImplementation(() => mockQuery(null)),
  create: jest.fn().mockImplementation((doc: any) => Promise.resolve({ ...doc, _id: "nb_mock" }))
}));

// Mock User model
jest.mock("../models/User.model", () => {
  return {
    find: jest.fn().mockImplementation((query: any) => {
      let res = inMemory.users;
      if (query?.role) res = res.filter((u: any) => u.role === query.role);
      if (query?.email?.$in) res = res.filter((u: any) => query.email.$in.includes(u.email));
      return mockQuery(res);
    }),
    findOne: jest.fn().mockImplementation((query: any) => {
      const u = inMemory.users.find((x: any) =>
        (query.email && x.email.toLowerCase() === query.email.toLowerCase()) ||
        (query._id && x._id.toString() === query._id.toString())
      );
      return mockQuery(u || null);
    }),
    findById: jest.fn().mockImplementation((id: any) => {
      const u = inMemory.users.find((x: any) => x._id.toString() === id.toString());
      return {
        select: jest.fn().mockImplementation(() => mockQuery(u || null)),
        ...u
      };
    }),
    create: jest.fn().mockImplementation((doc: any) => {
      const record = { ...doc, _id: "usr_" + (inMemory.users.length + 1) };
      inMemory.users.push(record);
      return Promise.resolve(record);
    }),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 })
  };
});

// Mock Student model
jest.mock("../models/Student.model", () => {
  return {
    find: jest.fn().mockImplementation((query: any) => {
      let res = inMemory.students;
      if (query?.section) res = res.filter((s: any) => s.section === query.section);
      if (query?.batchId) res = res.filter((s: any) => s.batchId.toString() === query.batchId.toString());
      if (query?.rollNumber?.$in) res = res.filter((s: any) => query.rollNumber.$in.includes(s.rollNumber));
      return mockQuery(res);
    }),
    findOne: jest.fn().mockImplementation((query: any) => {
      const s = inMemory.students.find((x: any) =>
        (query.userId && x.userId.toString() === query.userId.toString()) ||
        (query.rollNumber && x.rollNumber.toUpperCase() === query.rollNumber.toUpperCase())
      );
      return mockQuery(s || null);
    }),
    create: jest.fn().mockImplementation((doc: any) => {
      const record = { ...doc, _id: "sp_" + (inMemory.students.length + 1) };
      inMemory.students.push(record);
      return Promise.resolve(record);
    }),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 })
  };
});

// Mock FacultyProfile model
jest.mock("../models/FacultyProfile.model", () => {
  return {
    findOne: jest.fn().mockImplementation(() => mockQuery(null)),
    find: jest.fn().mockImplementation(() => mockQuery([])),
    create: jest.fn().mockImplementation((doc: any) => {
      return Promise.resolve({ ...doc, _id: "fac_prof_1" });
    })
  };
});

// Mock TeachingAssignment model
jest.mock("../models/TeachingAssignment.model", () => {
  return {
    find: jest.fn().mockImplementation((query: any) => {
      let res = inMemory.teachingAssignments;
      if (query?.facultyId) res = res.filter((t: any) => t.facultyId.toString() === query.facultyId.toString());
      return mockQuery(res);
    }),
    findOne: jest.fn().mockImplementation((query: any) => {
      const a = inMemory.teachingAssignments.find((x: any) => x._id.toString() === query._id?.toString());
      return mockQuery(a || null);
    }),
    findOneAndUpdate: jest.fn().mockImplementation((filter: any, update: any) => {
      const doc = {
        ...filter,
        ...(update.$set || update),
        _id: "ta_" + (inMemory.teachingAssignments.length + 1)
      };
      inMemory.teachingAssignments.push(doc);
      return Promise.resolve(doc);
    }),
    exists: jest.fn().mockImplementation((query: any) => {
      const exists = inMemory.teachingAssignments.some((t: any) =>
        (!query.facultyId || t.facultyId.toString() === query.facultyId.toString()) &&
        (!query.courseId || t.courseId.toString() === query.courseId.toString())
      );
      return Promise.resolve(exists ? { _id: "ta_ex" } : null);
    }),
    countDocuments: jest.fn().mockResolvedValue(0)
  };
});

// Mock Batch model
jest.mock("../models/Batch.model", () => {
  return {
    find: jest.fn().mockImplementation(() => mockQuery(inMemory.batches)),
    findOne: jest.fn().mockImplementation((query: any) => {
      const b = inMemory.batches.find((x: any) =>
        (query._id && x._id.toString() === query._id.toString()) ||
        (query.code && x.code === query.code)
      );
      return mockQuery(b || null);
    }),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 })
  };
});

// Mock Department model
jest.mock("../models/Department.model", () => {
  return {
    find: jest.fn().mockImplementation(() => mockQuery(inMemory.departments)),
    findOne: jest.fn().mockImplementation((query: any) => {
      const d = inMemory.departments.find((x: any) =>
        (query._id && x._id.toString() === query._id.toString()) ||
        (query.departmentCode && x.departmentCode === query.departmentCode)
      );
      return mockQuery(d || null);
    }),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 })
  };
});

// Mock Semester model
jest.mock("../models/Semester.model", () => {
  return {
    find: jest.fn().mockImplementation(() => mockQuery(inMemory.semesters)),
    findOne: jest.fn().mockImplementation((query: any) => {
      const s = inMemory.semesters.find((x: any) =>
        (query._id && x._id.toString() === query._id.toString()) ||
        (query.number && x.number === query.number)
      );
      return mockQuery(s || null);
    }),
    findOneAndUpdate: jest.fn().mockImplementation((filter: any) => {
      const sem = { ...filter, _id: "sem_new", name: "Semester 1" };
      return Promise.resolve(sem);
    })
  };
});

// Mock Course model
jest.mock("../models/Course.model", () => {
  return {
    find: jest.fn().mockImplementation((query: any) => {
      let res = inMemory.courses;
      if (query?.facultyIds) res = res.filter((c: any) => c.facultyIds.includes(query.facultyIds));
      if (query?.studentIds) res = res.filter((c: any) => c.studentIds.includes(query.studentIds));
      return mockQuery(res);
    }),
    findOne: jest.fn().mockImplementation((query: any) => {
      const c = inMemory.courses.find((x: any) => x._id.toString() === query._id.toString());
      return mockQuery(c || null);
    }),
    updateOne: jest.fn().mockImplementation((filter: any, update: any) => {
      const c = inMemory.courses.find((x: any) => x._id.toString() === filter._id.toString());
      if (c && update?.$addToSet?.facultyIds) {
        c.facultyIds.push(update.$addToSet.facultyIds);
      }
      return Promise.resolve({ modifiedCount: 1 });
    }),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 })
  };
});

// Mock Announcement model
jest.mock("../models/Announcement.model", () => {
  return {
    find: jest.fn().mockImplementation((query: any) => {
      let res = inMemory.announcements;
      if (query?.$or) {
        res = res.filter((a: any) => {
          return query.$or.some((cond: any) => {
            if (cond.audience === "college") return a.audience === "college";
            if (cond.audience === "department") return a.audience === "department" && a.departmentId === cond.departmentId;
            if (cond.audience === "course") return a.audience === "course" && cond.courseId?.$in?.includes(a.courseId);
            if (cond.audience?.$in && cond.audience.$in.includes("batch")) {
              return (a.audience === "batch" || a.audience === "section") && a.batchId === cond.batchId;
            }
            return false;
          });
        });
      }
      return mockQuery(res);
    }),
    create: jest.fn().mockImplementation((doc: any) => {
      const record = { ...doc, _id: "ann_" + (inMemory.announcements.length + 1) };
      inMemory.announcements.push(record);
      return Promise.resolve(record);
    })
  };
});

// Mock AuditLog model
jest.mock("../models/AuditLog.model", () => {
  return {
    create: jest.fn().mockImplementation((doc: any) => {
      inMemory.auditLogs.push(doc);
      return Promise.resolve(doc);
    })
  };
});

// Mock Attendance model
jest.mock("../models/Attendance.model", () => {
  return {
    find: jest.fn().mockImplementation(() => mockQuery([
      { studentId: mockStudentAId, status: "present" }
    ]))
  };
});

// Mock Notification service
jest.mock("../services/notificationService", () => ({
  notificationService: {
    notifyCourseStudents: jest.fn(),
    notifyAllDepartmentStudents: jest.fn(),
    notifyUser: jest.fn()
  }
}));

describe("Institutional Structure & Communication Regression Tests", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "27100990-366e-41a3-afcd-ca6916c54a4c";
    const secret = process.env.JWT_SECRET;
    adminToken = jwt.sign({ id: mockAdminId, role: "college_admin", collegeId: mockCollegeId }, secret);
    hodToken = jwt.sign({ id: mockHodId, role: "hod", collegeId: mockCollegeId, departmentId: mockDeptId }, secret);
    facultyToken = jwt.sign({ id: mockFacultyId, role: "faculty", collegeId: mockCollegeId, departmentId: mockDeptId }, secret);
    otherFacultyToken = jwt.sign({ id: mockOtherFacultyId, role: "faculty", collegeId: mockCollegeId, departmentId: mockDeptId }, secret);
    studentAToken = jwt.sign({ id: mockStudentAId, role: "student", collegeId: mockCollegeId, departmentId: mockDeptId }, secret);
    studentBToken = jwt.sign({ id: mockStudentBId, role: "student", collegeId: mockCollegeId, departmentId: mockDeptId }, secret);
  });

  // 1. Academic Structure Hierarchy
  test("ADMIN: Get academic structure hierarchy returns tree", async () => {
    const res = await request(app)
      .get("/api/v1/academic-structure/hierarchy")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.hierarchy).toBeDefined();
    expect(Array.isArray(res.body.data.academicYears)).toBe(true);
  });

  // 2. Student Provisioning
  test("ADMIN: Provision single student account with permanent institutional email", async () => {
    const res = await request(app)
      .post("/api/v1/users/students")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Test New Student",
        email: "new.student@college.edu",
        rollNumber: "26ECE999",
        departmentId: mockDeptId,
        batchId: mockBatchAId,
        section: "A",
        currentSemesterId: mockSemesterId
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe("new.student@college.edu");
    expect(res.body.data.studentProfile.rollNumber).toBe("26ECE999");
  });

  // 3. Bulk Student Validation
  test("ADMIN: Bulk student validation detects duplicates and missing fields", async () => {
    const res = await request(app)
      .post("/api/v1/users/students/bulk-validate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        rows: [
          // Row 1: Valid
          { Name: "Bulk Student 1", "Institutional Email": "bulk1@college.edu", "Register Number": "26ECE101", Department: "ECE", Batch: "2026-30 Section A", Section: "A", Semester: "1" },
          // Row 2: Duplicate email with row 1
          { Name: "Bulk Student 2", "Institutional Email": "bulk1@college.edu", "Register Number": "26ECE102", Department: "ECE", Batch: "2026-30 Section A", Section: "A", Semester: "1" },
          // Row 3: Missing required fields
          { Name: "", "Institutional Email": "invalid", "Register Number": "", Department: "UNKNOWN", Batch: "UNKNOWN", Section: "A", Semester: "99" }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(false);
    expect(res.body.data.errorCount).toBeGreaterThan(0);
    expect(res.body.data.errors.some((e: any) => e.message.includes("Duplicate email"))).toBe(true);
  });

  // 4. Bulk Student Import
  test("ADMIN: Bulk student import halts without explicit confirmation", async () => {
    const res = await request(app)
      .post("/api/v1/users/students/bulk-import")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        students: [{ name: "S1", email: "s1@college.edu", rollNumber: "R1" }],
        confirmed: false
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("confirmation is required");
  });

  // 5. Faculty Provisioning
  test("ADMIN: Provision faculty account with permanent institutional email and profile", async () => {
    const res = await request(app)
      .post("/api/v1/users/faculty")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Dr. Marie Curie",
        email: "marie.curie@college.edu",
        employeeId: "FAC-ECE-88",
        designation: "Associate Professor",
        departmentId: mockDeptId
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe("faculty");
    expect(res.body.data.facultyProfile.employeeId).toBe("FAC-ECE-88");
  });

  // 6. Assign Faculty to Multiple Courses / Sections
  test("ADMIN/HOD: Assign faculty to multiple courses and sections", async () => {
    const res = await request(app)
      .post("/api/v1/teaching-assignments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        facultyId: mockFacultyId,
        courseId: mockCourseXId,
        departmentId: mockDeptId,
        academicYear: "2026-27",
        semester: "1",
        batchId: mockBatchBId,
        section: "B"
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.section).toBe("B");
  });

  // 7. Faculty Portal Contexts
  test("FACULTY: Only assigned contexts are visible in my-contexts", async () => {
    const res = await request(app)
      .get("/api/v1/teaching-assignments/my-contexts")
      .set("Authorization", `Bearer ${facultyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  // 8. Faculty Student Access
  test("FACULTY: Context students endpoint returns enrolled students with attendance stats", async () => {
    const res = await request(app)
      .get(`/api/v1/teaching-assignments/context-students?courseId=${mockCourseXId}&section=A`)
      .set("Authorization", `Bearer ${facultyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.students)).toBe(true);
  });

  // 9. Unauthorized Course Context Access returns 403
  test("FACULTY: Unauthorized course access returns 403", async () => {
    const res = await request(app)
      .get(`/api/v1/teaching-assignments/context-students?courseId=${mockCourseYId}`)
      .set("Authorization", `Bearer ${otherFacultyToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain("Unauthorized");
  });

  // 10. Student Portal Course Scoping
  test("STUDENT: Correct courses visible", async () => {
    const res = await request(app)
      .get("/api/v1/courses")
      .set("Authorization", `Bearer ${studentAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // 11. Communication Permissions: Student Cannot Create Announcements
  test("STUDENT: Cannot create announcements (returns 403)", async () => {
    const res = await request(app)
      .post("/api/v1/announcements")
      .set("Authorization", `Bearer ${studentAToken}`)
      .send({
        title: "Student Post",
        body: "Hello",
        audience: "college"
      });

    expect(res.status).toBe(403);
  });

  // 12. Communication Permissions: Faculty Cannot Create College Announcement
  test("FACULTY: Cannot create unauthorized college-wide notices (returns 403)", async () => {
    const res = await request(app)
      .post("/api/v1/announcements")
      .set("Authorization", `Bearer ${facultyToken}`)
      .send({
        title: "Faculty College Notice",
        body: "College closed",
        audience: "college"
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain("Unauthorized");
  });

  // 13. Faculty Course Announcement
  test("FACULTY: Can publish course announcement for assigned course", async () => {
    const res = await request(app)
      .post("/api/v1/announcements")
      .set("Authorization", `Bearer ${facultyToken}`)
      .send({
        title: "Assignment 1 Due Tomorrow",
        body: "Please submit through portal",
        courseId: mockCourseXId,
        category: "deadline",
        priority: "high"
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.audience).toBe("course");
  });

  // 14. HOD Department Announcement
  test("HOD: Can publish department notice", async () => {
    const res = await request(app)
      .post("/api/v1/announcements")
      .set("Authorization", `Bearer ${hodToken}`)
      .send({
        title: "ECE Internal Assessment Next Week",
        body: "Schedule posted on notice board",
        departmentId: mockDeptId,
        audience: "department",
        category: "exam"
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  // 15. Admin College Announcement
  test("ADMIN: Can publish college-wide notice", async () => {
    const res = await request(app)
      .post("/api/v1/announcements")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "College Holiday Declared",
        body: "College remains closed tomorrow",
        audience: "college",
        category: "holiday"
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.audience).toBe("college");
  });

  // 16. Section Announcement Targeting Consistency
  test("STUDENT: Section A student receives Section A notice and NOT Section B notice", async () => {
    inMemory.announcements.push({
      _id: "ann_sec_b",
      title: "Section B Special Class",
      body: "Only for Section B",
      audience: "section",
      batchId: mockBatchBId,
      section: "B",
      departmentId: mockDeptId,
      collegeId: mockCollegeId,
      isArchived: false,
      priority: "normal",
      createdAt: new Date()
    });

    const res = await request(app)
      .get("/api/v1/announcements")
      .set("Authorization", `Bearer ${studentAToken}`); // Student A is in Section A

    expect(res.status).toBe(200);
    const titles = res.body.data.map((a: any) => a.title);
    expect(titles).not.toContain("Section B Special Class");
  });
});
