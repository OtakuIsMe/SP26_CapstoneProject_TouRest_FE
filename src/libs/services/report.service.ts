import axiosClient from "../http/axios-client";

// ── Enums (match backend) ─────────────────────────────────────────
export type ReportItemType = "Service" | "Package" | "Booking" | "User" | "Feedback";
export type ReportStatus   = "Pending" | "Reviewed" | "Resolved" | "Rejected";

// ── DTOs ─────────────────────────────────────────────────────────
export interface ReportDTO {
    id?: string;
    userId: string;
    title: string;
    description: string;
    itemId: string;
    itemType: ReportItemType;
    status: ReportStatus;
    imageUrls?: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface ReportCreateRequest {
    userId: string;
    title: string;
    description: string;
    itemId: string;
    itemType: ReportItemType;
    status: ReportStatus;
    imageUrls?: string[];
}

export interface ReportSearch {
    userName?: string;
    title?: string;
    itemType?: ReportItemType;
    itemId?: string;
    status?: ReportStatus;
}

export const reportService = {
    search: (params: ReportSearch): Promise<ApiResponse<ReportDTO[]>> =>
        axiosClient.get("/reports/search", { params }),

    getById: (id: string): Promise<ApiResponse<ReportDTO>> =>
        axiosClient.get(`/reports/${id}`),

    create: (data: ReportCreateRequest): Promise<ApiResponse<ReportDTO>> =>
        axiosClient.post("/reports", data),

    update: (id: string, description: string, status: ReportStatus): Promise<ApiResponse<ReportDTO>> =>
        axiosClient.put(`/reports/${id}`, { description, status }),

    remove: (id: string): Promise<ApiResponse<boolean>> =>
        axiosClient.delete(`/reports/${id}`),
};
