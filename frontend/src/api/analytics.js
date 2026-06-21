import API from "./axios";

/**
 * Fetch the analytics summary for the authenticated user.
 * @returns {Promise<Object>} The analytics summary containing monthly spending, category breakdown, and other KPIs.
 */
export const getAnalyticsSummary = async () => {
  const response = await API.get("/analytics/summary");
  return response.data;
};

/**
 * Fetch the analytics trends (presets or custom range) for the authenticated user.
 * @param {Object} params Query parameters (range, start_date, end_date)
 * @returns {Promise<Object>} The trend analysis data.
 */
export const getAnalyticsTrends = async (params = {}) => {
  const response = await API.get("/analytics/trends", { params });
  return response.data;
};
