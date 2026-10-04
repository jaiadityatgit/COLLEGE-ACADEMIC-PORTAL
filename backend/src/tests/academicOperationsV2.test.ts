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

const mockCollegeId = "60c72b2f9b1d8b0015b8d235";
const mockCourseId = "60c72b2f9b1d8b0015b8d241";
const mockFacultyId = "60c72b2f9b1d8b0015b8d236";
const mockStudentId = "60c72b2f9b1d8b0015b8d238";
const mockHodId = "60c72b2f9b1d8b0015b8d240";
const mockAssignmentId = "60c72b2f9b1d8b0015b8d299";

let facultyToken: string;
let studentToken: string;
let hodToken: string;

// In-memory AuditLog storage for tests
const inMemoryAuditLogs: any[] = [];

// Mock AuditLog model
jest.mock("../models/AuditLog.model", () => {
  return {
    create: jest.fn().mockImplementation((doc: any) => {
      const record = { ...doc, _id: "audit_" + (inMemoryAuditLogs.length + 1), createdAt: new Date() };
      inMemoryAuditLogs.push(record);
      return Promise.resolve(record);
    }),
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  lean: jest.fn().mockImplementation(() => Promise.resolve(inMemoryAuditLogs))
                })
              })
            })
          })
        })
      })
    }),
    countDocuments: jest.fn().mockImplementation(() => Promise.resolve(inMemoryAuditLogs.length))
  };
});

// Mock Course model
jest.mock("../models/Course.model", () => {
  const courseRecord = {
    _id: "60c72b2f9b1d8b0015b8d241",
    collegeId: "60c72b2f9b1d8b0015b8d235",
    name: "Digital Electronics",
    courseCode: "EC302",
    facultyIds: ["60c72b2f9b1d8b0015b8d236"],
    studentIds: ["60c72b2f9b1d8b0015b8d238"]
  };

  return {
    findOne: jest.fn().mockImplementation((query: any) => {
      if (query._id?.toString() === "60c72b2f9b1d8b0015b8d241") {
        return Promise.resolve(courseRecord);
      }
      return Promise.resolve(null);
    }),
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue([courseRecord]),
      lean: jest.fn().mockResolvedValue([courseRecord])
    })
  };
});

// Mock User model
jest.mock("../models/User.model", () => {
  const studentUser = {
    _id: "60c72b2f9b1d8b0015b8d238",
    name: "Alex Student",
    email: "alex@college.edu",
    role: "student"
  };
  return {
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([studentUser])
      })
    }),
    findById: jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(studentUser)
    }),
    findOne: jest.fn().mockResolvedValue(studentUser)
  };
});

// Mock Attendance model
const inMemoryAttendance = [
  {
    _id: "att_1",
    collegeId: "60c72b2f9b1d8b0015b8d235",
    studentId: { _id: "60c72b2f9b1d8b0015b8d238", name: "Alex Student", email: "alex@college.edu" },
    courseId: { _id: "60c72b2f9b1d8b0015b8d241", name: "Digital Electronics", courseCode: "EC302" },
    facultyId: "60c72b2f9b1d8b0015b8d236",
    date: "2026-09-02",
    status: "present",
    sessionType: "lecture"
  },
  {
    _id: "att_2",
    collegeId: "60c72b2f9b1d8b0015b8d235",
    studentId: { _id: "60c72b2f9b1d8b0015b8d238", name: "Alex Student", email: "alex@college.edu" },
    courseId: { _id: "60c72b2f9b1d8b0015b8d241", name: "Digital Electronics", courseCode: "EC302" },
    facultyId: "60c72b2f9b1d8b0015b8d236",
    date: "2026-09-03",
    status: "absent",
    sessionType: "lecture"
  }
];

