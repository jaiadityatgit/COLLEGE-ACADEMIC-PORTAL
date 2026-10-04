import mongoose, { Schema, Document } from "mongoose";

export interface ITimetable extends Document {
  collegeId: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  facultyId: mongoose.Types.ObjectId;
  dayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "10:30"
  room?: string;
  type: "lecture" | "lab" | "tutorial";
  createdAt: Date;
  updatedAt: Date;
}

const timetableSchema = new Schema<ITimetable>(
  {
    collegeId: { type: Schema.Types.ObjectId, ref: "College", required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department" },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    facultyId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    room: { type: String, required: false, default: "", trim: true },
    type: { type: String, enum: ["lecture", "lab", "tutorial"], default: "lecture" }
  },
  { timestamps: true }
);

// Indexes to speed up queries by course, faculty, or department
timetableSchema.index({ collegeId: 1, courseId: 1 });
timetableSchema.index({ collegeId: 1, facultyId: 1 });
timetableSchema.index({ collegeId: 1, departmentId: 1 });

export default mongoose.model<ITimetable>("Timetable", timetableSchema);
