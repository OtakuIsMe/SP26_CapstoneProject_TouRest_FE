import axios from "axios";
import { authService } from "../services/auth.service";
import { StorageKeys } from "@/constants/storage";

console.log("API Base URL:", process.env.NEXT_PUBLIC_TOUREST_API_URL);

const axiosClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_TOUREST_API_URL + "/api",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

axiosClient.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem(StorageKeys.ACCESS_TOKEN);

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

let lastRefreshTime = 0;
const REFRESH_COOLDOWN_MS = 60_000; // 1 minute

axiosClient.interceptors.response.use(
    (response) => {
        return response.data;
    },
    async (error) => {
        const originalRequest = error.config;

        const isRefreshEndpoint = originalRequest.url?.includes("/auth/refresh");
        const now = Date.now();
        const cooldownPassed = now - lastRefreshTime >= REFRESH_COOLDOWN_MS;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !isRefreshEndpoint &&
            cooldownPassed
        ) {
            originalRequest._retry = true;
            lastRefreshTime = now;

            try {
                const refreshRes = await authService.refreshToken();

                const newAccessToken = refreshRes.data.accessToken;
                localStorage.setItem(StorageKeys.ACCESS_TOKEN, newAccessToken);

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                return axiosClient(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem(StorageKeys.ACCESS_TOKEN);
                window.location.href = "/signin";
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosClient;
