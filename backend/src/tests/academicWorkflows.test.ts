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

// Mock Course model with literal IDs
jest.mock("../models/Course.model", () => {
  const courseRecord = {
    _id: "60c72b2f9b1d8b0015b8d241",
    collegeId: "60c72b2f9b1d8b0015b8d235",
    name: "Operating Systems",
    courseCode: "CS301",
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
    }),
    findById: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(courseRecord)
      })
    })
  };
});

// Mock User model
jest.mock("../models/User.model", () => {
  const mockUserRecord = {
    _id: "60c72b2f9b1d8b0015b8d238",
    name: "John Doe",
    email: "student@college.edu"
  };
  return {
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue([mockUserRecord])
    }),
    findById: jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUserRecord)
    }),
    findOne: jest.fn().mockResolvedValue(mockUserRecord)
  };
});

// Mock Notification model
jest.mock("../models/Notification.model", () => ({
  insertMany: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue({})
}));

// Mock Attendance model
jest.mock("../models/Attendance.model", () => {
  const mockAttendanceRecord = {
    _id: "60c72b2f9b1d8b0015b8d250",
    collegeId: "60c72b2f9b1d8b0015b8d235",
    studentId: "60c72b2f9b1d8b0015b8d238",
    courseId: "60c72b2f9b1d8b0015b8d241",
    facultyId: "60c72b2f9b1d8b0015b8d236",
    date: "2026-09-06",
    status: "present",
    sessionType: "lecture"
  };

  return {
    findOneAndUpdate: jest.fn().mockResolvedValue(mockAttendanceRecord),
    findOne: jest.fn().mockResolvedValue(mockAttendanceRecord),
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([mockAttendanceRecord])
          })
        })
      })
    }),
    bulkWrite: jest.fn().mockResolvedValue({ ok: 1, nUpserted: 1, nModified: 0 }),
    aggregate: jest.fn().mockResolvedValue([
      {
        _id: { courseId: "60c72b2f9b1d8b0015b8d241", studentId: "60c72b2f9b1d8b0015b8d238" },
        totalClasses: 10,
        presentCount: 8,
        odCount: 1,
        absentCount: 1,
        lateCount: 0,
        excusedCount: 0,
        attendedCount: 9,
        percentage: 90
      }
    ])
  };
});

// Mock Grade model
jest.mock("../models/Grade.model", () => {
  const mockGradeRecord = {
    _id: "60c72b2f9b1d8b0015b8d260",
    collegeId: "60c72b2f9b1d8b0015b8d235",
    studentId: "60c72b2f9b1d8b0015b8d238",
    courseId: "60c72b2f9b1d8b0015b8d241",
    title: "Midterm 1",
    marksObtained: 42,
    maxMarks: 50,
    weightage: 20,
    gradedBy: "60c72b2f9b1d8b0015b8d236"
  };

  return {
    findOneAndUpdate: jest.fn().mockResolvedValue(mockGradeRecord),
    findOne: jest.fn().mockResolvedValue(mockGradeRecord),
    bulkWrite: jest.fn().mockResolvedValue({ ok: 1, nUpserted: 1 }),
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue([mockGradeRecord])
            })
          })
        })
      })
    }),
    aggregate: jest.fn().mockResolvedValue([
      { _id: "60c72b2f9b1d8b0015b8d241", totalObtained: 42, totalMax: 50 }
    ])
  };
});

// Mock Timetable model
jest.mock("../models/Timetable.model", () => {
  function MockTimetableInstance(this: any, data: any) {
    Object.assign(this, data, { _id: "60c72b2f9b1d8b0015b8d270" });
    this.save = jest.fn().mockResolvedValue(this);
  }

  const mockRecord = {
    _id: "60c72b2f9b1d8b0015b8d270",
    collegeId: "60c72b2f9b1d8b0015b8d235",
    courseId: "60c72b2f9b1d8b0015b8d241",
    facultyId: "60c72b2f9b1d8b0015b8d236",
    dayOfWeek: "Monday",
    startTime: "09:00",
    endTime: "10:00",
    room: ""
  };

  (MockTimetableInstance as any).findById = jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockRecord)
    })
  });
  (MockTimetableInstance as any).findOne = jest.fn().mockResolvedValue(mockRecord);
  (MockTimetableInstance as any).find = jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockRecord])
      })
    })
  });

  return MockTimetableInstance;
});

