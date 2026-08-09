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
 * Converts a YYYY-MM-DD date string to a timezone-safe ISO string.
 * Using noon (12:00) in the local timezone prevents the UTC midnight
 * representation from rolling backwards a day for users in UTC+ zones.
 * @param {string} dateStr - The YYYY-MM-DD string from the date input.
 * @returns {string} ISO 8601 string with explicit date, safe across timezones.
 */
const toSafeDateISO = (dateStr) => {
  // Parse the parts directly — avoids any ambiguous Date constructor behavior.
  const [year, month, day] = dateStr.split("-").map(Number);
  // Build a local noon datetime so the UTC representation is always on the same calendar day.
  const d = new Date(year, month - 1, day, 12, 0, 0, 0);
  return d.toISOString();
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
    date: toSafeDateISO(expenseData.date),
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
    date: toSafeDateISO(expenseData.date),
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
