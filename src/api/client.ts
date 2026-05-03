import axios, { type AxiosError, type AxiosInstance } from "axios";

const apiBaseUrl =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:4004";

export const apiClient: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("nautilus_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear token and redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("nautilus_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
