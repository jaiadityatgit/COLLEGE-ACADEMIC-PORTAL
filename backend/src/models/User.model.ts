import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: "super_admin" | "college_admin" | "department_admin" | "hod" | "faculty" | "lab_staff" | "dept_office" | "student";
  collegeId?: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId;
  assignedCourseIds: mongoose.Types.ObjectId[];
  isActive: boolean;
  lastLogin?: Date;
  designation?: string;
  profilePicUrl?: string;
  phoneNumber?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["super_admin", "college_admin", "department_admin", "hod", "faculty", "lab_staff", "dept_office", "student"],
      default: "student"
    },
    collegeId: { type: Schema.Types.ObjectId, ref: "College" },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department" },
    assignedCourseIds: [{ type: Schema.Types.ObjectId, ref: "Course" }],
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    designation: { type: String, trim: true },
    profilePicUrl: { type: String, trim: true },
    phoneNumber: { type: String, trim: true }
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash") || this.passwordHash.startsWith("$2a$") || this.passwordHash.startsWith("$2b$")) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export default mongoose.model<IUser>("User", userSchema);
