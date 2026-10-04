import api from "./api";

export interface SearchResult {
  id: string;
  sourceId?: string;
  sourceName: string;
  notebookId: string;
  notebookName: string;
  page: number;
  snippet: string;
  confidence: number;
  appearsIn: string[];
}

export const searchService = {
  globalSearch: async (query: string): Promise<SearchResult[]> => {
    const res = await api.post("/search", { query });
    return res.data.data;
  }
};
