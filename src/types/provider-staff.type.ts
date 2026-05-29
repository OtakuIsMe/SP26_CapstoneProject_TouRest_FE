export interface ProviderTourGroupDTO {
    scheduleId: string;
    agencyName: string;
    tourName: string;
    tourDescription: string | null;
    startTime: string;
    endTime: string;
    status: "Confirmed" | "Ongoing" | "Completed";
    totalPatients: number;
    sentCount: number;
}

export interface ProviderPatientDTO {
    bookingItineraryId: string;
    bookingId: string;
    bookingCode: string;
    fullName: string | null;
    phone: string | null;
    dateOfBirth: string | null;
    numberOfGuests: number;
    resultSent: boolean;
    sentAt: string | null;
}

export interface ProviderPassengerDTO {
    passengerId: string;
    bookingId: string;
    bookingCode: string;
    fullName: string;
    idNumber: string;
    phone: string;
    age: number;
    resultSent: boolean;
    sentAt: string | null;
}

export interface PassengerMedicalResultDTO {
    passengerId: string;
    fullName: string;
    age: number;
    idNumber: string;
    resultSent: boolean;
    sentAt: string | null;
    notes: string | null;
    imageUrls: string[];
}

export interface BookingStopMedicalResultDTO {
    providerName: string;
    stopName: string;
    passengers: PassengerMedicalResultDTO[];
}
