import { CreatePackagePayload, PackageDTO, PackageQuery, PackageWithServicesDTO } from "@/types/package.type";
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
    price: number;       // int
    basePrice: number;   // int
    durationMinutes: number;
    status: ServiceStatus;
};

export const providerService = {
    register: (formData: FormData): Promise<ApiResponse<ProviderDTO>> =>
        axiosClient.post("/providers", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }),

    getMe: (): Promise<ApiResponse<ProviderDTO>> =>
        axiosClient.get("/providers/me"),

    getServices: (params?: ServiceQuery): Promise<ApiResponse<ServiceDTO[]>> =>
        axiosClient.get("/service", { params }),

    createService: (payload: CreateServicePayload): Promise<ApiResponse<ServiceDTO>> =>
        axiosClient.post("/service", payload),

    getPackages: (params?: PackageQuery): Promise<ApiResponse<PackageDTO[]>> =>
        axiosClient.get("/packages", { params }),

    createPackage: (payload: CreatePackagePayload): Promise<ApiResponse<PackageDTO>> =>
        axiosClient.post("/packages", payload),

    getServicesByProvider: (providerId: string): Promise<ApiResponse<ServiceDTO[]>> =>
        axiosClient.get(`/service/provider/${providerId}`),

    getPackagesByProvider: (providerId: string): Promise<ApiResponse<PackageWithServicesDTO[]>> =>
        axiosClient.get(`/packages/provider/${providerId}`),
};
