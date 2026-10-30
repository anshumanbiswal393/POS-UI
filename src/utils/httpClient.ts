import axios from "axios";
import { BASEURL } from "@/config/variables";
import { getStoredAccessToken, getStoredSubdomain } from "@/utils/cookieAuth";
import { authApi } from "@/services/auth-api";

/**
 * Single shared Axios instance with automatic JWT Authorization,
 * Tenant subdomain headers, and 401 token refresh retry.
 */
const httpClient = axios.create({
  baseURL: BASEURL,
  timeout: 30_000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      try {
        const token = getStoredAccessToken();
        if (token && !config.headers["Authorization"]) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }

        const subdomain = getStoredSubdomain();
        if (subdomain && !config.headers["X-Tenant-Subdomain"]) {
          config.headers["X-Tenant-Subdomain"] = subdomain;
        }

        const activeOutletId = localStorage.getItem("retrod_pos_active_outlet_id");
        if (activeOutletId && !config.headers["X-Outlet-ID"]) {
          config.headers["X-Outlet-ID"] = activeOutletId;
        }

        const activePropertyId = localStorage.getItem("retrod:active-property-id");
        if (activePropertyId && !config.headers["X-Property-ID"]) {
          config.headers["X-Property-ID"] = activePropertyId;
        }
      } catch {
        // ignore
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized with token refresh (once per request)
    if (error?.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token) {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
            }
            return httpClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await authApi.refreshToken();
        if (newToken) {
          processQueue(null, newToken);
          originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
          return httpClient(originalRequest);
        } else {
          processQueue(new Error("Session expired"), null);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("pos-auth-expired"));
          }
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("pos-auth-expired"));
        }
      } finally {
        isRefreshing = false;
      }
    }

    const normalized = {
      message: error?.response?.data?.error || error?.response?.data?.message || error?.message || "Request failed",
      status: error?.response?.status as number | undefined,
      data: error?.response?.data as unknown,
      raw: error,
    };
    return Promise.reject(normalized);
  },
);

export default httpClient;
