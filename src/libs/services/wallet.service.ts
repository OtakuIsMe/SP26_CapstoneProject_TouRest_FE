import axiosClient from "../http/axios-client";

export type WalletTransactionType   = "Credit" | "Debit";
export type WalletTransactionReason = "BookingEarning" | "Refund" | "Payout" | "PayoutRejected";

export interface WalletDTO {
    id: string;
    userId: string | null;
    agencyId: string | null;
    providerId: string | null;
    balance: number;
    pendingBalance: number;
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

// These will be filled in once the teammate sends the API list
export const walletService = {
    getMyWallet: (): Promise<ApiResponse<WalletDTO>> =>
        axiosClient.get("/wallet/me"),

    getMyTransactions: (): Promise<ApiResponse<WalletTransactionDTO[]>> =>
        axiosClient.get("/wallet/transactions"),
};
