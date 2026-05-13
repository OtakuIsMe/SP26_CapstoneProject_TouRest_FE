import {
    LoginRequest,
    LoginResponse,
    RefreshTokenResponse,
    RegisterRequest,
    RegisterResponse,
    UserResponse,
} from "@/types/auth.type";
import axiosClient from "../http/axios-client";

export const authService = {
    login: (data: LoginRequest): Promise<ApiResponse<LoginResponse>> =>
        axiosClient.post("/auths/login", data),

    register: (data: RegisterRequest): Promise<ApiResponse<RegisterResponse>> =>
        axiosClient.post("/auths/register", data),

    refreshToken: (): Promise<ApiResponse<RefreshTokenResponse>> =>
        axiosClient.get("/auths/refresh"),

    logout: (): Promise<ApiResponse<null>> =>
        axiosClient.post("/auths/logout"),

    getMe: (): Promise<ApiResponse<UserResponse>> =>
        axiosClient.get("/auths/me"),
};