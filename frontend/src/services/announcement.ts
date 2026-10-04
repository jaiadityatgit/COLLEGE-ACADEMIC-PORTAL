import api from "./api";

export interface AnnouncementItem {
  _id: string;
  title: string;
  body: string;
  audience: "college" | "department" | "batch" | "section" | "course";
  category?: "holiday" | "exam" | "deadline" | "schedule" | "instruction" | "general";
  priority?: "low" | "normal" | "urgent";
  authorId?: {
    _id: string;
    name: string;
    role: string;
  };
  courseId?: string;
  departmentId?: string;
  batchId?: string;
  section?: string;
  createdAt: string;
}

export const announcementService = {
  getAnnouncements: async (filters?: {
    courseId?: string;
    departmentId?: string;
    audience?: string;
    category?: string;
    notebookId?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== "") params.append(k, String(v));
      });
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    return api.get(`/announcements${query}`);
  },
  createAnnouncement: async (data: {
    title: string;
    body: string;
    audience: "college" | "department" | "batch" | "section" | "course";
    category?: "holiday" | "exam" | "deadline" | "schedule" | "instruction" | "general";
    priority?: "low" | "normal" | "urgent";
    courseId?: string;
    departmentId?: string;
    batchId?: string;
    section?: string;
    type?: string;
  }) => {
    return api.post("/announcements", data);
  },
  updateAnnouncement: async (id: string, data: any) => {
    return api.patch(`/announcements/${id}`, data);
  },
  archiveAnnouncement: async (id: string) => {
    return api.delete(`/announcements/${id}`);
  }
};
