export type ItineraryStatus = "Draft" | "Active" | "Inactive";

export interface ItineraryImageDTO {
    id: string;
    url: string;
    type: string;
    typeId: string;
    picNumber: number;
}

export interface ItineraryScheduleDTO {
    id: string;
    itineraryId: string;
    startTime: string;
    endTime: string;
    spot: number;
    spotLeft: number;
    guideId?: string;
    guideName?: string;
}

export interface AgencyScheduleDTO {
    id: string;
    itineraryId: string;
    itineraryName: string;
    startTime: string;
    endTime: string;
    spot: number;
    spotLeft: number;
    guideId?: string;
    guideName?: string;
    status: string;
}

export interface ProviderScheduleDTO {
    id: string;
    itineraryId: string;
    itineraryName: string;
    agencyName: string;
    startTime: string;
    endTime: string;
    spot: number;
    spotLeft: number;
    guideId?: string;
    guideName?: string;
    firstActivityTime?: string | null;
}

export interface ItineraryDTO {
    id: string;
    agencyId: string;
    agencyName?: string;
    name: string;
    description?: string;
    price: number;
    durationDays: number;
    status: ItineraryStatus;
    stopCount: number;
    images: ItineraryImageDTO[];
    schedules: ItineraryScheduleDTO[];
}

export interface ItineraryStopDTO {
    id: string;
    stopOrder: number;
    name: string;
    longitude: number;
    latitude: number;
    address?: string;
    providerId?: string;
}

export interface StopActivityDTO {
    id: string;
    serviceId?: string;
    serviceName?: string;
    customName?: string;
    serviceDescription?: string;
    activityOrder: number;
    startTime: string;
    endTime: string;
    price: number;
    note?: string;
}

export interface ItineraryProviderDTO {
    id: string;
    name: string;
    description: string;
    address: string;
    contactPhone: string;
    services: string[];
    images: string[];
}

export interface ItineraryStopWithActivitiesDTO {
    id: string;
    stopOrder: number;
    name: string;
    address?: string;
    latitude: number;
    longitude: number;
    providerId?: string;
    vehicleId?: string;
    vehicleName?: string;
    activities: StopActivityDTO[];
}
