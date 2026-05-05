export type AgencyDTO = {
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
    createdAt: string;
    updatedAt: string | null;
};

export type AgencyDetailDTO = AgencyDTO & {
    images: string[];
};
