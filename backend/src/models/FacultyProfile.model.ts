import mongoose, { Schema, Document } from "mongoose";

export interface IFacultyProfile extends Document {
  userId: mongoose.Types.ObjectId;
  collegeId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  employeeId: string;         // e.g., "ECE-FAC-001"
  designation: string;        // e.g., "Assistant Professor", "Professor"
  qualification: string;      // e.g., "Ph.D. in VLSI Design"
  specialization: string[];   // e.g., ["VLSI", "Embedded Systems"]
  experience: number;         // Years of experience
  officeRoom?: string;
  officeHours?: string;       // e.g., "Mon & Wed 2-4 PM"
  phoneNumber?: string;
  publications?: number;
  profilePicUrl?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

const facultyProfileSchema = new Schema<IFacultyProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    collegeId: { type: Schema.Types.ObjectId, ref: "College", required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true },
    employeeId: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    qualification: { type: String, required: true, trim: true },
    specialization: [{ type: String, trim: true }],
    experience: { type: Number, default: 0 },
    officeRoom: { type: String, trim: true },
    officeHours: { type: String, trim: true },
    phoneNumber: { type: String, trim: true },
    publications: { type: Number, default: 0 },
    profilePicUrl: { type: String, trim: true },
    bio: { type: String, trim: true }
  },
  { timestamps: true }
);

facultyProfileSchema.index({ collegeId: 1, departmentId: 1, employeeId: 1 }, { unique: true });

export default mongoose.model<IFacultyProfile>("FacultyProfile", facultyProfileSchema);
