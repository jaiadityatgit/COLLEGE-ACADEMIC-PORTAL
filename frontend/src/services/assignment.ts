import api from "./api";

export const assignmentService = {
  // Faculty routes
  createAssignment: async (data: any) => {
    return api.post("/assignments", data);
  },
  getAssignments: async (courseId?: string) => {
    return api.get(`/assignments${courseId ? `?courseId=${courseId}` : ""}`);
  },
  updateAssignment: async (id: string, data: any) => {
    return api.patch(`/assignments/${id}`, data);
  },
  deleteAssignment: async (id: string) => {
    return api.delete(`/assignments/${id}`);
  },
  getSubmissions: async (assignmentId: string) => {
    return api.get(`/assignments/${assignmentId}/submissions`);
  },
  gradeSubmission: async (submissionId: string, data: { marks: number; feedback?: string; assignmentId?: string; studentId?: string }) => {
    return api.patch(`/assignments/submissions/${submissionId}/grade`, data);
  },

  // Attachment routes
  uploadAttachment: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/assignments/upload-attachment", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  },
  uploadSubmissionFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/assignments/upload-submission-file", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  },

  // Student routes
  submitAssignment: async (assignmentId: string, data: { files: any[]; notes?: string; notebookId?: string }) => {
    return api.post(`/assignments/${assignmentId}/submit`, data);
  },
  getMySubmissions: async () => {
    return api.get("/assignments/my-submissions");
  }
};
