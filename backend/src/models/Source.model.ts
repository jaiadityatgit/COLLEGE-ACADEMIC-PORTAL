import mongoose, { Schema, Document } from "mongoose";

export interface ISource extends Document {
  name: string;
  type: "pdf" | "docx" | "pptx" | "ppt";
  category: "lecture_notes" | "ppt" | "lab_manual" | "previous_paper" | "reference_book" | "assignment_material" | "other";
  path?: string;
  url?: string;
  courseId?: mongoose.Types.ObjectId;
  notebookId?: mongoose.Types.ObjectId; // Legacy compatibility field
  collegeId: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  /** "faculty" = teacher-official source; "student" = personal upload */
  uploadedByRole: "faculty" | "student";
  status: "ready" | "failed";
  isActive: boolean;
  metadata: {
    pageCount?: number;
    fileSize?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const sourceSchema = new Schema<ISource>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["pdf", "docx", "pptx", "ppt"], required: true },
    category: {
      type: String,
      enum: ["lecture_notes", "ppt", "lab_manual", "previous_paper", "reference_book", "assignment_material", "other"],
      default: "other"
    },
    path: { type: String },
    url: { type: String },
    courseId: { type: Schema.Types.ObjectId, ref: "Course" },
    notebookId: { type: Schema.Types.ObjectId, ref: "Notebook" }, // Legacy compatibility
    collegeId: { type: Schema.Types.ObjectId, ref: "College", required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    uploadedByRole: {
      type: String,
      enum: ["faculty", "student"],
      required: true,
      default: "student"
    },
    status: {
      type: String,
      enum: ["ready", "failed"],
      default: "ready"
    },
    isActive: { type: Boolean, default: true },
    metadata: {
      pageCount: { type: Number },
      fileSize: { type: Number }
    }
  },
  { timestamps: true }
);

sourceSchema.index({ courseId: 1 });
sourceSchema.index({ notebookId: 1 });
sourceSchema.index({ collegeId: 1 });

export default mongoose.model<ISource>("Source", sourceSchema);
