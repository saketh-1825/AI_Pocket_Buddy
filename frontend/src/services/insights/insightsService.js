import API from "../api/axios";

export const getCalendarHeatmap = async () => {
  const response = await API.get("/insights/calendar-heatmap");
  return response.data;
};

export const getBudgetVsActual = async () => {
  const response = await API.get("/insights/budget-vs-actual");
  return response.data;
};

export const createCategoryBudget = async (category, monthlyBudget) => {
  const response = await API.post("/insights/budget", {
    category,
    monthly_budget: monthlyBudget
  });
  return response.data;
};

export const getWordCloud = async () => {
  const response = await API.get("/insights/word-cloud");
  return response.data;
};

export const getWeeklyComparison = async () => {
  const response = await API.get("/insights/weekly-comparison");
  return response.data;
};

export const getSpendingPattern = async () => {
  const response = await API.get("/insights/spending-pattern");
  return response.data;
};

export const getAISummary = async () => {
  const response = await API.get("/insights/ai-summary");
  return response.data;
};
