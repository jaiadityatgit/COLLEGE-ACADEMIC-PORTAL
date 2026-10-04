import request from "supertest";
import app from "../app";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

// Mock database config
jest.mock("../config/database", () => ({
  connectDatabase: jest.fn().mockResolvedValue(undefined),
  disconnectDatabase: jest.fn().mockResolvedValue(undefined),
  getDatabaseKind: jest.fn().mockReturnValue("memory"),
  isDatabaseAtlas: jest.fn().mockReturnValue(false),
  isDatabaseMemory: jest.fn().mockReturnValue(true),
}));

// Mock Mongoose models
const mockCourseId = "60c72b2f9b1d8b0015b8d233";
const mockNotebookId = "60c72b2f9b1d8b0015b8d234";
const mockCollegeId = "60c72b2f9b1d8b0015b8d235";
const mockUserId = "60c72b2f9b1d8b0015b8d236";
const mockSourceId = "60c72b2f9b1d8b0015b8d237";

jest.mock("../models/Course.model", () => ({
  findOne: jest.fn().mockResolvedValue({ _id: "60c72b2f9b1d8b0015b8d233", collegeId: "60c72b2f9b1d8b0015b8d235", name: "VLSI Design" })
}));

jest.mock("../models/Notebook.model", () => ({
  findOne: jest.fn().mockResolvedValue({ _id: "60c72b2f9b1d8b0015b8d234", courseId: "60c72b2f9b1d8b0015b8d233", collegeId: "60c72b2f9b1d8b0015b8d235" }),
  find: jest.fn().mockReturnValue({
    select: jest.fn().mockResolvedValue([{ _id: "60c72b2f9b1d8b0015b8d234" }])
  })
}));

jest.mock("../models/Source.model", () => {
  const mockRec = {
    _id: "60c72b2f9b1d8b0015b8d237",
    name: "unit 1 handwritten.pdf",
    type: "pdf",
    category: "lecture_notes",
    path: require("path").join(__dirname, "test_sample.pdf"),
    url: "/api/v1/sources/60c72b2f9b1d8b0015b8d237/download",
    courseId: "60c72b2f9b1d8b0015b8d233",
    notebookId: "60c72b2f9b1d8b0015b8d234",
    collegeId: "60c72b2f9b1d8b0015b8d235",
    uploadedBy: "60c72b2f9b1d8b0015b8d236",
    uploadedByRole: "faculty",
    status: "ready",
    save: jest.fn().mockResolvedValue(true),
    toObject: function () { return { ...this }; }
  };

  return {
    create: jest.fn().mockResolvedValue(mockRec),
    findOne: jest.fn().mockResolvedValue(mockRec),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue([mockRec])
    }),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 })
  };
});

describe("Course Materials & File Upload Pipeline", () => {
  let token: string;
  const testFilePath = path.join(__dirname, "test_sample.pdf");

  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret-key-12345";
    token = jwt.sign(
      { id: mockUserId, role: "faculty", collegeId: mockCollegeId },
      process.env.JWT_SECRET
    );
    // Write sample pdf for test
    fs.writeFileSync(testFilePath, "%PDF-1.4 Mock PDF Content");
  });

  afterAll(() => {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  it("POST /api/v1/sources/upload should succeed with status ready", async () => {
    const res = await request(app)
      .post("/api/v1/sources/upload")
      .set("Authorization", `Bearer ${token}`)
      .set("X-Tenant-ID", mockCollegeId)
      .field("courseId", mockCourseId)
      .field("category", "lecture_notes")
      .attach("file", testFilePath);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ready");
    expect(res.body.data.url).toContain("/api/v1/sources/");
  });

  it("GET /api/v1/sources/course/:courseId should return course materials", async () => {
    const res = await request(app)
      .get(`/api/v1/sources/course/${mockCourseId}`)
      .set("Authorization", `Bearer ${token}`)
      .set("X-Tenant-ID", mockCollegeId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].status).toBe("ready");
  });

  it("GET /api/v1/sources/subject/:notebookId should support legacy listing endpoint", async () => {
    const res = await request(app)
      .get(`/api/v1/sources/subject/${mockNotebookId}`)
      .set("Authorization", `Bearer ${token}`)
      .set("X-Tenant-ID", mockCollegeId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("GET /api/v1/sources/:id/download should retrieve the physical file", async () => {
    const res = await request(app)
      .get(`/api/v1/sources/${mockSourceId}/download?inline=true`)
      .set("Authorization", `Bearer ${token}`)
      .set("X-Tenant-ID", mockCollegeId);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/pdf");
    expect(res.headers["content-disposition"]).toContain("inline");
    expect(res.body.toString("utf-8")).toContain("%PDF-1.4 Mock PDF Content");
  });
});
