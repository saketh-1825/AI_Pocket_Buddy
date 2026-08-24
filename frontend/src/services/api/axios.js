import axios from "axios";
import { toast } from "react-toastify";
import { useAuthStore } from "../../store/authStore";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

API.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const errorMessage = data?.detail || data?.message || "Something went wrong";

      if (status === 401 || status === 403) {
        // Only redirect to login if we are not already on login or register pages
        if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
          toast.error("Session expired. Please login again.", { theme: "dark" });
          useAuthStore.getState().clearAuth();
          window.location.href = "/login";
        } else {
          toast.error(errorMessage, { theme: "dark" });
        }
      } else if (status === 500) {
        toast.error("Internal Server Error. Please try again later.", { theme: "dark" });
      } else {
        const isAnalytics404 = status === 404 && error.config?.url?.endsWith("/analytics/summary");
        if (!isAnalytics404) {
          toast.error(errorMessage, { theme: "dark" });
        }
      }
    } else {
      toast.error("Network error. Please check your backend connection.", { theme: "dark" });
    }
    return Promise.reject(error);
  }
);

export default API;