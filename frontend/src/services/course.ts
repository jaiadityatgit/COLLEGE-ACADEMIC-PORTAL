import api from "./api";

export const courseService = {
  createCourse: async (data: { name: string; courseCode?: string; description?: string }) => {
    return api.post("/courses", data);
  },
  getCourses: async () => {
    return api.get("/courses");
  },
  getCourseIntelligence: async (courseId: string) => {
    return api.get(`/courses/${courseId}/intelligence`);
  },
  getCourseStudents: async (courseId: string) => {
    return api.get(`/courses/${courseId}/students`);
  },
  getCourseFaculty: async (courseId: string) => {
    return api.get(`/courses/${courseId}/faculty`);
  },
  enrollStudent: async (courseId: string, studentId: string) => {
    return api.post(`/courses/${courseId}/enroll`, { studentId });
  },
  removeStudent: async (courseId: string, studentId: string) => {
    return api.delete(`/courses/${courseId}/enroll/${studentId}`);
  },
  assignFaculty: async (courseId: string, facultyIds: string[]) => {
    return api.patch(`/courses/${courseId}/faculty`, { facultyIds });
  }
};
