import mongoose, { Schema, Document } from "mongoose";

export interface IAssignment extends Document {
  collegeId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  notebookId?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  instructions?: string;
  rubric?: string;
  allowResubmission?: boolean;
  attachments: string[]; // URLs or file paths
  dueDate: Date;
  totalMarks: number;
  submissionMethod?: string;
  status: "draft" | "published" | "closed";
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<IAssignment>(
  {
    collegeId: { type: Schema.Types.ObjectId, ref: "College", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    notebookId: { type: Schema.Types.ObjectId, ref: "Notebook" },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    instructions: { type: String },
    rubric: { type: String },
    allowResubmission: { type: Boolean, default: true },
    attachments: [{ type: String }],
    dueDate: { type: Date, required: true },
    totalMarks: { type: Number, required: true, default: 100 },
    submissionMethod: { type: String, default: "online" },
    status: { type: String, enum: ["draft", "published", "closed"], default: "published" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

assignmentSchema.index({ collegeId: 1, courseId: 1 });
assignmentSchema.index({ collegeId: 1, title: 1 });

export default mongoose.model<IAssignment>("Assignment", assignmentSchema);
