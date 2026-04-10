import { AgencyDTO } from "@/types/agency.type";
import { ProviderDTO } from "@/types/provider.type";
import axiosClient from "../http/axios-client";

export const adminService = {
    getProviders: (): Promise<ApiResponse<ProviderDTO[]>> =>
        axiosClient.get("/providers"),

    getAgencies: (): Promise<ApiResponse<AgencyDTO[]>> =>
        axiosClient.get("/agencies"),

    approveProvider: (id: string): Promise<ApiResponse<ProviderDTO>> =>
        axiosClient.put(`/providers/${id}/approve`),

    rejectProvider: (id: string): Promise<ApiResponse<ProviderDTO>> =>
        axiosClient.put(`/providers/${id}/reject`),

    approveAgency: (id: string): Promise<ApiResponse<AgencyDTO>> =>
        axiosClient.put(`/agencies/${id}/approve`),

    rejectAgency: (id: string): Promise<ApiResponse<AgencyDTO>> =>
        axiosClient.put(`/agencies/${id}/reject`),
};
