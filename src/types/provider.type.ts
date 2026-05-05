export type ProviderDTO = {
    id: string;
    name: string;
    status: string;
    description: string;
    latitude: number;
    longitude: number;
    address: string;
    startTime: string;
    endTime: string;
    contactEmail: string;
    contactPhone: string;
    createByUserId: string;
    createdAt: string;
    updatedAt: string | null;
};

export type ProviderDetailDTO = ProviderDTO & {
    images: string[];
};
