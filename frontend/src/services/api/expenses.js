import API from "./axios";

/**
 * Fetch all expenses for the current authenticated user.
 * @returns {Promise<Array>} The list of expenses.
 */
export const getExpenses = async () => {
  const response = await API.get("/expenses");
  return response.data;
};

/**
 * Create a new expense.
 * @param {Object} expenseData - The expense fields (title/description, amount, category_id, date).
 * @returns {Promise<Object>} The server response.
 */
export const createExpense = async (expenseData) => {
  const payload = {
    title: expenseData.description,
    description: expenseData.description,
    amount: parseFloat(expenseData.amount),
    category_id: expenseData.category_id,
    date: new Date(expenseData.date).toISOString(),
  };
  const response = await API.post("/expenses", payload);
  return response.data;
};

/**
 * Update an existing expense.
 * @param {string} id - The ID of the expense to update.
 * @param {Object} expenseData - The fields to update.
 * @returns {Promise<Object>} The server response.
 */
export const updateExpense = async (id, expenseData) => {
  const payload = {
    title: expenseData.description,
    description: expenseData.description,
    amount: parseFloat(expenseData.amount),
    category_id: expenseData.category_id,
    date: new Date(expenseData.date).toISOString(),
  };
  const response = await API.patch(`/expenses/${id}`, payload);
  return response.data;
};

/**
 * Delete an expense.
 * @param {string} id - The ID of the expense to delete.
 * @returns {Promise<Object>} The server response.
 */
export const deleteExpense = async (id) => {
  const response = await API.delete(`/expenses/${id}`);
  return response.data;
};
