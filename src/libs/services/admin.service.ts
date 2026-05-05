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
        axiosClient.get("/admin/pending-providers"),

    getAgencies: (): Promise<ApiResponse<AgencyDTO[]>> =>
        axiosClient.get("/admin/pending-agencies"),

    getAllAgencies: (page = 1, pageSize = 10): Promise<ApiResponse<PagedResult<AgencyDTO>>> =>
        axiosClient.get("/agency", { params: { page, pageSize } }),

    getAllProviders: (page = 1, pageSize = 10): Promise<ApiResponse<PagedResult<ProviderDTO>>> =>
        axiosClient.get("/providers", { params: { page, pageSize } }),

    approveProvider: (id: string): Promise<ApiResponse<void>> =>
        axiosClient.put(`/admin/provider/${id}/approve`),

    rejectProvider: (id: string): Promise<ApiResponse<void>> =>
        axiosClient.put(`/admin/provider/${id}/reject`),

    approveAgency: (id: string): Promise<ApiResponse<void>> =>
        axiosClient.put(`/admin/agency/${id}/approve`),

    rejectAgency: (id: string): Promise<ApiResponse<void>> =>
        axiosClient.put(`/admin/agency/${id}/reject`),

    createAgencyAccount: (
        id: string,
        body: { email: string; password: string; username: string; phone?: string }
    ): Promise<ApiResponse<void>> =>
        axiosClient.post(`/admin/agency/${id}/create-account`, body),

    createProviderAccount: (
        id: string,
        body: { email: string; password: string; username: string; phone?: string }
    ): Promise<ApiResponse<void>> =>
        axiosClient.post(`/admin/provider/${id}/create-account`, body),

    getProviderDetail: (id: string): Promise<ApiResponse<ProviderDetailDTO>> =>
        axiosClient.get(`/providers/${id}/detail`),

    getAgencyDetail: (id: string): Promise<ApiResponse<AgencyDetailDTO>> =>
        axiosClient.get(`/agency/${id}/detail`),
};
