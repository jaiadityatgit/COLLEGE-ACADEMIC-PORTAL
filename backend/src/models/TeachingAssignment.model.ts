import mongoose, { Schema, Document } from "mongoose";

export interface ITeachingAssignment extends Document {
  collegeId: mongoose.Types.ObjectId;
  facultyId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  academicYear: string;        // e.g. "2026-27"
  semester: string;            // e.g. "Semester 1" or "1"
  semesterId?: mongoose.Types.ObjectId;
  batchId?: mongoose.Types.ObjectId;
  section?: string;            // e.g. "A", "B", "C"
  status: "active" | "completed" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

const teachingAssignmentSchema = new Schema<ITeachingAssignment>(
  {
    collegeId: { type: Schema.Types.ObjectId, ref: "College", required: true },
    facultyId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true },
    academicYear: { type: String, required: true, trim: true },
    semester: { type: String, required: true, trim: true },
    semesterId: { type: Schema.Types.ObjectId, ref: "Semester" },
    batchId: { type: Schema.Types.ObjectId, ref: "Batch" },
    section: { type: String, trim: true, default: "A" },
    status: { type: String, enum: ["active", "completed", "archived"], default: "active" }
  },
  { timestamps: true }
);

teachingAssignmentSchema.index({ collegeId: 1, facultyId: 1, courseId: 1, academicYear: 1, section: 1 });
teachingAssignmentSchema.index({ collegeId: 1, academicYear: 1, departmentId: 1 });
teachingAssignmentSchema.index({ collegeId: 1, courseId: 1 });
teachingAssignmentSchema.index({ collegeId: 1, batchId: 1 });

export default mongoose.model<ITeachingAssignment>("TeachingAssignment", teachingAssignmentSchema);
