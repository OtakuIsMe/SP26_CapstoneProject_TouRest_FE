import {
    LoginRequest,
    LoginResponse,
    RefreshTokenResponse,
    RegisterRequest,
    RegisterResponse,
} from "@/types/auth.type";
import axiosClient from "../http/axios-client";

export const authService = {
    login: (data: LoginRequest): Promise<ApiResponse<LoginResponse>> =>
        axiosClient.post("/auth/login", data),

    register: (data: RegisterRequest): Promise<ApiResponse<RegisterResponse>> =>
        axiosClient.post("/auth/register", data),

    refreshToken: (): Promise<ApiResponse<RefreshTokenResponse>> =>
        axiosClient.get("/auth/refresh"),

    logout: (): Promise<ApiResponse<null>> =>
        axiosClient.post("/auth/logout"),
};