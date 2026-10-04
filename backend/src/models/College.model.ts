import mongoose, { Schema, Document } from "mongoose";

export interface ICollege extends Document {
  name: string;
  code?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const collegeSchema = new Schema<ICollege>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    address: { type: String, trim: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.models.College || mongoose.model<ICollege>("College", collegeSchema);
