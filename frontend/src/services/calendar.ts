import api from "./api";

export const getCalendarEvents = async (params?: any) => {
  const response = await api.get("/calendar", { params });
  return response.data;
};

export const createCalendarEvent = async (data: any) => {
  const response = await api.post("/calendar", data);
  return response.data;
};

export const updateCalendarEvent = async (id: string, data: any) => {
  const response = await api.patch(`/calendar/${id}`, data);
  return response.data;
};

export const deleteCalendarEvent = async (id: string) => {
  const response = await api.delete(`/calendar/${id}`);
  return response.data;
};
