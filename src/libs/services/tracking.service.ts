import axiosClient from "../http/axios-client";

export type TrackingType = 0 | 1; // 0 = Activity, 1 = Stop
export const TrackingTypeActivity: TrackingType = 0;
export const TrackingTypeStop: TrackingType = 1;

export interface TrackingDTO {
    id: string;
    itineraryScheduleId: string;
    trackingId: string;
    type: TrackingType;
    createdAt: string;
}

export interface TrackRequest {
    itineraryScheduleId: string;
    trackingId: string;
    type: TrackingType;
}

export const trackingService = {
    getByScheduleId: (scheduleId: string): Promise<ApiResponse<TrackingDTO[]>> =>
        axiosClient.get("/itinerary-tracking", { params: { scheduleId } }),

    track: (request: TrackRequest): Promise<ApiResponse<TrackingDTO>> =>
        axiosClient.post("/itinerary-tracking", request),

    untrack: (scheduleId: string, trackingId: string, type: TrackingType): Promise<ApiResponse<void>> =>
        axiosClient.delete("/itinerary-tracking", { params: { scheduleId, trackingId, type } }),
};
