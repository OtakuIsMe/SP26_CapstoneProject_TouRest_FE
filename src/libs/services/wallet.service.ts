import axiosClient from "../http/axios-client";

export type WalletTransactionType   = "Credit" | "Debit";
export type WalletTransactionReason = "BookingEarning" | "Refund" | "Payout" | "PayoutRejected" | "BookingPayment";

export interface WalletDTO {
    id: string;
    userId: string | null;
    agencyId: string | null;
    providerId: string | null;
    balance: number;
    pendingBalance: number;
    ownerType?: string;
}

export interface WalletTransactionDTO {
    id: string;
    walletId: string;
    amount: number;
    type: WalletTransactionType;
    reason: WalletTransactionReason;
    referenceId: string | null;
    note: string | null;
    createdAt: string;
}

export interface SavedBankDTO {
    bankAccount: string;
    bankName: string;
    accountHolder: string;
    lastUsedAt: string;
}

export interface PayoutRequestDTO {
    amount: number;
    bankAccount: string;
    bankName: string;
    accountHolder: string;
}

export interface WalletTopUpDTO {
    orderCode: number;
    amount: number;
    status: string;
    checkoutUrl?: string;
    qrCode?: string;
    expiredAt?: string;
}

export const walletService = {
    getMyWallet: (): Promise<ApiResponse<WalletDTO>> =>
        axiosClient.get("/wallet"),

    getMyTransactions: (): Promise<ApiResponse<WalletTransactionDTO[]>> =>
        axiosClient.get("/wallet/transactions"),

    getSavedBanks: (): Promise<ApiResponse<SavedBankDTO[]>> =>
        axiosClient.get("/wallet/banks"),

    requestPayout: (data: PayoutRequestDTO): Promise<ApiResponse<unknown>> =>
        axiosClient.post("/wallet/payout", data),

    createTopUp: (amount: number): Promise<ApiResponse<WalletTopUpDTO>> =>
        axiosClient.post("/wallet/topup", { amount }),

    getTopUpStatus: (orderCode: number): Promise<ApiResponse<WalletTopUpDTO>> =>
        axiosClient.get(`/wallet/topup/${orderCode}/status`),

    finalizeTopUp: (orderCode: number): Promise<ApiResponse<unknown>> =>
        axiosClient.post(`/wallet/topup/finalize/${orderCode}`),
};
