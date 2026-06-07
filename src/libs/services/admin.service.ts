import { AgencyDetailDTO, AgencyDTO } from "@/types/agency.type";
import { AdminScheduleDTO } from "@/types/itinerary.type";
import { ProviderDetailDTO, ProviderDTO } from "@/types/provider.type";
import { AdminDashboardStats, AdminTrend, PendingApproval, TopAgency } from "@/types/dashboard.type";
import { VoucherDTO, VoucherCreateRequest, VoucherUpdateRequest } from "@/types/voucher.type";
import { ScheduleEarningDTO } from "@/types/earning.type";
import { AgencyCancelResultDTO } from "@/libs/services/agency.service";
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

export interface AdminScheduleCancelPreviewDTO {
    scheduleId: string;
    affectedBookings: number;
    totalDepositRefund: number;
    totalCustomerRefund: number;
}

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

    approveAgency: (
        id: string,
        body: { email: string; password: string; username: string; phone?: string; role?: number }
    ): Promise<ApiResponse<void>> =>
        axiosClient.put(`/admins/agencies/${id}/approve`, { ...body, role: body.role ?? 0 }),

    rejectAgency: (id: string): Promise<ApiResponse<void>> =>
        axiosClient.put(`/admins/agencies/${id}/reject`),

    createAgencyAccount: (
        id: string,
        body: { email: string; password: string; username: string; phone?: string }
    ): Promise<ApiResponse<void>> =>
        axiosClient.post(`/admins/agencies/${id}/create-account`, body),

    createProviderAccount: (
        id: string,
        body: { email: string; password: string; username: string; phone?: string; role?: number }
    ): Promise<ApiResponse<void>> =>
        axiosClient.post(`/admins/providers/${id}/create-account`, { ...body, role: body.role ?? 0 }),

    getProviderDetail: (id: string): Promise<ApiResponse<ProviderDetailDTO>> =>
        axiosClient.get(`/providers/${id}/detail`),

    getAgencyDetail: (id: string): Promise<ApiResponse<AgencyDetailDTO>> =>
        axiosClient.get(`/agencies/${id}/detail`),

    getDashboardStats: (): Promise<ApiResponse<AdminDashboardStats>> =>
        axiosClient.get("/admins/stats"),

    getDashboardTrend: (year: number): Promise<ApiResponse<AdminTrend>> =>
        axiosClient.get("/admins/bookings/trend", { params: { year } }),

    getPendingApprovals: (): Promise<ApiResponse<PendingApproval[]>> =>
        axiosClient.get("/admins/requests"),

    getTopAgencies: (limit = 5): Promise<ApiResponse<TopAgency[]>> =>
        axiosClient.get("/admins/agencies", { params: { limit } }),

    // ── Vouchers ──────────────────────────────────────────────────────────────
    getVouchers: (): Promise<ApiResponse<VoucherDTO[]>> =>
        axiosClient.get("/vouchers"),

    getVoucherById: (id: string): Promise<ApiResponse<VoucherDTO>> =>
        axiosClient.get(`/vouchers/${id}`),

    createVoucher: (payload: VoucherCreateRequest): Promise<ApiResponse<VoucherDTO>> =>
        axiosClient.post("/vouchers", payload),

    updateVoucher: (id: string, payload: VoucherUpdateRequest): Promise<ApiResponse<VoucherDTO>> =>
        axiosClient.put(`/vouchers/${id}`, payload),

    deleteVoucher: (id: string): Promise<ApiResponse<void>> =>
        axiosClient.delete(`/vouchers/${id}`),

    // ── Schedules ───────────────────────────────────────────────────────────
    getAllSchedules: (): Promise<ApiResponse<AdminScheduleDTO[]>> =>
        axiosClient.get("/admins/schedules"),

    previewCancelSchedule: (scheduleId: string): Promise<ApiResponse<AdminScheduleCancelPreviewDTO>> =>
        axiosClient.get(`/admins/schedules/${scheduleId}/cancel-preview`),

    cancelSchedule: (scheduleId: string): Promise<ApiResponse<AgencyCancelResultDTO>> =>
        axiosClient.post(`/admins/schedules/${scheduleId}/cancel`),

    // ── Earnings ──────────────────────────────────────────────────────────────
    getScheduleEarnings: (): Promise<ApiResponse<ScheduleEarningDTO[]>> =>
        axiosClient.get("/admins/schedule-earnings"),

    releaseEarnings: (scheduleId: string): Promise<ApiResponse<void>> =>
        axiosClient.post(`/admins/schedule-earnings/${scheduleId}/release`),
};
