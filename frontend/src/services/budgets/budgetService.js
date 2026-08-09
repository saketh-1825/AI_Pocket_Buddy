import API from "../api/axios";

export const getCurrentBudget = async () => {
  const response = await API.get("/budget/current");
  return response.data;
};

export const updateCurrentBudget = async (monthlyBudget) => {
  const response = await API.patch("/budget/current", { monthly_budget: monthlyBudget });
  return response.data;
};

export const getCategoryBudgets = async (month, year) => {
  const response = await API.get("/budgets", { params: { month, year } });
  return response.data;
};

export const createCategoryBudget = async (category, limitAmount, month, year) => {
  const response = await API.post("/budgets", {
    category,
    limit_amount: limitAmount,
    month,
    year
  });
  return response.data;
};

export const updateCategoryBudget = async (id, limitAmount) => {
  const response = await API.patch(`/budgets/${id}`, { limit_amount: limitAmount });
  return response.data;
};

export const deleteCategoryBudget = async (id) => {
  const response = await API.delete(`/budgets/${id}`);
  return response.data;
};

export const getBudgetSummary = async (month, year) => {
  const response = await API.get("/budgets/summary", { params: { month, year } });
  return response.data;
};

export const getBudgetAlerts = async () => {
  const response = await API.get("/budgets/alerts");
  return response.data;
};
