export interface ProviderEarningBreakdown {
    providerId: string;
    providerName: string;
    total: number;
    payout: number; // total * 0.8
}

export interface ScheduleEarningDTO {
    scheduleId: string;
    itineraryName: string;
    agencyName: string;
    startTime: string;
    endTime: string;
    totalBookingAmount: number;
    agencyTotal: number;
    agencyPayout: number;       // agencyTotal * 0.8
    providerTotal: number;
    providerPayout: number;     // providerTotal * 0.8
    adminFee: number;           // totalBookingAmount * 0.2
    providers: ProviderEarningBreakdown[];
    released: boolean;
    releasedAt: string | null;
}
