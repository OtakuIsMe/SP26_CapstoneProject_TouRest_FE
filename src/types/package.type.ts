export type PackageServiceItem = {
    packageId: string;
    serviceId: string;
    sortOrder: number;
    serviceName: string;
    serviceDescription?: string;
    servicePrice: number;
    serviceDurationMinutes: number;
    serviceBasePrice: number;
};

export type PackageWithServicesDTO = {
    id: string;
    code: string;
    name: string;
    basePrice: number;
    status: string;
    createdAt: string;
    updatedAt?: string;
    services: PackageServiceItem[];
};

export type PackageDTO = {
    id: string;
    code: string;
    name: string;
    basePrice: number;
    status: string;
    serviceCount: number;
    createdAt: string;
    serviceIds?: string[];
};

export type CreatePackagePayload = {
    code: string;
    name: string;
    basePrice: number;
    serviceIds: string[];
};

export type PackageQuery = {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
};

export type UpdatePackagePayload = {
    code: string;
    name: string;
    basePrice: number;
    status: string;
    serviceIds: string[];
};
