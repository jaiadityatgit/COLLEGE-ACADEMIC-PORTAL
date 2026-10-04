import api from "./api";

export interface TeachingContext {
  assignmentId: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  academicYear: string;
  semester: number;
  batchId?: string;
  batchName?: string;
  section?: string;
  departmentId?: string;
  studentCount: number;
}

export interface ContextStudent {
  studentId: string;
  userId: string;
  name: string;
  email: string;
  registerNumber: string;
  section?: string;
  academicYear?: string;
  attendancePercentage: number;
}

export const teachingAssignmentService = {
  getAssignments: async (filters?: {
    courseId?: string;
    facultyId?: string;
    academicYear?: string;
    semester?: number;
    batchId?: string;
    section?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== "") params.append(k, String(v));
      });
    }
    return api.get(`/teaching-assignments?${params.toString()}`);
  },

  createAssignment: async (data: {
    facultyId: string;
    courseId: string;
    academicYear: string;
    semester: number;
    batchId?: string;
    section?: string;
  }) => {
    return api.post("/teaching-assignments", data);
  },

  removeAssignment: async (assignmentId: string) => {
    return api.delete(`/teaching-assignments/${assignmentId}`);
  },

  getMyContexts: async () => {
    return api.get<{ success: boolean; data: TeachingContext[] }>("/teaching-assignments/my-contexts");
  },

  getContextStudents: async (params: { courseId: string; section?: string; batchId?: string }) => {
    const search = new URLSearchParams();
    search.append("courseId", params.courseId);
    if (params.section) search.append("section", params.section);
    if (params.batchId) search.append("batchId", params.batchId);
    return api.get<{ success: boolean; data: { course: any; section?: string; students: ContextStudent[] } }>(
      `/teaching-assignments/context-students?${search.toString()}`
    );
  }
};
