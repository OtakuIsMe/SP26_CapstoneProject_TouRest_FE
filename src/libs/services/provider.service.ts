import { CreatePackagePayload, PackageDTO, PackageQuery, PackageWithServicesDTO, UpdatePackagePayload } from "@/types/package.type";
import { ServiceDTO, ServiceQuery } from "@/types/service.type";
import { ProviderDTO, ProviderDetailDTO } from "@/types/provider.type";
import { ProviderScheduleDTO } from "@/types/itinerary.type";
import { ProviderDashboardStats, ProviderJobsTrend, ProviderPendingRequest, ProviderActivePackage, ProviderTopAgency } from "@/types/dashboard.type";
import { ProviderTourGroupDTO, ProviderPatientDTO, ProviderPassengerDTO, BookingStopMedicalResultDTO } from "@/types/provider-staff.type";
import axiosClient from "../http/axios-client";

// Matches TouRest.Domain.Enums.ServiceStatus: Inactive=0, Active=1, Discontinued=2
export enum ServiceStatus {
    Inactive     = 0,
    Active       = 1,
    Discontinued = 2,
}

export type CreateServicePayload = {
    providerId: string;
    name: string;
    description?: string;
    price: number;
    basePrice: number;
    durationMinutes: number;
    status: ServiceStatus;
};

export type UpdateServicePayload = {
    name: string;
    description?: string;
    price: number;
    basePrice: number;
    durationMinutes: number;
    status: string;
};

export const providerService = {
    register: (formData: FormData): Promise<ApiResponse<ProviderDTO>> =>
        axiosClient.post("/providers", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }),

    getMe: (): Promise<ApiResponse<ProviderDTO>> =>
        axiosClient.get("/providers/me"),

    getById: (id: string): Promise<ApiResponse<ProviderDetailDTO>> =>
        axiosClient.get(`/providers/${id}/detail`),

    getServices: (params?: ServiceQuery): Promise<ApiResponse<ServiceDTO[]>> =>
        axiosClient.get("/services", { params }),

    createService: (payload: CreateServicePayload): Promise<ApiResponse<ServiceDTO>> =>
        axiosClient.post("/services", payload),

    getPackages: (params?: PackageQuery): Promise<ApiResponse<PackageDTO[]>> =>
        axiosClient.get("/packages", { params }),

    createPackage: (payload: CreatePackagePayload): Promise<ApiResponse<PackageDTO>> =>
        axiosClient.post("/packages", payload),

    getServicesByProvider: (providerId: string): Promise<ApiResponse<ServiceDTO[]>> =>
        axiosClient.get(`/services/provider/${providerId}`),

    getServiceById: (id: string): Promise<ApiResponse<ServiceDTO>> =>
        axiosClient.get(`/services/${id}`),

    updateService: (id: string, payload: UpdateServicePayload): Promise<ApiResponse<ServiceDTO>> =>
        axiosClient.put(`/services/${id}`, payload),

    getPackagesByProvider: (providerId: string): Promise<ApiResponse<PackageWithServicesDTO[]>> =>
        axiosClient.get(`/packages/provider/${providerId}`),

    getPackageById: (id: string): Promise<ApiResponse<PackageDTO>> =>
        axiosClient.get(`/packages/${id}`),

    getPackageDetail: (id: string): Promise<ApiResponse<PackageWithServicesDTO>> =>
        axiosClient.get(`/packages/${id}/detail`),

    updatePackage: (id: string, payload: UpdatePackagePayload): Promise<ApiResponse<PackageDTO>> =>
        axiosClient.put(`/packages/${id}`, payload),

    getJobSchedules: (): Promise<ApiResponse<ProviderScheduleDTO[]>> =>
        axiosClient.get("/providers/jobs/schedules"),

    getDashboardStats: (providerId: string): Promise<ApiResponse<ProviderDashboardStats>> =>
        axiosClient.get("/providers/dashboard/stats", { params: { providerId } }),

    getJobsTrend: (providerId: string, year: number): Promise<ApiResponse<ProviderJobsTrend>> =>
        axiosClient.get("/providers/jobs/trend", { params: { providerId, year } }),

    getPendingRequests: (providerId: string): Promise<ApiResponse<ProviderPendingRequest[]>> =>
        axiosClient.get("/providers/requests/pending", { params: { providerId } }),

    getActivePackages: (providerId: string): Promise<ApiResponse<ProviderActivePackage[]>> =>
        axiosClient.get("/providers/dashboard/active-packages", { params: { providerId } }),

    getTopAgencies: (providerId: string): Promise<ApiResponse<ProviderTopAgency[]>> =>
        axiosClient.get("/providers/dashboard/top-agencies", { params: { providerId } }),

    getTourGroups: (): Promise<ApiResponse<ProviderTourGroupDTO[]>> =>
        axiosClient.get("/providers/groups"),

    getGroupPatients: (scheduleId: string): Promise<ApiResponse<ProviderPatientDTO[]>> =>
        axiosClient.get(`/providers/groups/${scheduleId}/patients`),

    getGroupPassengers: (scheduleId: string): Promise<ApiResponse<ProviderPassengerDTO[]>> =>
        axiosClient.get(`/providers/groups/${scheduleId}/passengers`),

    sendMedicalResult: (scheduleId: string, passengerId: string, data: FormData): Promise<ApiResponse<ProviderPassengerDTO>> =>
        axiosClient.post(`/providers/groups/${scheduleId}/passengers/${passengerId}/results`, data, {
            headers: { "Content-Type": "multipart/form-data" },
        }),

    getBookingStopResults: (bookingId: string, stopId: string): Promise<ApiResponse<BookingStopMedicalResultDTO>> =>
        axiosClient.get(`/bookings/${bookingId}/stops/${stopId}/medical-results`),
};
