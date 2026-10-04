import api from "./api";

export interface Source {
  _id: string;
  name: string;
  type: "pdf" | "docx" | "pptx" | "ppt";
  category: "lecture_notes" | "ppt" | "lab_manual" | "previous_paper" | "reference_book" | "assignment_material" | "other";
  path?: string;
  url?: string;
  courseId?: string;
  notebookId?: string;
  collegeId: string;
  uploadedBy: string;
  uploadedByRole: "faculty" | "student";
  status: "ready" | "failed";
  createdAt: string;
  updatedAt: string;
}

export const courseMaterialsService = {
  /**
   * Fetch course materials for a course or subject.
   * Supports both courseId and legacy notebookId.
   */
  getSources: async (id: string, role?: "faculty" | "student") => {
    const params = role ? { role } : {};
    const res = await api.get(`/sources/course/${id}`, { params });
    return res.data.data;
  },

  /**
   * Upload a course material file (PDF, DOCX, PPT, PPTX).
   */
  uploadSource: async (courseId: string, file: File, category?: string) => {
    const formData = new FormData();
    formData.append("courseId", courseId);
    formData.append("file", file);
    if (category) formData.append("category", category);

    const res = await api.post("/sources/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  },

  /**
   * Delete a course material file by ID.
   */
  deleteSource: async (id: string) => {
    const res = await api.delete(`/sources/${id}`);
    return res.data;
  },

  /**
   * Get download/inline URL for a source.
   */
  getDownloadUrl: (id: string, inline = false) => {
    const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "/api/v1";
    return `${apiUrl}/sources/${id}/download${inline ? "?inline=true" : ""}`;
  }
};

/** Backwards-compatibility export alias */
export const workspaceService = courseMaterialsService;
