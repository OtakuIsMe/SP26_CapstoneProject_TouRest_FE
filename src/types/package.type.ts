export type PackageDTO = {
    id: string;
    code: string;
    name: string;
    basePrice: number;
    status: string;
    serviceCount: number;
    createdAt: string;
};

export type PackageQuery = {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
};
