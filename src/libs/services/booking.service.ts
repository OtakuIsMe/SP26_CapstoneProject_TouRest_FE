import axiosClient from "../http/axios-client";

export type BookingStatus   = "Pending" | "Confirmed" | "Cancelled" | "Completed";
export type PaymentStatus   = "Pending" | "Paid" | "Failed" | "Refunded" | "Cancelled";

export interface BookingDTO {
    id: string;
    userId: string;
    userName: string;
    code: string;
    totalAmount: number;
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    customerNote: string | null;
    internalNote: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface BookingCreateRequest {
    scheduleId: string;
    numberOfGuests: number;
    voucherCode?: string;
    customerNote?: string;
}

export interface BookingCreateResponse {
    bookingId: string;
    code: string;
    totalAmount: number;
    status: BookingStatus;
}

export const bookingService = {
    getMyBookings: (status?: BookingStatus): Promise<ApiResponse<BookingDTO[]>> =>
        axiosClient.get("/bookings/me", { params: status ? { status } : undefined }),

    getById: (id: string): Promise<ApiResponse<BookingDTO>> =>
        axiosClient.get(`/bookings/${id}`),

    create: (data: BookingCreateRequest): Promise<ApiResponse<BookingCreateResponse>> =>
        axiosClient.post("/bookings", data),

    cancel: (id: string): Promise<ApiResponse<unknown>> =>
        axiosClient.put(`/bookings/${id}`, { status: "Cancelled" }),
};
