import AuditLog from "../models/AuditLog.model";

export interface LogAcademicCorrectionParams {
  collegeId: any;
  actorId: any;
  actorRole: string;
  action: "attendance_correction" | "mark_correction" | "assignment_edit" | "timetable_update" | "announcement_update";
  entityType: "attendance" | "grade" | "assignment" | "timetable" | "announcement";
  entityId: string;
  courseId?: any;
  studentId?: any;
  previousValue?: any;
  newValue: any;
  reason?: string;
}

export async function logAcademicCorrection(params: LogAcademicCorrectionParams): Promise<void> {
  try {
    if (!params.collegeId || !params.actorId || !params.entityId) {
      return;
    }

    await AuditLog.create({
      collegeId: params.collegeId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: params.action,
      entityType: params.entityType,
      entityId: String(params.entityId),
      courseId: params.courseId || undefined,
      studentId: params.studentId || undefined,
      previousValue: params.previousValue,
      newValue: params.newValue,
      reason: params.reason ? String(params.reason).trim() : undefined,
      timestamp: new Date()
    });
  } catch (error) {
    // Non-blocking for operational writes
    console.warn("⚠️ [auditService] Failed to record academic correction log:", error);
  }
}
