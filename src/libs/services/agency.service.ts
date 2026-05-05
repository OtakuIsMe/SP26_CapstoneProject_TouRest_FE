import { AgencyDTO } from "@/types/agency.type";
import { ProviderDTO } from "@/types/provider.type";
import { ItineraryDTO, ItineraryScheduleDTO, ItineraryStopWithActivitiesDTO } from "@/types/itinerary.type";
import { PagedResult } from "@/types/common.type";
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
        axiosClient.get("/itinerary", { params }),

    register: (formData: FormData): Promise<ApiResponse<AgencyDTO>> =>
        axiosClient.post("/agency", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }),

    getProviderMarkers: (): Promise<ApiResponse<ProviderMarker[]>> =>
        axiosClient.get("/providers/map"),

    createItinerary: (formData: FormData): Promise<ApiResponse<ItineraryDTO>> =>
        axiosClient.post("/itinerary/full", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }),

    getMe: (): Promise<ApiResponse<AgencyDTO>> =>
        axiosClient.get("/agency/me"),

    getItinerariesByAgency: (agencyId: string): Promise<ApiResponse<ItineraryDTO[]>> =>
        axiosClient.get("/itinerary", { params: { agencyId } }),

    getMyItineraries: (): Promise<ApiResponse<ItineraryDTO[]>> =>
        axiosClient.get("/itinerary/my"),

    updateItinerary: (id: string, payload: {
        name: string; description: string; price: number; durationDays: number; status: string; agencyId: string;
    }): Promise<ApiResponse<ItineraryDTO>> =>
        axiosClient.put(`/itinerary/${id}`, payload),

    getItineraryById: (id: string): Promise<ApiResponse<ItineraryDTO>> =>
        axiosClient.get(`/itinerary/${id}`),

    getItineraryStops: (itineraryId: string): Promise<ApiResponse<ItineraryStopWithActivitiesDTO[]>> =>
        axiosClient.get(`/itinerary/${itineraryId}/stops`),

    getSchedules: (itineraryId: string): Promise<ApiResponse<ItineraryScheduleDTO[]>> =>
        axiosClient.get(`/itinerary/${itineraryId}/schedules`),

    addSchedule: (
        itineraryId: string,
        startTime: string,
        endTime: string,
        spot: number,
        guideId?: string,
    ): Promise<ApiResponse<ItineraryScheduleDTO>> =>
        axiosClient.post(`/itinerary/${itineraryId}/schedules`, {
            startTime,
            endTime,
            spot,
            guideId: guideId || undefined,
        }),

    deleteSchedule: (itineraryId: string, scheduleId: string): Promise<ApiResponse<void>> =>
        axiosClient.delete(`/itinerary/${itineraryId}/schedules/${scheduleId}`),

    getAgencyUsers: (agencyId: string): Promise<ApiResponse<AgencyUserDTO[]>> =>
        axiosClient.get("/agency/user-list", { params: { agencyId } }),
};