jest.mock("../models/Attendance.model", () => ({
  find: jest.fn().mockImplementation((query: any) => {
    let filtered = [
      {
        _id: "att_1",
        collegeId: "60c72b2f9b1d8b0015b8d235",
        studentId: { _id: "60c72b2f9b1d8b0015b8d238", name: "Alex Student", email: "alex@college.edu" },
        courseId: { _id: "60c72b2f9b1d8b0015b8d241", name: "Digital Electronics", courseCode: "EC302" },
        facultyId: "60c72b2f9b1d8b0015b8d236",
        date: "2026-09-02",
        status: "present",
        sessionType: "lecture"
      },
      {
        _id: "att_2",
        collegeId: "60c72b2f9b1d8b0015b8d235",
        studentId: { _id: "60c72b2f9b1d8b0015b8d238", name: "Alex Student", email: "alex@college.edu" },
        courseId: { _id: "60c72b2f9b1d8b0015b8d241", name: "Digital Electronics", courseCode: "EC302" },
        facultyId: "60c72b2f9b1d8b0015b8d236",
        date: "2026-09-03",
        status: "absent",
        sessionType: "lecture"
      }
    ];
    if (query?.date?.$regex) {
      const regex = new RegExp(query.date.$regex);
      filtered = filtered.filter((r) => regex.test(r.date));
    }
    return {
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(filtered)
          })
        })
      })
    };
  }),
  findOne: jest.fn().mockImplementation((query: any) => {
    const rec = {
      _id: "att_2",
      collegeId: "60c72b2f9b1d8b0015b8d235",
      studentId: "60c72b2f9b1d8b0015b8d238",
      courseId: "60c72b2f9b1d8b0015b8d241",
      facultyId: "60c72b2f9b1d8b0015b8d236",
      date: query.date || "2026-09-03",
      status: "absent",
      sessionType: "lecture"
    };
    return Promise.resolve(rec);
  }),
  findOneAndUpdate: jest.fn().mockImplementation((query: any, update: any) => {
    return Promise.resolve({
      _id: "att_2",
      collegeId: "60c72b2f9b1d8b0015b8d235",
      studentId: "60c72b2f9b1d8b0015b8d238",
      courseId: "60c72b2f9b1d8b0015b8d241",
      facultyId: "60c72b2f9b1d8b0015b8d236",
      date: query.date || "2026-09-03",
      status: update.status || "present",
      sessionType: "lecture"
    });
  }),
  bulkWrite: jest.fn().mockResolvedValue({ ok: 1, nUpserted: 0, nModified: 1 })
}));

// Mock Grade model
jest.mock("../models/Grade.model", () => {
  const grades = [
    {
      _id: "grade_1",
      collegeId: "60c72b2f9b1d8b0015b8d235",
      studentId: "60c72b2f9b1d8b0015b8d238",
      courseId: "60c72b2f9b1d8b0015b8d241",
      title: "CIA-1 Assessment",
      marksObtained: 18,
      maxMarks: 25,
      gradingType: "numeric"
    }
  ];

  return {
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(grades)
        })
      }),
      sort: jest.fn().mockResolvedValue(grades)
    }),
    findOne: jest.fn().mockImplementation((query: any) => {
      const g = grades.find(
        (x) => x.courseId === query.courseId && x.title === query.title && x.studentId === query.studentId
      );
      return Promise.resolve(g || null);
    }),
    findOneAndUpdate: jest.fn().mockImplementation((query: any, update: any) => {
      return Promise.resolve({
        _id: "grade_1",
        collegeId: "60c72b2f9b1d8b0015b8d235",
        studentId: query.studentId || "60c72b2f9b1d8b0015b8d238",
        courseId: query.courseId || "60c72b2f9b1d8b0015b8d241",
        title: query.title || "CIA-1 Assessment",
        marksObtained: update.$set?.marksObtained || 21,
        maxMarks: update.$set?.maxMarks || 25,
        gradingType: "numeric"
      });
    }),
    bulkWrite: jest.fn().mockResolvedValue({ ok: 1, nUpserted: 0, nModified: 1 })
  };
});

// Mock Assignment model
jest.mock("../models/Assignment.model", () => {
  const assignmentDoc = {
    _id: "60c72b2f9b1d8b0015b8d299",
    collegeId: "60c72b2f9b1d8b0015b8d235",
    courseId: "60c72b2f9b1d8b0015b8d241",
    title: "Assignment 1: Logic Gates",
    description: "Initial description",
    dueDate: new Date("2026-09-15"),
    totalMarks: 50,
    submissionMethod: "online",
    attachments: ["problem_set_v1.pdf"],
    status: "published",
    save: jest.fn().mockResolvedValue(true)
  };

  return {
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([assignmentDoc])
        })
      })
    }),
    findOne: jest.fn().mockImplementation((query: any) => {
      if (query._id?.toString() === "60c72b2f9b1d8b0015b8d299") {
        return Promise.resolve(assignmentDoc);
      }
      return Promise.resolve(null);
    })
  };
});

// Mock Notification model
jest.mock("../models/Notification.model", () => ({
  insertMany: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue({})
}));

