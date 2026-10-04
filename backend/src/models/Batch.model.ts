import mongoose, { Schema, Document } from "mongoose";

export interface IBatch extends Document {
  collegeId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  name: string;            // e.g., "2023-27 Section A"
  code: string;            // e.g., "ECE-A-2023"
  startYear: number;       // e.g., 2023
  endYear: number;         // e.g., 2027
  section?: string;        // e.g., "A", "B"
  academicYear?: string;   // e.g., "2026-27"
  currentSemesterId?: mongoose.Types.ObjectId;
  studentCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const batchSchema = new Schema<IBatch>(
  {
    collegeId: { type: Schema.Types.ObjectId, ref: "College", required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    startYear: { type: Number, required: true },
    endYear: { type: Number, required: true },
    section: { type: String, trim: true },
    academicYear: { type: String, trim: true },
    currentSemesterId: { type: Schema.Types.ObjectId, ref: "Semester" },
    studentCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

batchSchema.index({ collegeId: 1, departmentId: 1, code: 1 }, { unique: true });
batchSchema.index({ collegeId: 1, isActive: 1 });
batchSchema.index({ collegeId: 1, academicYear: 1 });

export default mongoose.model<IBatch>("Batch", batchSchema);
