import axios from "axios";
import { StorageKeys } from "@/constants/storage";

const axiosClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_TOUREST_API_URL + "/api",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

axiosClient.interceptors.request.use(
    (config) => {
        if (typeof window !== "undefined") {
            const accessToken = localStorage.getItem(StorageKeys.ACCESS_TOKEN);
            if (accessToken) {
                config.headers.Authorization = `Bearer ${accessToken}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

let lastRefreshTime = 0;
const REFRESH_COOLDOWN_MS = 60_000;

axiosClient.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        const originalRequest = error.config;

        const isAuthEndpoint = originalRequest.url?.includes("/auth/");
        const now = Date.now();
        const cooldownPassed = now - lastRefreshTime >= REFRESH_COOLDOWN_MS;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !isAuthEndpoint &&
            cooldownPassed
        ) {
            originalRequest._retry = true;
            lastRefreshTime = now;

            try {
                const refreshRes = await axiosClient.get("/auth/refresh");
                const newAccessToken = (refreshRes as any).data.accessToken;

                if (typeof window !== "undefined") {
                    localStorage.setItem(StorageKeys.ACCESS_TOKEN, newAccessToken);
                }

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return axiosClient(originalRequest);
            } catch {
                if (typeof window !== "undefined") {
                    localStorage.removeItem(StorageKeys.ACCESS_TOKEN);
                    window.location.href = "/signin";
                }
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosClient;
