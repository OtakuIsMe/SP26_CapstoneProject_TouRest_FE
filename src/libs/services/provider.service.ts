import { PackageDTO, PackageQuery } from "@/types/package.type";
import { ServiceDTO, ServiceQuery } from "@/types/service.type";
import { ProviderDTO } from "@/types/provider.type";
import axiosClient from "../http/axios-client";

// Matches TouRest.Domain.Enums.ServiceStatus: Inactive=0, Active=1, Discontinued=2
export enum ServiceStatus {
    Inactive     = 0,
    Active       = 1,
    Discontinued = 2,
}

export type RegisterProviderPayload = {
    name: string;
    description?: string;
    contactEmail: string;
    contactPhone: string;
    latitude?: number;
    longitude?: number;
    openingTime?: string;
    closingTime?: string;
    images?: string[];
};

export type CreateServicePayload = {
    name: string;
    description?: string;
    price: number;       // int
    basePrice: number;   // int
    durationMinutes: number;
    status: ServiceStatus;
};

export const providerService = {
    register: (payload: RegisterProviderPayload): Promise<ApiResponse<ProviderDTO>> =>
        axiosClient.post("/providers", payload),

    getServices: (params?: ServiceQuery): Promise<ApiResponse<PagedResult<ServiceDTO>>> =>
        axiosClient.get("/services", { params }),

    createService: (payload: CreateServicePayload): Promise<ApiResponse<ServiceDTO>> =>
        axiosClient.post("/services", payload),

    getPackages: (params?: PackageQuery): Promise<ApiResponse<PagedResult<PackageDTO>>> =>
        axiosClient.get("/packages", { params }),
};
