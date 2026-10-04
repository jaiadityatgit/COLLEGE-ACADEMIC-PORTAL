import mongoose, { Schema, Document } from "mongoose";

export interface ICourse extends Document {
  collegeId: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId;
  courseCode?: string;
  name: string;
  semester?: string;
  academicYear?: string;
  description?: string;
  credits?: number;
  courseType?: "theory" | "lab" | "theory_lab";
  syllabus?: string[];
  regulationYear?: string;
  facultyIds: mongoose.Types.ObjectId[];
  studentIds: mongoose.Types.ObjectId[];
  status: "active" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    collegeId: { type: Schema.Types.ObjectId, ref: "College", required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department" },
    courseCode: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    semester: { type: String, trim: true },
    academicYear: { type: String, trim: true },
    description: { type: String, trim: true },
    credits: { type: Number, default: 3 },
    courseType: { type: String, enum: ["theory", "lab", "theory_lab"], default: "theory" },
    syllabus: [{ type: String, trim: true }],
    regulationYear: { type: String, trim: true },
    facultyIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    studentIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    status: { type: String, enum: ["active", "archived"], default: "active" }
  },
  { timestamps: true }
);

courseSchema.index({ collegeId: 1, name: 1 }, { unique: true });

export default mongoose.model<ICourse>("Course", courseSchema);
