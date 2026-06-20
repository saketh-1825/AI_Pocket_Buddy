import API from "./axios";

/**
 * Fetch the budget for the current month and year.
 * @returns {Promise<Object>} The current budget object.
 */
export const getCurrentBudget = async () => {
  const response = await API.get("/budget/current");
  return response.data;
};

/**
 * Update the budget for the current month and year.
 * @param {number} monthlyBudget - The new budget amount.
 * @returns {Promise<Object>} The updated budget object.
 */
export const updateCurrentBudget = async (monthlyBudget) => {
  const response = await API.patch("/budget/current", { monthly_budget: monthlyBudget });
  return response.data;
};
