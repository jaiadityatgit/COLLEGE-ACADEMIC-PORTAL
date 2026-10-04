import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog extends Document {
  collegeId: mongoose.Types.ObjectId;
  actorId: mongoose.Types.ObjectId;
  actorRole: string;
  action:
    | "attendance_correction"
    | "mark_correction"
    | "assignment_edit"
    | "timetable_update"
    | "announcement_update"
    | "announcement_create"
    | "student_provision"
    | "bulk_student_provision"
    | "faculty_provision"
    | "teaching_assignment"
    | "enrollment_change"
    | "semester_transition"
    | "academic_structure_create";
  entityType:
    | "attendance"
    | "grade"
    | "assignment"
    | "timetable"
    | "announcement"
    | "student"
    | "faculty"
    | "teaching_assignment"
    | "academic_structure"
    | "enrollment";
  entityId: string;
  courseId?: mongoose.Types.ObjectId;
  studentId?: mongoose.Types.ObjectId;
  previousValue?: any;
  newValue: any;
  reason?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    collegeId: { type: Schema.Types.ObjectId, ref: "College", required: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorRole: { type: String, required: true },
    action: {
      type: String,
      enum: [
        "attendance_correction",
        "mark_correction",
        "assignment_edit",
        "timetable_update",
        "announcement_update",
        "announcement_create",
        "student_provision",
        "bulk_student_provision",
        "faculty_provision",
        "teaching_assignment",
        "enrollment_change",
        "semester_transition",
        "academic_structure_create"
      ],
      required: true
    },
    entityType: {
      type: String,
      enum: [
        "attendance",
        "grade",
        "assignment",
        "timetable",
        "announcement",
        "student",
        "faculty",
        "teaching_assignment",
        "academic_structure",
        "enrollment"
      ],
      required: true
    },
    entityId: { type: String, required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course" },
    studentId: { type: Schema.Types.ObjectId, ref: "User" },
    previousValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed, required: true },
    reason: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

auditLogSchema.index({ collegeId: 1, entityType: 1, timestamp: -1 });
auditLogSchema.index({ collegeId: 1, courseId: 1, timestamp: -1 });
auditLogSchema.index({ collegeId: 1, studentId: 1, timestamp: -1 });
auditLogSchema.index({ collegeId: 1, actorId: 1, timestamp: -1 });

export default mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
