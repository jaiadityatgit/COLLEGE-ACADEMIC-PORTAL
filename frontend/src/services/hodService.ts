import api from "./api";

export const hodService = {
  getDashboard: async () => {
    const res = await api.get("/hod/dashboard");
    return res.data.data;
  },

  getFacultyDirectory: async () => {
    const res = await api.get("/hod/faculty");
    return res.data.data;
  },

  getStudentAnalytics: async (params?: { semester?: string; section?: string; courseId?: string }) => {
    const res = await api.get("/hod/student-analytics", { params });
    return res.data.data;
  },

  getCourseAnalytics: async (courseId?: string) => {
    const res = await api.get("/hod/course-analytics", { params: courseId ? { courseId } : {} });
    return res.data.data;
  },

  getLabManagement: async () => {
    const res = await api.get("/hod/labs");
    return res.data.data;
  },

  getApprovalQueue: async () => {
    const res = await api.get("/hod/approvals");
    return res.data.data;
  },

  processApproval: async (id: string, action: "approve" | "reject", type: string) => {
    const res = await api.post(`/hod/approvals/${id}`, { action, type });
    return res.data.data;
  },

  getReport: async (type: string) => {
    const res = await api.get("/hod/reports", { params: { type } });
    return res.data.data;
  }
};
