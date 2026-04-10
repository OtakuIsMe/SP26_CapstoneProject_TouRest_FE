export type ServiceDTO = {
    id: string;
    name: string;
    description?: string;
    price: number;
    basePrice: number;
    durationMinutes: number;
    status: string;
    createdAt: string;
};

export type ServiceQuery = {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
};