describe("Academic Operations V2 Hardening & Workflow Suite", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret-academic-12345";
    facultyToken = jwt.sign(
      { id: mockFacultyId, role: "faculty", collegeId: mockCollegeId },
      process.env.JWT_SECRET
    );
    studentToken = jwt.sign(
      { id: mockStudentId, role: "student", collegeId: mockCollegeId },
      process.env.JWT_SECRET
    );
    hodToken = jwt.sign(
      { id: mockHodId, role: "hod", collegeId: mockCollegeId },
      process.env.JWT_SECRET
    );
  });

  beforeEach(() => {
    inMemoryAuditLogs.length = 0;
  });

  describe("1. Attendance Day-by-Day Calendar Query & Filtering", () => {
    it("Student retrieves month-scoped daily attendance with regex query", async () => {
      const res = await request(app)
        .get(`/api/v1/attendance?courseId=${mockCourseId}&month=2026-09`)
        .set("Authorization", `Bearer ${studentToken}`)
        .set("X-Tenant-ID", mockCollegeId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].status).toBe("present");
      expect(res.body.data[1].status).toBe("absent");
    });
  });

  describe("2. Attendance Correction & Audit Logging", () => {
    it("Faculty corrects Absent to Present and generates academic audit log", async () => {
      const res = await request(app)
        .post("/api/v1/attendance")
        .set("Authorization", `Bearer ${facultyToken}`)
        .set("X-Tenant-ID", mockCollegeId)
        .send({
          studentId: mockStudentId,
          courseId: mockCourseId,
          date: "2026-09-03",
          status: "present",
          reason: "Approved medical OD certificate provided"
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify an audit log entry was created
      expect(inMemoryAuditLogs.length).toBeGreaterThan(0);
      const audit = inMemoryAuditLogs.find((l) => l.action === "attendance_correction" && l.entityType === "attendance");
      expect(audit).toBeDefined();
      expect(audit.previousValue?.status || audit.previousValue).toBe("absent");
      expect(audit.newValue?.status || audit.newValue).toBe("present");
      expect(audit.reason).toContain("Approved medical OD certificate");
    });
  });

  describe("3. Internal Marks Editing & Range Validation", () => {
    it("Rejects marks greater than maxMarks", async () => {
      const res = await request(app)
        .post("/api/v1/gradebook")
        .set("Authorization", `Bearer ${facultyToken}`)
        .set("X-Tenant-ID", mockCollegeId)
        .send({
          studentId: mockStudentId,
          courseId: mockCourseId,
          title: "CIA-1 Assessment",
          marksObtained: 30,
          maxMarks: 25
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("cannot exceed");
    });

    it("Faculty updates mark from 18 to 21 and records audit trail", async () => {
      const res = await request(app)
        .post("/api/v1/gradebook")
        .set("Authorization", `Bearer ${facultyToken}`)
        .set("X-Tenant-ID", mockCollegeId)
        .send({
          studentId: mockStudentId,
          courseId: mockCourseId,
          title: "CIA-1 Assessment",
          marksObtained: 21,
          maxMarks: 25,
          reason: "Re-evaluation of Question 4 verified by faculty"
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const audit = inMemoryAuditLogs.find((l) => l.action === "mark_correction" && l.entityType === "grade");
      expect(audit).toBeDefined();
      expect(audit.previousValue?.marksObtained || audit.previousValue).toBe(18);
      expect(audit.newValue?.marksObtained || audit.newValue).toBe(21);
      expect(audit.reason).toContain("Re-evaluation of Question 4");
    });
  });

  describe("4. Assignment Editing & Version Consistency", () => {
    it("Faculty can update assignment deadline, description, and attachments with audit trail", async () => {
      const res = await request(app)
        .patch(`/api/v1/assignments/${mockAssignmentId}`)
        .set("Authorization", `Bearer ${facultyToken}`)
        .set("X-Tenant-ID", mockCollegeId)
        .send({
          title: "Assignment 1: Revised Logic Gates",
          dueDate: "2026-09-20",
          totalMarks: 50,
          submissionMethod: "online",
          attachments: ["problem_set_v2.pdf"],
          reason: "Deadline extended by 5 days for laboratory verification"
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe("Assignment 1: Revised Logic Gates");

      const audit = inMemoryAuditLogs.find((l) => l.action === "assignment_edit" && l.entityType === "assignment");
      expect(audit).toBeDefined();
      expect(audit.reason).toContain("Deadline extended");
    });
  });

  describe("5. Audit Log Role Authorization & Security", () => {
    it("Students cannot access institutional audit logs (403)", async () => {
      const res = await request(app)
        .get("/api/v1/audit-logs")
        .set("Authorization", `Bearer ${studentToken}`)
        .set("X-Tenant-ID", mockCollegeId);

      expect(res.status).toBe(403);
    });

    it("Faculty cannot access department-wide audit logs (403)", async () => {
      const res = await request(app)
        .get("/api/v1/audit-logs")
        .set("Authorization", `Bearer ${facultyToken}`)
        .set("X-Tenant-ID", mockCollegeId);

      expect(res.status).toBe(403);
    });

    it("HOD can inspect academic corrections and audit records (200)", async () => {
      const res = await request(app)
        .get("/api/v1/audit-logs")
        .set("Authorization", `Bearer ${hodToken}`)
        .set("X-Tenant-ID", mockCollegeId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
