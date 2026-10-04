import mongoose, { Schema, Document } from "mongoose";

export interface IExam extends Document {
  collegeId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  title: string;
  type: "midterm" | "final" | "practical" | "internal";
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  room: string;
  facultyId?: mongoose.Types.ObjectId; // invigilator
  totalMarks: number;
  status: "scheduled" | "completed" | "cancelled" | "published";
  createdAt: Date;
  updatedAt: Date;
}

const examSchema = new Schema<IExam>(
  {
    collegeId: { type: Schema.Types.ObjectId, ref: "College", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ["midterm", "final", "practical", "internal"], required: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    room: { type: String, required: true, trim: true },
    facultyId: { type: Schema.Types.ObjectId, ref: "User" },
    totalMarks: { type: Number, required: true },
    status: { type: String, enum: ["scheduled", "completed", "cancelled", "published"], default: "scheduled" }
  },
  { timestamps: true }
);

examSchema.index({ collegeId: 1, courseId: 1, date: 1 });
examSchema.index({ collegeId: 1, facultyId: 1 });

export default mongoose.model<IExam>("Exam", examSchema);
