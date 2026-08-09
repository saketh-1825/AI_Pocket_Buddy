import API from "../api/axios";

export const getAnalyticsSummary = async () => {
  const response = await API.get("/analytics/summary");
  return response.data;
};

export const getAnalyticsTrends = async (params = {}) => {
  const response = await API.get("/analytics/trends", { params });
  return response.data;
};

export const getAnalyticsHeatmap = async () => {
  const response = await API.get("/analytics/heatmap");
  return response.data;
};

export const getAnalyticsRunningBalance = async () => {
  const response = await API.get("/analytics/running-balance");
  return response.data;
};