// Mock Announcement model
jest.mock("../models/Announcement.model", () => {
  const mockAnnouncementRecord = {
    _id: "60c72b2f9b1d8b0015b8d280",
    title: "Midterm Schedule",
    body: "Exam scheduled next week",
    audience: "course",
    courseId: "60c72b2f9b1d8b0015b8d241",
    collegeId: "60c72b2f9b1d8b0015b8d235",
    authorId: "60c72b2f9b1d8b0015b8d236"
  };

  return {
    create: jest.fn().mockResolvedValue(mockAnnouncementRecord),
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([mockAnnouncementRecord])
            })
          })
        })
      })
    }),
    findOne: jest.fn().mockResolvedValue(mockAnnouncementRecord),
    findOneAndUpdate: jest.fn().mockResolvedValue(mockAnnouncementRecord)
  };
});

// Mock CalendarEvent model
jest.mock("../models/CalendarEvent.model", () => {
  function MockCalendarInstance(this: any, data: any) {
    Object.assign(this, data, { _id: "60c72b2f9b1d8b0015b8d290" });
    this.save = jest.fn().mockResolvedValue(this);
  }

  const mockHolidayRecord = {
    _id: "60c72b2f9b1d8b0015b8d290",
    title: "National Holiday",
    type: "holiday",
    startDate: new Date("2026-10-02"),
    audience: "global",
    collegeId: "60c72b2f9b1d8b0015b8d235"
  };

  (MockCalendarInstance as any).find = jest.fn().mockReturnValue({
    sort: jest.fn().mockResolvedValue([mockHolidayRecord])
  });

  return MockCalendarInstance;
});

// Mock Semester model
jest.mock("../models/Semester.model", () => {
  const mockSemesterRecord = {
    _id: "60c72b2f9b1d8b0015b8d242",
    name: "Semester 5",
    number: 5,
    academicYear: "2026-2027",
    departmentId: "60c72b2f9b1d8b0015b8d230",
    collegeId: "60c72b2f9b1d8b0015b8d235",
    isActive: false,
    save: jest.fn().mockResolvedValue(true)
  };

  return {
    findOne: jest.fn().mockImplementation((query: any) => {
      if (query._id === "60c72b2f9b1d8b0015b8d242") {
        return Promise.resolve(mockSemesterRecord);
      }
      return Promise.resolve(null);
    }),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue([mockSemesterRecord])
    }),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 })
  };
});

