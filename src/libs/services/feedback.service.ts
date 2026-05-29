import axiosClient from "../http/axios-client";

export type FeedbackItemType = "Service" | "Package";

export interface FeedbackCreatePayload {
    bookingItineraryId: string;
    itemType: FeedbackItemType;
    itemId: string;
    rating: number;
    title: string;
    comment?: string;
    isAnonymous: boolean;
}

export interface MyFeedbackDTO {
    bookingItineraryId: string;
    itemType: FeedbackItemType;
    itemId: string;
    itineraryId: string;
    itineraryName: string | null;
    rating: number;
    title: string;
    comment: string | null;
    agencyReply: string | null;
    repliedAt: string | null;
    username: string | null;
    userAvatar: string | null;
    isAnonymous: boolean;
    status: string;
    createAt: string;
}

export const feedbackService = {
    getMyBookingItineraryId: (itineraryId: string): Promise<ApiResponse<{ bookingItineraryId: string }>> =>
        axiosClient.get(`/feedbacks/my-booking-itinerary/${itineraryId}`),

    create: (data: FeedbackCreatePayload): Promise<ApiResponse<unknown>> =>
        axiosClient.post("/feedbacks", data),

    getMyFeedbacks: (): Promise<ApiResponse<MyFeedbackDTO[]>> =>
        axiosClient.get("/feedbacks/my"),
};
