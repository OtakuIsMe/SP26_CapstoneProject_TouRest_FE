import axiosClient from "../http/axios-client";

export type BookingItineraryStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";

export interface BookingItineraryDTO {
    id: string;
    bookingId: string;
    itineraryScheduleId: string;
    voucherId: string | null;
    price: number;
    finalPrice: number;
    numberOfGuests: number;
    status: BookingItineraryStatus;
    itineraryName: string | null;
    scheduleStartTime: string | null;
    scheduleEndTime: string | null;
    voucherCode: string | null;
    discountAmount: number;
    hasFeedback: boolean;
    // Journey detail fields
    itineraryId: string | null;
    guideName: string | null;
    guidePhone: string | null;
}

export interface StopActivityDTO {
    id: string;
    serviceId: string | null;
    serviceName: string | null;
    customName: string | null;
    serviceDescription: string | null;
    activityOrder: number;
    startTime: string;
    endTime: string;
    price: number;
    note: string | null;
}

export interface ItineraryStopDTO {
    id: string;
    stopOrder: number;
    name: string;
    address: string | null;
    latitude: number;
    longitude: number;
    providerId: string | null;
    providerName: string | null;
    vehicleId: string | null;
    vehicleName: string | null;
    vehicleType: string | null;
    activities: StopActivityDTO[];
}

export const bookingItineraryService = {
    getByBookingId: (bookingId: string): Promise<ApiResponse<BookingItineraryDTO[]>> =>
        axiosClient.get(`/booking-itineraries/booking/${bookingId}`),

    getById: (id: string): Promise<ApiResponse<BookingItineraryDTO>> =>
        axiosClient.get(`/booking-itineraries/${id}`),

    getStopsByItineraryId: (itineraryId: string): Promise<ApiResponse<ItineraryStopDTO[]>> =>
        axiosClient.get(`/itineraries/${itineraryId}/stops`),
};
