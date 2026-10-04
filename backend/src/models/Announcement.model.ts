import mongoose, { Schema, Document } from "mongoose";

export interface IAnnouncement extends Document {
  title: string;
  body: string;
  type: "general" | "reminder" | "notice";
  priority: "low" | "normal" | "high";
  authorId: mongoose.Types.ObjectId;
  collegeId: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId;
  batchId?: mongoose.Types.ObjectId;
  section?: string;
  notebookId?: mongoose.Types.ObjectId;
  attachmentUrls?: string[];
  audience: "college" | "department" | "batch" | "section" | "course" | "notebook";
  category?: "holiday" | "exam" | "deadline" | "schedule" | "instruction" | "general";
  isArchived: boolean;
  isPinned: boolean;
  scheduledAt?: Date;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    type: { type: String, enum: ["general", "reminder", "notice"], default: "general" },
    priority: { type: String, enum: ["low", "normal", "high"], default: "normal" },
    category: {
      type: String,
      enum: ["holiday", "exam", "deadline", "schedule", "instruction", "general"],
      default: "general"
    },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    collegeId: { type: Schema.Types.ObjectId, ref: "College", required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department" },
    courseId: { type: Schema.Types.ObjectId, ref: "Course" },
    batchId: { type: Schema.Types.ObjectId, ref: "Batch" },
    section: { type: String, trim: true },
    notebookId: { type: Schema.Types.ObjectId, ref: "Notebook" },
    attachmentUrls: [{ type: String }],
    audience: { type: String, enum: ["college", "department", "batch", "section", "course", "notebook"], required: true },
    isArchived: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    scheduledAt: { type: Date },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

announcementSchema.index({ collegeId: 1, isArchived: 1 });
announcementSchema.index({ departmentId: 1 });
announcementSchema.index({ courseId: 1 });
announcementSchema.index({ batchId: 1 });
announcementSchema.index({ notebookId: 1 });
announcementSchema.index({ title: "text", body: "text" });

export default mongoose.model<IAnnouncement>("Announcement", announcementSchema);
