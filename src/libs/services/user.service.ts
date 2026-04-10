import { UpdateProfileRequest, UserDTO, UserQuery } from "@/types/user.type";
import axiosClient from "../http/axios-client";

export type CreateUserPayload = {
    username:   string;
    email:      string;
    password:   string;
    phone?:     string;
    roleCode:   string;    // CUSTOMER | PROVIDER | AGENCY
    providerId?: string;   // required when roleCode = PROVIDER
    agencyId?:   string;   // required when roleCode = AGENCY
};

export const userService = {
    getAll: (params?: UserQuery): Promise<ApiResponse<PagedResult<UserDTO>>> =>
        axiosClient.get("/users", { params }),

    getById: (id: string): Promise<ApiResponse<UserDTO>> =>
        axiosClient.get(`/users/${id}`),

    updateProfile: (data: UpdateProfileRequest): Promise<ApiResponse<UserDTO>> =>
        axiosClient.put("/users/profile", data),

    createUser: (data: CreateUserPayload): Promise<ApiResponse<UserDTO>> =>
        axiosClient.post("/users", data),
};
