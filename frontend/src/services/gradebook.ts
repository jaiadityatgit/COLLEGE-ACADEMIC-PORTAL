import api from "./api";

export const getGrades = async (params?: any) => {
  const response = await api.get("/gradebook", { params });
  return response.data;
};

export const addGrade = async (data: any) => {
  const response = await api.post("/gradebook", data);
  return response.data;
};

export const updateGrade = async (id: string, data: any) => {
  const response = await api.patch(`/gradebook/${id}`, data);
  return response.data;
};

export const deleteGrade = async (id: string) => {
  const response = await api.delete(`/gradebook/${id}`);
  return response.data;
};

export const getResults = async (params?: any) => {
  const response = await api.get("/gradebook/results", { params });
  return response.data;
};
