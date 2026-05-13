export type VehicleType =
    | "Bus"
    | "MiniVan"
    | "PrivateCar"
    | "Motorbike"
    | "Bicycle"
    | "Boat"
    | "Ferry"
    | "Train"
    | "Walking";

export interface VehicleDTO {
    id: string;
    name: string;
    description?: string;
    capacity: number;
    type: VehicleType;
    agencyId: string;
}

export interface VehicleCreateRequest {
    name: string;
    description?: string;
    capacity: number;
    type: number;
}

export interface VehicleUpdateRequest {
    name: string;
    description?: string;
    capacity: number;
    type: number;
}

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
    Bus:        "Xe buýt",
    MiniVan:    "Xe Van",
    PrivateCar: "Xe riêng",
    Motorbike:  "Xe máy",
    Bicycle:    "Xe đạp",
    Boat:       "Thuyền",
    Ferry:      "Phà",
    Train:      "Tàu hỏa",
    Walking:    "Đi bộ",
};

export const VEHICLE_TYPE_OPTIONS = (Object.keys(VEHICLE_TYPE_LABELS) as VehicleType[]).map(
    (key, index) => ({ label: VEHICLE_TYPE_LABELS[key], value: index, key })
);
