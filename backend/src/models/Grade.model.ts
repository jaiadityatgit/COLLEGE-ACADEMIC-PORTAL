import mongoose, { Schema, Document } from "mongoose";

export interface IGrade extends Document {
  collegeId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  examId?: mongoose.Types.ObjectId;
  assignmentId?: mongoose.Types.ObjectId;
  type: "internal" | "exam" | "assignment" | "attendance";
  title: string; // e.g., "Midterm 1", "Homework 2"
  marksObtained: number;
  maxMarks: number;
  weightage?: number; // percentage this counts towards final grade
  remarks?: string;
  gradedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const gradeSchema = new Schema<IGrade>(
  {
    collegeId: { type: Schema.Types.ObjectId, ref: "College", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    examId: { type: Schema.Types.ObjectId, ref: "Exam" },
    assignmentId: { type: Schema.Types.ObjectId, ref: "Assignment" },
    type: { type: String, enum: ["internal", "exam", "assignment", "attendance"], required: true },
    title: { type: String, required: true, trim: true },
    marksObtained: { type: Number, required: true, min: 0 },
    maxMarks: { type: Number, required: true, min: 1 },
    weightage: { type: Number, default: 0 },
    remarks: { type: String, trim: true },
    gradedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

gradeSchema.index({ collegeId: 1, studentId: 1, courseId: 1, title: 1 });
gradeSchema.index({ collegeId: 1, studentId: 1, courseId: 1 });
gradeSchema.index({ collegeId: 1, studentId: 1 });
gradeSchema.index({ collegeId: 1, courseId: 1 });
gradeSchema.index({ collegeId: 1, examId: 1 });

export default mongoose.model<IGrade>("Grade", gradeSchema);
