import mongoose, { Schema, Document } from "mongoose";

export interface ICalendarEvent extends Document {
  collegeId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  type: "holiday" | "exam" | "event" | "deadline";
  startDate: Date;
  endDate?: Date;
  audience: "global" | "department" | "course";
  audienceId?: mongoose.Types.ObjectId; // Department ID or Course ID if audience isn't global
  createdAt: Date;
  updatedAt: Date;
}

const calendarEventSchema = new Schema<ICalendarEvent>(
  {
    collegeId: { type: Schema.Types.ObjectId, ref: "College", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: { type: String, enum: ["holiday", "exam", "event", "deadline"], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    audience: { type: String, enum: ["global", "department", "course"], default: "global" },
    audienceId: { type: Schema.Types.ObjectId }
  },
  { timestamps: true }
);

calendarEventSchema.index({ collegeId: 1, startDate: 1 });
calendarEventSchema.index({ collegeId: 1, audience: 1, audienceId: 1 });

export default mongoose.model<ICalendarEvent>("CalendarEvent", calendarEventSchema);
