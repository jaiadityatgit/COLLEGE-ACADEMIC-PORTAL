import api from "./api";

export const attendanceService = {
  getAttendance: (params?: any) => {
    return api.get("/attendance", { params });
  },

  markAttendance: (data: any) => {
    return api.post("/attendance", data);
  },

  markBulkAttendance: (data: any) => {
    return api.post("/attendance/bulk", data);
  },

  updateAttendance: (id: string, data: any) => {
    return api.patch(`/attendance/${id}`, data);
  },

  deleteAttendance: (id: string) => {
    return api.delete(`/attendance/${id}`);
  },

  getAttendanceSummary: (params?: any) => {
    return api.get("/attendance/summary", { params });
  }
};