describe("Academic Workflow Hardening & Integrity Test Suite", () => {
  const mockCollegeId = "60c72b2f9b1d8b0015b8d235";
  const assignedFacultyId = "60c72b2f9b1d8b0015b8d236";
  const unassignedFacultyId = "60c72b2f9b1d8b0015b8d237";
  const enrolledStudentId = "60c72b2f9b1d8b0015b8d238";
  const unenrolledStudentId = "60c72b2f9b1d8b0015b8d239";
  const hodId = "60c72b2f9b1d8b0015b8d240";
  const mockCourseId = "60c72b2f9b1d8b0015b8d241";
  const mockSemesterId = "60c72b2f9b1d8b0015b8d242";

  let assignedFacultyToken: string;
  let unassignedFacultyToken: string;
  let enrolledStudentToken: string;
  let hodToken: string;

  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret-academic-12345";
    assignedFacultyToken = jwt.sign(
      { id: assignedFacultyId, role: "faculty", collegeId: mockCollegeId },
      process.env.JWT_SECRET
    );
    unassignedFacultyToken = jwt.sign(
      { id: unassignedFacultyId, role: "faculty", collegeId: mockCollegeId },
      process.env.JWT_SECRET
    );
    enrolledStudentToken = jwt.sign(
      { id: enrolledStudentId, role: "student", collegeId: mockCollegeId },
      process.env.JWT_SECRET
    );
    hodToken = jwt.sign(
      { id: hodId, role: "hod", collegeId: mockCollegeId },
      process.env.JWT_SECRET
    );
  });

  describe("1. Authoritative Attendance Workflow", () => {
    it("Assigned faculty marks attendance for enrolled student successfully", async () => {
      const res = await request(app)
        .post("/api/v1/attendance")
        .set("Authorization", `Bearer ${assignedFacultyToken}`)
        .set("X-Tenant-ID", mockCollegeId)
        .send({
          studentId: enrolledStudentId,
          courseId: mockCourseId,
          date: "2026-09-06",
          status: "present"
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("present");
    });

    it("Rejects attendance if status is invalid (e.g. arbitrary custom status)", async () => {
      const res = await request(app)
        .post("/api/v1/attendance")
        .set("Authorization", `Bearer ${assignedFacultyToken}`)
        .set("X-Tenant-ID", mockCollegeId)
        .send({
          studentId: enrolledStudentId,
          courseId: mockCourseId,
          date: "2026-09-06",
          status: "custom_status"
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Invalid status");
    });

    it("Blocks unassigned faculty from marking attendance for another faculty's course", async () => {
      const res = await request(app)
        .post("/api/v1/attendance")
        .set("Authorization", `Bearer ${unassignedFacultyToken}`)
        .set("X-Tenant-ID", mockCollegeId)
        .send({
          studentId: enrolledStudentId,
          courseId: mockCourseId,
          date: "2026-09-06",
          status: "present"
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Unauthorized");
    });

    it("Blocks attendance marking for unenrolled student", async () => {
      const res = await request(app)
        .post("/api/v1/attendance")
        .set("Authorization", `Bearer ${assignedFacultyToken}`)
        .set("X-Tenant-ID", mockCollegeId)
        .send({
          studentId: unenrolledStudentId,
          courseId: mockCourseId,
          date: "2026-09-06",
          status: "present"
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("not enrolled");
    });

    it("Accepts OD (On Duty) status and calculates summary properly", async () => {
      const res = await request(app)
        .get(`/api/v1/attendance/summary?courseId=${mockCourseId}`)
        .set("Authorization", `Bearer ${assignedFacultyToken}`)
        .set("X-Tenant-ID", mockCollegeId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].odCount).toBe(1);
      expect(res.body.data[0].percentage).toBe(90);
    });
  });

  describe("2. Marks & Gradebook Workflow", () => {
    it("Assigned faculty records marks within valid boundaries", async () => {
      const res = await request(app)
        .post("/api/v1/gradebook")
        .set("Authorization", `Bearer ${assignedFacultyToken}`)
        .set("X-Tenant-ID", mockCollegeId)
        .send({
          studentId: enrolledStudentId,
          courseId: mockCourseId,
          title: "Midterm 1",
          marksObtained: 42,
          maxMarks: 50
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.marksObtained).toBe(42);
    });

    it("Rejects marks when marksObtained > maxMarks", async () => {
      const res = await request(app)
        .post("/api/v1/gradebook")
        .set("Authorization", `Bearer ${assignedFacultyToken}`)
        .set("X-Tenant-ID", mockCollegeId)
        .send({
          studentId: enrolledStudentId,
          courseId: mockCourseId,
          title: "Midterm 1",
          marksObtained: 55,
          maxMarks: 50
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("cannot exceed");
    });

    it("Rejects negative marks", async () => {
      const res = await request(app)
        .post("/api/v1/gradebook")
        .set("Authorization", `Bearer ${assignedFacultyToken}`)
        .set("X-Tenant-ID", mockCollegeId)
        .send({
          studentId: enrolledStudentId,
          courseId: mockCourseId,
          title: "Midterm 1",
          marksObtained: -5,
          maxMarks: 50
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("Blocks unassigned faculty from grading another faculty's course", async () => {
      const res = await request(app)
        .post("/api/v1/gradebook")
        .set("Authorization", `Bearer ${unassignedFacultyToken}`)
        .set("X-Tenant-ID", mockCollegeId)
        .send({
          studentId: enrolledStudentId,
          courseId: mockCourseId,
          title: "Midterm 1",
          marksObtained: 35,
          maxMarks: 50
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe("3. Timetable Sanitization & Ownership", () => {
    it("Sanitizes and strips room references on timetable creation", async () => {
      const res = await request(app)
        .post("/api/v1/timetable")
        .set("Authorization", `Bearer ${assignedFacultyToken}`)
        .set("X-Tenant-ID", mockCollegeId)
        .send({
          courseId: mockCourseId,
          dayOfWeek: "Monday",
          startTime: "09:00",
          endTime: "10:00",
          type: "lecture",
          room: "Room 401" // Should be sanitized/ignored
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.room).toBe("");
    });
  });

  describe("4. Announcements High-Signal Scoping", () => {
    it("Faculty cannot publish college-wide announcements", async () => {
      const res = await request(app)
        .post("/api/v1/announcements")
        .set("Authorization", `Bearer ${assignedFacultyToken}`)
        .set("X-Tenant-ID", mockCollegeId)
        .send({
          title: "General Notice",
          body: "Campus closed tomorrow",
          audience: "college"
        });

      // Faculty must provide a course they teach
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("Faculty can publish course announcements for assigned course", async () => {
      const res = await request(app)
        .post("/api/v1/announcements")
        .set("Authorization", `Bearer ${assignedFacultyToken}`)
        .set("X-Tenant-ID", mockCollegeId)
        .send({
          courseId: mockCourseId,
          title: "Midterm Schedule",
          body: "Midterm exam is scheduled next Wednesday."
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it("Students cannot create announcements", async () => {
      const res = await request(app)
        .post("/api/v1/announcements")
        .set("Authorization", `Bearer ${enrolledStudentToken}`)
        .set("X-Tenant-ID", mockCollegeId)
        .send({
          courseId: mockCourseId,
          title: "Study Group",
          body: "Meet in the library"
        });

      expect(res.status).toBe(403);
    });
  });

  describe("5. Holidays & Academic Events", () => {
    it("Faculty cannot declare official institutional holidays", async () => {
      const res = await request(app)
        .post("/api/v1/calendar")
        .set("Authorization", `Bearer ${assignedFacultyToken}`)
        .set("X-Tenant-ID", mockCollegeId)
        .send({
          title: "Faculty Holiday",
          type: "holiday",
          startDate: "2026-10-02"
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain("Only HOD and Administrators");
    });

    it("Authorized HOD can declare official holiday", async () => {
      const res = await request(app)
        .post("/api/v1/calendar")
        .set("Authorization", `Bearer ${hodToken}`)
        .set("X-Tenant-ID", mockCollegeId)
        .send({
          title: "Gandhi Jayanti",
          type: "holiday",
          startDate: "2026-10-02"
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe("6. Semester Lifecycle (Non-Destructive)", () => {
    it("HOD/Admin can activate a semester and set operational context", async () => {
      const res = await request(app)
        .patch(`/api/v1/semesters/${mockSemesterId}/activate`)
        .set("Authorization", `Bearer ${hodToken}`)
        .set("X-Tenant-ID", mockCollegeId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("now the active academic context");
    });

    it("HOD/Admin can close a semester preserving historical records", async () => {
      const res = await request(app)
        .patch(`/api/v1/semesters/${mockSemesterId}/close`)
        .set("Authorization", `Bearer ${hodToken}`)
        .set("X-Tenant-ID", mockCollegeId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("Historical academic records remain safely archived");
    });
  });
});
