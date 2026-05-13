import { AgencyDTO } from "@/types/agency.type";
import { ProviderDTO } from "@/types/provider.type";
import { ItineraryDTO, ItineraryScheduleDTO, ItineraryStopWithActivitiesDTO } from "@/types/itinerary.type";
import { PagedResult } from "@/types/common.type";
import { VehicleDTO, VehicleCreateRequest, VehicleUpdateRequest } from "@/types/vehicle.type";
import axiosClient from "../http/axios-client";

export type AgencyUserDTO = {
    agencyId: string;
    userId: string;
    agencyName: string;
    userFullName: string;
    role: string;
    email: string;
};

export type ProviderMarker = Pick<ProviderDTO, "id" | "name" | "latitude" | "longitude" | "address" | "contactPhone">;

export type CreateItineraryActivityPayload = {
    serviceId: string;
    activityOrder: number;
    startTime: string;
    endTime: string;
    price: number;
    note: string;
};

export type CreateItineraryStopPayload = {
    stopOrder: number;
    name: string;
    longitude: number;
    latitude: number;
    address: string;
    providerId?: string;
    vehicleId?: string;
    activities: CreateItineraryActivityPayload[];
};

export type CreateItineraryPayload = {
    name: string;
    description: string;
    duration: number;
    price: number;
    stops: CreateItineraryStopPayload[];
};

export const agencyService = {
    getItineraries: (params?: {
        limit?: number;
        page?: number;
        pageSize?: number;
        status?: string;
        lowPrice?: number;
        highPrice?: number;
        name?: string;
    }): Promise<ApiResponse<PagedResult<ItineraryDTO>>> =>
        axiosClient.get("/itineraries", { params }),

    register: (formData: FormData): Promise<ApiResponse<AgencyDTO>> =>
        axiosClient.post("/agencies", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }),

    getProviderMarkers: (): Promise<ApiResponse<ProviderMarker[]>> =>
        axiosClient.get("/providers/map"),

    createItinerary: (formData: FormData): Promise<ApiResponse<ItineraryDTO>> =>
        axiosClient.post("/itineraries/full", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }),

    getMe: (): Promise<ApiResponse<AgencyDTO>> =>
        axiosClient.get("/agencies/me"),

    getItinerariesByAgency: (agencyId: string): Promise<ApiResponse<ItineraryDTO[]>> =>
        axiosClient.get("/itineraries", { params: { agencyId } }),

    getMyItineraries: (): Promise<ApiResponse<ItineraryDTO[]>> =>
        axiosClient.get("/itineraries/my"),

    updateItinerary: (id: string, payload: {
        name: string; description: string; price: number; durationDays: number; status: string; agencyId: string;
    }): Promise<ApiResponse<ItineraryDTO>> =>
        axiosClient.put(`/itineraries/${id}`, payload),

    getItineraryById: (id: string): Promise<ApiResponse<ItineraryDTO>> =>
        axiosClient.get(`/itineraries/${id}`),

    getItineraryStops: (itineraryId: string): Promise<ApiResponse<ItineraryStopWithActivitiesDTO[]>> =>
        axiosClient.get(`/itineraries/${itineraryId}/stops`),

    getSchedules: (itineraryId: string): Promise<ApiResponse<ItineraryScheduleDTO[]>> =>
        axiosClient.get(`/itineraries/${itineraryId}/schedules`),

    addSchedule: (
        itineraryId: string,
        startTime: string,
        endTime: string,
        spot: number,
        guideId?: string,
    ): Promise<ApiResponse<ItineraryScheduleDTO>> =>
        axiosClient.post(`/itineraries/${itineraryId}/schedules`, {
            startTime,
            endTime,
            spot,
            guideId: guideId || undefined,
        }),

    deleteSchedule: (itineraryId: string, scheduleId: string): Promise<ApiResponse<void>> =>
        axiosClient.delete(`/itineraries/${itineraryId}/schedules/${scheduleId}`),

    getAgencyUsers: (agencyId: string): Promise<ApiResponse<AgencyUserDTO[]>> =>
        axiosClient.get("/agencies/user-list", { params: { agencyId } }),

    getMyVehicles: (): Promise<ApiResponse<VehicleDTO[]>> =>
        axiosClient.get("/vehicles/my"),

    createVehicle: (payload: VehicleCreateRequest): Promise<ApiResponse<VehicleDTO>> =>
        axiosClient.post("/vehicles", payload),

    updateVehicle: (id: string, payload: VehicleUpdateRequest): Promise<ApiResponse<VehicleDTO>> =>
        axiosClient.put(`/vehicles/${id}`, payload),

    deleteVehicle: (id: string): Promise<ApiResponse<void>> =>
        axiosClient.delete(`/vehicles/${id}`),

    deleteStop: (stopId: string): Promise<ApiResponse<void>> =>
        axiosClient.delete(`/itinerary-stops/${stopId}`),

    deleteActivity: (activityId: string): Promise<ApiResponse<void>> =>
        axiosClient.delete(`/itinerary-activities/${activityId}`),

    getFeedbacksByItinerary: (itineraryId: string): Promise<ApiResponse<{
        bookingItineraryId: string;
        rating: number;
        title: string;
        comment?: string;
        agencyReply?: string;
        repliedAt?: string;
        username?: string;
        userAvatar?: string;
        isAnonymous: boolean;
        status: string;
        createAt: string;
    }[]>> =>
        axiosClient.get(`/feedbacks/itinerary/${itineraryId}`),

    createBooking: (payload: {
        scheduleId: string;
        numberOfGuests: number;
        customerNote?: string;
    }): Promise<ApiResponse<{ bookingId: string; code: string; totalAmount: number; finalAmount: number; discountAmount: number }>> =>
        axiosClient.post("/bookings", payload),

    createPayment: (bookingId: string): Promise<ApiResponse<{
        id: string;
        bookingId: string;
        orderCode: number;
        amount: number;
        finalAmount: number;
        status: string;
        checkoutUrl?: string;
        qrCode?: string;
        expiredAt: string;
    }>> =>
        axiosClient.post(`/payment/create/${bookingId}`),

    getActivePayment: (bookingId: string): Promise<ApiResponse<{
        id: string;
        bookingId: string;
        orderCode: number;
        status: string;
        finalAmount: number;
    }>> =>
        axiosClient.get(`/payment/active/${bookingId}`),

    addStop: (itineraryId: string, payload: {
        stopOrder?: number;
        name: string;
        longitude: number;
        latitude: number;
        address?: string;
        providerId?: string;
        vehicleId?: string;
    }): Promise<ApiResponse<{ id: string }>> =>
        axiosClient.post("/itinerary-stops", payload, { params: { itineraryId } }),

    addActivity: (stopId: string, payload: {
        itineraryStopId: string;
        serviceId?: string;
        customName?: string;
        activityOrder: number;
        startTime: string;
        endTime: string;
        price: number;
        note?: string;
    }): Promise<ApiResponse<void>> =>
        axiosClient.post("/itinerary-activities", payload, { params: { stopId } }),
};
