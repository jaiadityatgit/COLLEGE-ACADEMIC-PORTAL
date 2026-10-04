import api from "./api";

export const getTimetable = async (params?: any) => {
  const response = await api.get("/timetable", { params });
  return response.data;
};

export const createTimetableRecord = async (data: any) => {
  const response = await api.post("/timetable", data);
  return response.data;
};

export const updateTimetableRecord = async (id: string, data: any) => {
  const response = await api.patch(`/timetable/${id}`, data);
  return response.data;
};

export const deleteTimetableRecord = async (id: string) => {
  const response = await api.delete(`/timetable/${id}`);
  return response.data;
};
