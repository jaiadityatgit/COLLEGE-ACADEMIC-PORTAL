import api from "./api";

export const getExams = async (params?: any) => {
  const response = await api.get("/exams", { params });
  return response.data;
};

export const createExam = async (data: any) => {
  const response = await api.post("/exams", data);
  return response.data;
};

export const updateExam = async (id: string, data: any) => {
  const response = await api.patch(`/exams/${id}`, data);
  return response.data;
};

export const deleteExam = async (id: string) => {
  const response = await api.delete(`/exams/${id}`);
  return response.data;
};
