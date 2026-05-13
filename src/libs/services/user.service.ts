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

export type AdminUpdateUserPayload = {
    username:      string;
    fullName?:     string;
    phone?:        string;
    status:        string;   // Active | Inactive | Locked
    roleCode:      string;   // CUSTOMER | ADMIN | PROVIDER | AGENCY
    dateOfBirth?:  string;   // ISO 8601
    addressDetail?: string;
    cityId?:       string;
    districtId?:   string;
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

    adminUpdateUser: (id: string, data: AdminUpdateUserPayload): Promise<ApiResponse<UserDTO>> =>
        axiosClient.put(`/users/${id}`, data),

    getAllUsers: (): Promise<ApiResponse<UserDTO[]>> =>
        axiosClient.get("/users/all"),

    uploadImage: (file: File): Promise<ApiResponse<{ url: string }>> => {
        const fd = new FormData();
        fd.append("file", file);
        return axiosClient.post("/media/upload", fd, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },
};
