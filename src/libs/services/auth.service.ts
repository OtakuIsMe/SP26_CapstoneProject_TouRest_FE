import {
    LoginRequest,
    LoginResponse,
} from "@/types/auth.type";
import axiosClient from "../http/axios-client";

export const authService = {
    login(data: LoginRequest) {
        return axiosClient.post<LoginResponse>("/auth/login", data);
    }
}