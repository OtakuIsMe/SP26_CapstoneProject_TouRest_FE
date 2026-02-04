import {
    LoginRequest,
    LoginResponse,
    RefreshTokenResponse,
    RegisterRequest,
    RegisterResponse,
} from "@/types/auth.type";
import axiosClient from "../http/axios-client";

export const authService = {
    login(data: LoginRequest) {
        return axiosClient.post<LoginResponse>("/auth/login", data);
    },
    register(data: RegisterRequest) {
        return axiosClient.post<RegisterResponse>("/auth/register", data);
    },
    refreshToken() {
        return axiosClient.get<RefreshTokenResponse>("/auth/refresh");
    }
}