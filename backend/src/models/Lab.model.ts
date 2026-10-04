import mongoose, { Schema, Document } from "mongoose";

export interface ILab extends Document {
  collegeId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  name: string;             // e.g., "Communication Systems Lab"
  labCode: string;          // e.g., "ECE-LAB-301"
  room: string;             // e.g., "Room 204, Block B"
  capacity: number;
  equipment: string[];      // e.g., ["CRO", "Function Generator", "DSO"]
  labInchargeId?: mongoose.Types.ObjectId;
  labStaffIds: mongoose.Types.ObjectId[];
  courseIds: mongoose.Types.ObjectId[];  // Courses that use this lab
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const labSchema = new Schema<ILab>(
  {
    collegeId: { type: Schema.Types.ObjectId, ref: "College", required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true },
    name: { type: String, required: true, trim: true },
    labCode: { type: String, required: true, trim: true },
    room: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, default: 30 },
    equipment: [{ type: String, trim: true }],
    labInchargeId: { type: Schema.Types.ObjectId, ref: "User" },
    labStaffIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    courseIds: [{ type: Schema.Types.ObjectId, ref: "Course" }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

labSchema.index({ collegeId: 1, departmentId: 1, labCode: 1 }, { unique: true });
labSchema.index({ collegeId: 1, isActive: 1 });

export default mongoose.model<ILab>("Lab", labSchema);
