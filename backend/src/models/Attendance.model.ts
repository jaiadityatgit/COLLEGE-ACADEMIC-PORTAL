import mongoose, { Schema, Document } from "mongoose";

export interface IAttendance extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  batchId?: mongoose.Types.ObjectId;
  notebookId?: mongoose.Types.ObjectId;
  facultyId: mongoose.Types.ObjectId;
  collegeId: mongoose.Types.ObjectId;
  date: string; // ISO Date string (YYYY-MM-DD)
  sessionType: "lecture" | "lab" | "tutorial";
  status: "present" | "absent" | "od" | "late" | "excused";
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    batchId: { type: Schema.Types.ObjectId, ref: "Batch" },
    notebookId: { type: Schema.Types.ObjectId, ref: "Notebook" },
    facultyId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    collegeId: { type: Schema.Types.ObjectId, ref: "College", required: true },
    date: { type: String, required: true },
    sessionType: { type: String, enum: ["lecture", "lab", "tutorial"], default: "lecture" },
    status: { type: String, enum: ["present", "absent", "od", "late", "excused"], required: true },
    remarks: { type: String }
  },
  { timestamps: true }
);

// Prevent duplicate attendance for same student, course, and date
attendanceSchema.index({ studentId: 1, courseId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ collegeId: 1, studentId: 1 });
attendanceSchema.index({ collegeId: 1, courseId: 1 });
attendanceSchema.index({ collegeId: 1, facultyId: 1 });
attendanceSchema.index({ collegeId: 1, date: -1 });

export default mongoose.model<IAttendance>("Attendance", attendanceSchema);
