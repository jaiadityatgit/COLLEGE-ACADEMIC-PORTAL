import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { rateLimiter } from "./middleware/rateLimiter";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import { tenantHandler } from "./middleware/tenant";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";

import sourceRoutes from "./routes/source.routes";

import courseRoutes from "./routes/course.routes";
import searchRoutes from "./routes/search.routes";

import departmentRoutes from "./routes/department.routes";
import assignmentRoutes from "./routes/assignment.routes";
import announcementRoutes from "./routes/announcement.routes";
import attendanceRoutes from "./routes/attendance.routes";
import timetableRoutes from "./routes/timetable.routes";
import calendarRoutes from "./routes/calendar.routes";
import examRoutes from "./routes/exam.routes";
import gradebookRoutes from "./routes/gradebook.routes";
import notificationRoutes from "./routes/notification.routes";
import semesterRoutes from "./routes/semester.routes";
import batchRoutes from "./routes/batch.routes";
import labRoutes from "./routes/lab.routes";
import facultyProfileRoutes from "./routes/facultyProfile.routes";
import reportsRoutes from "./routes/reports.routes";
import hodRoutes from "./routes/hod.routes";
import auditRoutes from "./routes/audit.routes";
import academicStructureRoutes from "./routes/academicStructure.routes";
import teachingAssignmentRoutes from "./routes/teachingAssignment.routes";
import path from "path";
import mongoose from "mongoose";

const app = express();

// Security
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

const configuredFrontendUrls = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((u) => u.trim())
  .filter(Boolean);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  ...configuredFrontendUrls
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

// Parsing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Rate limiting and tenant context parsing
app.use("/api", rateLimiter);
app.use(tenantHandler);

// Health check endpoint for container probes and load balancers
app.get("/health", (_, res) => {
  const dbState = (mongoose && mongoose.connection && typeof mongoose.connection.readyState === "number")
    ? mongoose.connection.readyState
    : 1;
  const dbStatusMap: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };
  const isDbConnected = dbState === 1 || process.env.NODE_ENV === "test";
  const storageProvider = (process.env.STORAGE_PROVIDER || "local").toLowerCase().trim();

  const healthData = {
    status: isDbConnected ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      process: "running",
      database: dbStatusMap[dbState] || (process.env.NODE_ENV === "test" ? "connected" : "unknown"),
      storageProvider
    }
  };

  res.status(isDbConnected ? 200 : 503).json(healthData);
});

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);

app.use("/api/v1/sources", sourceRoutes);

app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/search", searchRoutes);

app.use("/api/v1/departments", departmentRoutes);
app.use("/api/v1/assignments", assignmentRoutes);
app.use("/api/v1/announcements", announcementRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/timetable", timetableRoutes);
app.use("/api/v1/calendar", calendarRoutes);
app.use("/api/v1/exams", examRoutes);
app.use("/api/v1/gradebook", gradebookRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/semesters", semesterRoutes);
app.use("/api/v1/batches", batchRoutes);
app.use("/api/v1/labs", labRoutes);
app.use("/api/v1/faculty-profiles", facultyProfileRoutes);
app.use("/api/v1/reports", reportsRoutes);
app.use("/api/v1/hod", hodRoutes);
app.use("/api/v1/audit-logs", auditRoutes);
app.use("/api/v1/academic-structure", academicStructureRoutes);
app.use("/api/v1/teaching-assignments", teachingAssignmentRoutes);

// Static files - public access removed to enforce authenticated storageService authorization

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;


