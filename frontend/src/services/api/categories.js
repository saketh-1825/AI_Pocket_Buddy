import API from "./axios";

/**
 * Fetch all categories for the current authenticated user.
 * @returns {Promise<Array>} The list of categories.
 */
export const getCategories = async () => {
  const response = await API.get("/categories");
  return response.data;
};

/**
 * Create a new category.
 * @param {Object} categoryData - The category fields (name, color, icon_key).
 * @returns {Promise<Object>} The server response.
 */
export const createCategory = async (categoryData) => {
  const response = await API.post("/categories", categoryData);
  return response.data;
};

/**
 * Delete a category by ID.
 * @param {string} id - The ID of the category to delete.
 * @returns {Promise<Object>} The server response.
 */
export const deleteCategory = async (id) => {
  const response = await API.delete(`/categories/${id}`);
  return response.data;
};

/**
 * Restore a soft-deleted category by ID.
 * @param {string} id - The ID of the category to restore.
 * @returns {Promise<Object>} The server response.
 */
export const restoreCategory = async (id) => {
  const response = await API.post(`/categories/${id}/restore`);
  return response.data;
};

/**
 * Update an existing category by ID (PATCH).
 * @param {string} id - The ID of the category to update.
 * @param {Object} categoryData - The fields to update (name, color, icon_key).
 * @returns {Promise<Object>} The server response.
 */
export const updateCategory = async (id, categoryData) => {
  const response = await API.patch(`/categories/${id}`, categoryData);
  return response.data;
};
