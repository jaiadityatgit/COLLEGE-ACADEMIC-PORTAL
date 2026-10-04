import mongoose, { Schema, Document } from "mongoose";

export interface INotebook extends Document {
  name: string;
  courseId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  collegeId: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notebookSchema = new Schema<INotebook>(
  {
    name: { type: String, required: true, trim: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    collegeId: { type: Schema.Types.ObjectId, ref: "College", required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

notebookSchema.index({ courseId: 1 });
notebookSchema.index({ collegeId: 1 });

export default mongoose.model<INotebook>("Notebook", notebookSchema);
