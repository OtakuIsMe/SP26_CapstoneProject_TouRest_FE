import { CreatePackagePayload, PackageDTO, PackageQuery, PackageWithServicesDTO, UpdatePackagePayload } from "@/types/package.type";
import { ServiceDTO, ServiceQuery } from "@/types/service.type";
import { ProviderDTO } from "@/types/provider.type";
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
};
