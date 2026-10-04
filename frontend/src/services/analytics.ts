import api from "./api";

export const analyticsService = {
  getStudentAnalytics: async (userId?: string) => {
    const url = userId ? `/analytics/student/${userId}` : "/analytics/student/me";
    const res = await api.get(url);
    return res.data.data;
  }
};
