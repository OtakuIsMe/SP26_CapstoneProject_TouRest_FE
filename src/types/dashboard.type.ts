// ── Agency Dashboard ──────────────────────────────────────────────────────────
export interface AgencyDashboardStats {
    activeTours: number;
    schedulesToday: number;
    monthlyBookings: number;
    monthlyRevenue: number;
    activeToursChangeThisMonth: number;
    schedulesTodayConfirmed: number;
    schedulesTodayPending: number;
    monthlyBookingsChangeVsLastMonth: number;
    monthlyRevenueChangePercent: number;
}

export interface UpcomingSchedule {
    id: string;
    itineraryName: string;
    startTime: string;
    tourGuideName: string | null;
    pax: number;
    status: string;
}

export interface RecentBooking {
    bookingCode: string;
    customerName: string;
    tourName: string;
    bookingDate: string;
    amount: number;
    status: string;
}

export interface GuideWorkload {
    guideId: string;
    guideName: string;
    activeTours: number;
    completedTotal: number;
}

// ── Provider Dashboard ────────────────────────────────────────────────────────
export interface ProviderDashboardStats {
    activeServices: number;
    activeServicesChangeThisMonth: number;
    activePackages: number;
    agenciesSubscribedCount: number;
    pendingRequestsCount: number;
    newPendingRequestsToday: number;
    monthlyRevenue: number;
    revenuePercentageChange: number;
}

export interface MonthlyJobTrend {
    month: string;
    jobsCount: number;
    status: string;
}

export interface ProviderJobsTrend {
    year: number;
    monthlyTrends: MonthlyJobTrend[];
}

export interface ProviderPendingRequest {
    requestId: string;
    agencyName: string;
    agencyShortName: string;
    packageOrServiceName: string;
    pax: number;
    scheduledTime: string;
    isUrgent: boolean;
}

export interface ProviderActivePackage {
    packageId: string;
    name: string;
    servicesCount: number;
    agenciesCount: number;
    revenue: number;
    demandPercent: number;
}

export interface ProviderTopAgency {
    agencyId: string;
    name: string;
    jobsThisMonth: number;
    revenueThisMonth: number;
}

// ── Admin Dashboard ───────────────────────────────────────────────────────────
export interface AdminDashboardStats {
    registeredAgencies: number;
    newAgenciesThisMonth: number;
    registeredProviders: number;
    newProvidersThisMonth: number;
    platformBookings: number;
    newBookingsThisMonth: number;
    platformRevenue: number;
    revenuePercentageChange: number;
    pendingReviewsCount: number;
}

export interface MonthlyTrend {
    month: string;
    bookingsCount: number;
    revenue: number;
}

export interface AdminTrend {
    year: number;
    totalBookingsYtd: number;
    monthlyTrends: MonthlyTrend[];
}

export interface PendingApproval {
    requestId: string;
    name: string;
    shortName: string;
    type: string;
    submittedAt: string;
}

export interface TopAgency {
    agencyId: string;
    agencyName: string;
    toursCount: number;
    bookingsCount: number;
    totalRevenue: number;
    status: string;
}
