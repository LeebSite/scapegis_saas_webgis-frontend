import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || "/api/v1";

const http = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    // Prevent infinite loops
    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          const res = await axios.post(`${API_BASE}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          if (res.data.access_token) {
            localStorage.setItem("access_token", res.data.access_token);
            originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`;
            return http(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed (token expired or invalid)
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
      }
    }

    // If not 401 or refresh failed/no refresh token
    if (err.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
    }

    return Promise.reject(err);
  }
);

export default http;
