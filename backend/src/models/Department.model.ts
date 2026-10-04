import mongoose, { Schema, Document } from "mongoose";

export interface IDepartment extends Document {
  collegeId: mongoose.Types.ObjectId;
  departmentCode: string;
  departmentName: string;
  description?: string;
  hodUserId?: mongoose.Types.ObjectId;
  vision?: string;
  mission?: string;
  facultyCount: number;
  courseCount: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    collegeId: { type: Schema.Types.ObjectId, ref: "College", required: true },
    departmentCode: { type: String, required: true, trim: true },
    departmentName: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    hodUserId: { type: Schema.Types.ObjectId, ref: "User" },
    vision: { type: String, trim: true },
    mission: { type: String, trim: true },
    facultyCount: { type: Number, default: 0 },
    courseCount: { type: Number, default: 0 },
    isArchived: { type: Boolean, default: false }
  },
  { timestamps: true }
);

departmentSchema.index({ collegeId: 1, departmentCode: 1 }, { unique: true });
departmentSchema.index({ collegeId: 1, departmentName: 1 }, { unique: true });

export default mongoose.model<IDepartment>("Department", departmentSchema);
