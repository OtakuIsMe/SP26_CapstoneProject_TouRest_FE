import axiosClient from "../http/axios-client";

export type PayoutStatus = "Pending" | "Approved" | "Rejected" | "Completed";

export interface PayoutDTO {
    id: string;
    walletId: string;
    amount: number;
    status: PayoutStatus;
    adminNote: string | null;
    payOSTransferId: string | null;
    paidAt: string | null;
    bankAccount: string;
    bankName: string;
    accountHolder: string;
    requestedByName: string | null;
    requestedByEmail: string | null;
    ownerType: "Agency" | "Provider" | "User" | null;
    createdAt: string;
}

export interface PayoutRequestPayload {
    amount: number;
    bankAccount: string;
    bankName: string;
    accountHolder: string;
}

export interface PayoutReviewPayload {
    adminNote?: string;
}

// All endpoints to be confirmed with teammate's API list
export const payoutService = {
    getAll: (): Promise<ApiResponse<PayoutDTO[]>> =>
        axiosClient.get("/payouts"),

    getMy: (): Promise<ApiResponse<PayoutDTO[]>> =>
        axiosClient.get("/payouts/my"),

    request: (data: PayoutRequestPayload): Promise<ApiResponse<PayoutDTO>> =>
        axiosClient.post("/payouts/request", data),

    approve: (id: string, data?: PayoutReviewPayload): Promise<ApiResponse<unknown>> =>
        axiosClient.put(`/payouts/${id}/approve`, data ?? {}),

    reject: (id: string, data: PayoutReviewPayload): Promise<ApiResponse<unknown>> =>
        axiosClient.put(`/payouts/${id}/reject`, data),
};
