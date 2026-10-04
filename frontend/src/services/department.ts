import api from "./api";

export const departmentService = {
  createDepartment: async (data: { departmentCode: string; departmentName: string; description?: string }) => {
    return api.post("/departments", data);
  },
  getDepartments: async () => {
    return api.get("/departments");
  },
  updateDepartment: async (id: string, data: any) => {
    return api.patch(`/departments/${id}`, data);
  },
  archiveDepartment: async (id: string) => {
    return api.delete(`/departments/${id}`);
  },
  getDepartmentCourses: async (id: string) => {
    return api.get(`/departments/${id}/courses`);
  },
  assignCourseToDepartment: async (id: string, courseId: string) => {
    return api.post(`/departments/${id}/courses`, { courseId });
  },
  getMyDepartment: async () => {
    return api.get("/departments/mine");
  }
};
