import mongoose, { Schema, Document } from "mongoose";

export interface ISemester extends Document {
  collegeId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  name: string;            // e.g., "Semester V"
  number: number;          // 1-8
  academicYear: string;    // e.g., "2025-2026"
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  regulationYear?: string; // e.g., "R2021"
  createdAt: Date;
  updatedAt: Date;
}

const semesterSchema = new Schema<ISemester>(
  {
    collegeId: { type: Schema.Types.ObjectId, ref: "College", required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true },
    name: { type: String, required: true, trim: true },
    number: { type: Number, required: true, min: 1, max: 8 },
    academicYear: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: false },
    regulationYear: { type: String, trim: true }
  },
  { timestamps: true }
);

semesterSchema.index({ collegeId: 1, departmentId: 1, number: 1, academicYear: 1 }, { unique: true });
semesterSchema.index({ collegeId: 1, isActive: 1 });

export default mongoose.model<ISemester>("Semester", semesterSchema);
