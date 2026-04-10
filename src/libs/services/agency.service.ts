import { AgencyDTO } from "@/types/agency.type";
import axiosClient from "../http/axios-client";

export type RegisterAgencyPayload = {
    name: string;
    description?: string;
    contactEmail: string;
    contactPhone: string;
    latitude?: number;
    longitude?: number;
    images?: string[];
};

export const agencyService = {
    register: (payload: RegisterAgencyPayload): Promise<ApiResponse<AgencyDTO>> =>
        axiosClient.post("/agencies", payload),
};
