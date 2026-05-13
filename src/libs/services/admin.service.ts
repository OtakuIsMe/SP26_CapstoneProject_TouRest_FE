import { AgencyDetailDTO, AgencyDTO } from "@/types/agency.type";
import { ProviderDetailDTO, ProviderDTO } from "@/types/provider.type";
import axiosClient from "../http/axios-client";

export type PagedResult<T> = {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
};

export const adminService = {
    getProviders: (): Promise<ApiResponse<ProviderDTO[]>> =>
        axiosClient.get("/admins/pending-providers"),

    getAgencies: (): Promise<ApiResponse<AgencyDTO[]>> =>
        axiosClient.get("/admins/pending-agencies"),

    getAllAgencies: (page = 1, pageSize = 10): Promise<ApiResponse<PagedResult<AgencyDTO>>> =>
        axiosClient.get("/agencies", { params: { page, pageSize } }),

    getAllProviders: (page = 1, pageSize = 10): Promise<ApiResponse<PagedResult<ProviderDTO>>> =>
        axiosClient.get("/providers", { params: { page, pageSize } }),

    approveProvider: (id: string): Promise<ApiResponse<void>> =>
        axiosClient.put(`/admins/providers/${id}/approve`),

    rejectProvider: (id: string): Promise<ApiResponse<void>> =>
        axiosClient.put(`/admins/providers/${id}/reject`),

    approveAgency: (id: string): Promise<ApiResponse<void>> =>
        axiosClient.put(`/admins/agencies/${id}/approve`),

    rejectAgency: (id: string): Promise<ApiResponse<void>> =>
        axiosClient.put(`/admins/agencies/${id}/reject`),

    createAgencyAccount: (
        id: string,
        body: { email: string; password: string; username: string; phone?: string }
    ): Promise<ApiResponse<void>> =>
        axiosClient.post(`/admins/agencies/${id}/create-account`, body),

    createProviderAccount: (
        id: string,
        body: { email: string; password: string; username: string; phone?: string }
    ): Promise<ApiResponse<void>> =>
        axiosClient.post(`/admins/providers/${id}/create-account`, body),

    getProviderDetail: (id: string): Promise<ApiResponse<ProviderDetailDTO>> =>
        axiosClient.get(`/providers/${id}/detail`),

    getAgencyDetail: (id: string): Promise<ApiResponse<AgencyDetailDTO>> =>
        axiosClient.get(`/agencies/${id}/detail`),
};
