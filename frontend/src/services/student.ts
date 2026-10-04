import api from "./api";

export const studentService = {
  getPortfolio: async () => {
    const res = await api.get("/students/portfolio");
    return res.data.data;
  },

  addSkill: async (name: string, proficiency: string) => {
    const res = await api.post("/students/skills", { name, proficiency });
    return res.data.data;
  },

  deleteSkill: async (id: string) => {
    const res = await api.delete(`/students/skills/${id}`);
    return res.data;
  },

  addProject: async (project: {
    title: string;
    description: string;
    gitHubUrl?: string;
    demoUrl?: string;
    technologies: string[];
    isFeatured: boolean;
  }) => {
    const res = await api.post("/students/projects", project);
    return res.data.data;
  },

  deleteProject: async (id: string) => {
    const res = await api.delete(`/students/projects/${id}`);
    return res.data;
  },

  addCertification: async (cert: {
    name: string;
    issuingOrganization: string;
    issueDate?: string;
    credentialUrl?: string;
  }) => {
    const res = await api.post("/students/certifications", cert);
    return res.data.data;
  },

  deleteCertification: async (id: string) => {
    const res = await api.delete(`/students/certifications/${id}`);
    return res.data;
  },

  addAchievement: async (ach: { title: string; description: string; dateAwarded?: string }) => {
    const res = await api.post("/students/achievements", ach);
    return res.data.data;
  },

  deleteAchievement: async (id: string) => {
    const res = await api.delete(`/students/achievements/${id}`);
    return res.data;
  }
};
