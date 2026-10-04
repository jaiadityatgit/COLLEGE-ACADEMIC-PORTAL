import mongoose, { Schema, Document } from "mongoose";

export interface IStudent extends Document {
  userId: mongoose.Types.ObjectId;
  collegeId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  currentSemesterId: mongoose.Types.ObjectId;
  rollNumber: string;
  section?: string;
  academicYear?: string;
  entryType: "regular" | "lateral_entry";
  enrolledCourseIds: mongoose.Types.ObjectId[];
  studyStreak: number;
  lastActiveDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<IStudent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    collegeId: { type: Schema.Types.ObjectId, ref: "College", required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true },
    batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
    currentSemesterId: { type: Schema.Types.ObjectId, ref: "Semester", required: true },
    rollNumber: { type: String, required: true, trim: true },
    section: { type: String, trim: true },
    academicYear: { type: String, trim: true },
    entryType: { type: String, enum: ["regular", "lateral_entry"], default: "regular" },
    enrolledCourseIds: [{ type: Schema.Types.ObjectId, ref: "Course" }],
    studyStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date }
  },
  { timestamps: true }
);

studentSchema.index({ collegeId: 1, rollNumber: 1 }, { unique: true });
studentSchema.index({ collegeId: 1, batchId: 1, section: 1 });
studentSchema.index({ collegeId: 1, departmentId: 1 });

export default mongoose.model<IStudent>("Student", studentSchema);
