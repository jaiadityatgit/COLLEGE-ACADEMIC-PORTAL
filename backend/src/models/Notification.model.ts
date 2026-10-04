import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  collegeId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: "attendance" | "grade" | "announcement" | "system" | "exam" | "assignment" | "timetable";
  isRead: boolean;
  actionUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    collegeId: { type: Schema.Types.ObjectId, ref: "College", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: ["attendance", "grade", "announcement", "system", "exam", "assignment", "timetable"], default: "system" },
    isRead: { type: Boolean, default: false },
    actionUrl: { type: String, trim: true }
  },
  { timestamps: true }
);

notificationSchema.index({ collegeId: 1, userId: 1, createdAt: -1 });
notificationSchema.index({ collegeId: 1, userId: 1, isRead: 1 });

export default mongoose.model<INotification>("Notification", notificationSchema);
