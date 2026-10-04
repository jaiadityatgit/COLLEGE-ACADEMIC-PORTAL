import api from "./api";

export interface AcademicHierarchyNode {
  year: string;
  isCurrent?: boolean;
  departments: {
    departmentId: string;
    departmentCode: string;
    departmentName: string;
    batches: {
      batchId: string;
      batchName: string;
      currentSemester: number;
      sections: {
        section: string;
        studentCount: number;
        courses: {
          courseId: string;
          courseCode: string;
          courseName: string;
          semester: number;
          faculty: {
            facultyId: string;
            name: string;
            email: string;
          }[];
        }[];
      }[];
    }[];
  }[];
}

export const academicStructureService = {
  getHierarchy: async () => {
    return api.get<{ success: boolean; data: AcademicHierarchyNode[] }>("/academic-structure/hierarchy");
  },
  createAcademicYear: async (data: { year: string; name?: string; startDate?: string; endDate?: string; isCurrent?: boolean }) => {
    return api.post("/academic-structure/academic-years", data);
  },
  transitionSemester: async (data: { departmentId?: string; batchId?: string; targetSemester: number; academicYear?: string }) => {
    return api.post("/academic-structure/transition-semester", data);
  }
};
