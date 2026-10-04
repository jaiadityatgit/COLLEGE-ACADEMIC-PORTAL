import mongoose, { Schema, Document } from "mongoose";

export interface ISubmission extends Document {
  collegeId: mongoose.Types.ObjectId;
  assignmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  notebookId?: mongoose.Types.ObjectId;
  files: string[]; // URLs or file paths
  notes?: string;
  submittedAt: Date;
  version: number;
  submissionHistory: { notes?: string; files?: string[]; submittedAt: Date }[];
  marks?: number;
  feedback?: string;
  status: "submitted" | "late" | "graded" | "returned";
  createdAt: Date;
  updatedAt: Date;
}

const submissionSchema = new Schema<ISubmission>(
  {
    collegeId: { type: Schema.Types.ObjectId, ref: "College", required: true },
    assignmentId: { type: Schema.Types.ObjectId, ref: "Assignment", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    notebookId: { type: Schema.Types.ObjectId, ref: "Notebook" },
    files: [{ type: String }],
    notes: { type: String, trim: true },
    submittedAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1 },
    submissionHistory: [
      {
        notes: { type: String },
        files: [{ type: String }],
        submittedAt: { type: Date, default: Date.now }
      }
    ],
    marks: { type: Number },
    feedback: { type: String },
    status: { type: String, enum: ["submitted", "late", "graded", "returned"], default: "submitted" }
  },
  { timestamps: true }
);

submissionSchema.index({ collegeId: 1, assignmentId: 1, studentId: 1 }, { unique: true });

export default mongoose.model<ISubmission>("Submission", submissionSchema);
