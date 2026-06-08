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
    Bus:        "Bus",
    MiniVan:    "Minivan",
    PrivateCar: "Private Car",
    Motorbike:  "Motorbike",
    Bicycle:    "Bicycle",
    Boat:       "Boat",
    Ferry:      "Ferry",
    Train:      "Train",
    Walking:    "Walking",
};

export const VEHICLE_TYPE_OPTIONS = (Object.keys(VEHICLE_TYPE_LABELS) as VehicleType[]).map(
    (key, index) => ({ label: VEHICLE_TYPE_LABELS[key], value: index, key })
);
