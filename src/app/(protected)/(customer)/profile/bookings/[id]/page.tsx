"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/layouts/header/header";
import Footer from "@/components/layouts/footer/footer";
import { bookingService, type CancelBookingResult } from "@/libs/services/booking.service";
import { bookingItineraryService, ItineraryStopDTO } from "@/libs/services/booking-itinerary.service";
import { agencyService } from "@/libs/services/agency.service";
import { trackingService, TrackingTypeStop, TrackingTypeActivity } from "@/libs/services/tracking.service";
import { providerService } from "@/libs/services/provider.service";
import type { BookingStopMedicalResultDTO } from "@/types/provider-staff.type";
import styles from "./page.module.scss";

// ── Types ─────────────────────────────────────────────────────────────────────
type NodeStatus    = "completed" | "current" | "upcoming";
type TransportMode = "car" | "bus" | "boat" | "walk";
type ActivityType  = "meal" | "sightseeing" | "shopping" | "activity" | "transport" | "rest" | "medical";

interface Activity {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    description: string;
    type: ActivityType;
    status: NodeStatus;
    isProviderService?: boolean;
    providerName?: string;
}

interface Transport { mode: TransportMode; duration: string; distance: string; }

interface Stop {
    id: string;
    order: number;
    name: string;
    address: string;
    image: string;
    arrivalTime: string;
    departureTime: string;
    dayLabel: string;
    activities: Activity[];
    status: NodeStatus;
    transportToNext?: Transport;
    hasProvider: boolean;
    providerName: string | null;
}

interface BookingDetail {
    id: string;
    code: string;
    tourName: string;
    tourImage: string;
    agencyName: string;
    startDate: string;
    endDate: string;
    durationDays: number;
    travelers: number;
    totalAmount: number;
    status: "Upcoming" | "In Progress" | "Completed" | "Cancelled";
    guideName: string;
    guidePhone: string;
    stops: Stop[];
}

// ── Data helpers ───────────────────────────────────────────────────────────────
const VEHICLE_TYPE_MAP: Record<string, TransportMode> = {
    Bus: "bus", MiniVan: "car", PrivateCar: "car",
    Motorbike: "car", Bicycle: "walk", Boat: "boat",
    Ferry: "boat", Train: "car", Walking: "walk",
};

function activityStatus(startIso: string, endIso: string): NodeStatus {
    const now   = Date.now();
    const start = new Date(startIso).getTime();
    const end   = new Date(endIso).getTime();
    if (now >= start && now <= end) return "current";
    return "upcoming";
}

function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function fmtDay(iso: string, scheduleStart: string) {
    const d     = new Date(iso);
    const start = new Date(scheduleStart);
    start.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    const dayN  = Math.floor((d.getTime() - start.getTime()) / 86_400_000) + 1;
    return `Day ${dayN} · ${new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`;
}

function mapStops(apiStops: ItineraryStopDTO[], scheduleStart: string, tourImage: string): Stop[] {
    return apiStops.map((s) => {
        const acts = s.activities.map((a): Activity => ({
            id:                a.id,
            name:              a.customName ?? a.serviceName ?? "Activity",
            startTime:         fmtTime(a.startTime),
            endTime:           fmtTime(a.endTime),
            description:       a.serviceDescription ?? a.note ?? "",
            type:              s.providerId && a.serviceId ? "medical" : "activity",
            status:            activityStatus(a.startTime, a.endTime),
            isProviderService: !!(s.providerId && a.serviceId),
            providerName:      s.providerName ?? undefined,
        }));

        const hasCurrent = acts.some(a => a.status === "current");
        const firstAct   = s.activities[0];
        const lastAct    = s.activities[s.activities.length - 1];

        return {
            id:            s.id,
            order:         s.stopOrder,
            name:          s.name,
            address:       s.address ?? "",
            image:         tourImage,
            arrivalTime:   firstAct ? fmtTime(firstAct.startTime) : "",
            departureTime: lastAct  ? fmtTime(lastAct.endTime)    : "",
            dayLabel:      firstAct ? fmtDay(firstAct.startTime, scheduleStart) : "",
            status:        hasCurrent ? "current" : "upcoming",
            activities:    acts,
            hasProvider:   !!s.providerId,
            providerName:  s.providerName,
            transportToNext: s.vehicleType ? {
                mode:     VEHICLE_TYPE_MAP[s.vehicleType] ?? "car",
                duration: "",
                distance: s.vehicleName ?? s.vehicleType,
            } : undefined,
        };
    });
}

function deriveBookingDisplayStatus(
    status: string,
    schedStart: string | null,
    schedEnd: string | null,
): BookingDetail["status"] {
    if (status === "Cancelled") return "Cancelled";
    if (status === "Completed") return "Completed";
    if (schedStart && schedEnd) {
        const now = Date.now();
        const s   = new Date(schedStart).getTime();
        const e   = new Date(schedEnd).getTime();
        if (now >= s && now <= e) return "In Progress";
    }
    return "Upcoming";
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function transportIcon(mode: TransportMode) {
    switch (mode) {
        case "car": return (
            <svg viewBox="0 0 24 24" fill="none" width="17" height="17">
                <path d="M3 11l2-5h14l2 5M3 11v5a1 1 0 001 1h1a1 1 0 001-1v-1h12v1a1 1 0 001 1h1a1 1 0 001-1v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="7.5" cy="11" r="1.5" fill="currentColor"/>
                <circle cx="16.5" cy="11" r="1.5" fill="currentColor"/>
                <path d="M3 11h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
        );
        case "bus": return (
            <svg viewBox="0 0 24 24" fill="none" width="17" height="17">
                <rect x="4" y="3" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M4 9h16M8 18v2M16 18v2M4 14h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="8.5" cy="11.5" r="1" fill="currentColor"/>
                <circle cx="15.5" cy="11.5" r="1" fill="currentColor"/>
            </svg>
        );
        case "boat": return (
            <svg viewBox="0 0 24 24" fill="none" width="17" height="17">
                <path d="M3 18c2.5 1.5 5 1.5 7.5 0s5-1.5 7.5 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M5 14l1.5-7h11L19 14H5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 7V3M9 3h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
        );
        case "walk": return (
            <svg viewBox="0 0 24 24" fill="none" width="17" height="17">
                <circle cx="13" cy="4" r="1.5" fill="currentColor"/>
                <path d="M9 8.5l2 2.5 1 5-2 4.5M14 8.5l1.5 4 2.5 3.5M11 11l3.5 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        );
    }
}

const ACTIVITY_ICON: Record<ActivityType, string> = {
    meal: "🍽️", sightseeing: "🏛️", shopping: "🛍️",
    activity: "⚡", transport: "🚌", rest: "🌅", medical: "🏥",
};

const STATUS_CONFIG = {
    completed: { line: "#16a34a", dot: "#16a34a", label: "Completed", badge: styles.badgeCompleted },
    current:   { line: "#2563eb", dot: "#2563eb", label: "In Progress", badge: styles.badgeCurrent },
    upcoming:  { line: "#d1d5db", dot: "#9ca3af", label: "Upcoming", badge: styles.badgeUpcoming },
};

const BOOKING_STATUS_BADGE: Record<string, string> = {
    "In Progress": styles.bookingBadgeActive,
    "Upcoming":    styles.bookingBadgeUpcoming,
    "Completed":   styles.bookingBadgeDone,
    "Cancelled":   styles.bookingBadgeCancelled,
};


function completedCount(stops: Stop[]) {
    return stops.filter(s => s.status === "completed").length;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BookingJourneyPage() {
    const { id } = useParams<{ id: string }>();

    const [booking, setBooking]   = useState<BookingDetail | null>(null);
    const [loading, setLoading]   = useState(true);
    const [scheduleId, setScheduleId]         = useState<string | null>(null);
    const [trackedStops, setTrackedStops]     = useState<Set<string>>(new Set());
    const [trackedActivities, setTrackedActivities] = useState<Set<string>>(new Set());
    const [stopResult, setStopResult]         = useState<BookingStopMedicalResultDTO | null>(null);
    const [loadingResult, setLoadingResult]   = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [cancelling, setCancelling]               = useState(false);
    const [cancelResult, setCancelResult]           = useState<CancelBookingResult | null>(null);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                // Step 1: Booking + BookingItinerary in parallel
                const [bookingRes, biRes] = await Promise.all([
                    bookingService.getById(id),
                    bookingItineraryService.getByBookingId(id),
                ]);
                const bk = bookingRes.data;
                const bi = biRes.data?.[0];
                if (!bk || !bi) return;

                const itineraryId = bi.itineraryId;
                if (!itineraryId) return;

                // Step 2: Itinerary details + stops + tracking in parallel
                const [itin, stopsRes, trackingRes] = await Promise.all([
                    agencyService.getItineraryById(itineraryId).then(r => r.data),
                    bookingItineraryService.getStopsByItineraryId(itineraryId).then(r => r.data ?? []),
                    trackingService.getByScheduleId(bi.itineraryScheduleId).then(r => r.data ?? []).catch(() => []),
                ]);
                if (!itin) return;

                setScheduleId(bi.itineraryScheduleId);
                setTrackedStops(new Set(trackingRes.filter(t => t.type === TrackingTypeStop).map(t => t.trackingId)));
                setTrackedActivities(new Set(trackingRes.filter(t => t.type === TrackingTypeActivity).map(t => t.trackingId)));

                const tourImage = itin.images?.[0]?.url ?? "/images/landing/explore_1.avif";
                const schedStart = bi.scheduleStartTime ?? new Date().toISOString();
                const fmtDate = (iso: string) =>
                    new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

                setBooking({
                    id:           bk.id,
                    code:         bk.code,
                    tourName:     bi.itineraryName ?? itin.name,
                    tourImage,
                    agencyName:   itin.agencyName ?? "",
                    startDate:    bi.scheduleStartTime ? fmtDate(bi.scheduleStartTime) : "—",
                    endDate:      bi.scheduleEndTime   ? fmtDate(bi.scheduleEndTime)   : "—",
                    durationDays: itin.durationDays,
                    travelers:    bi.numberOfGuests,
                    totalAmount:  bi.finalPrice,
                    status:       deriveBookingDisplayStatus(bk.status, bi.scheduleStartTime, bi.scheduleEndTime),
                    guideName:    bi.guideName  ?? "Not assigned",
                    guidePhone:   bi.guidePhone ?? "",
                    stops:        mapStops(stopsRes, schedStart, tourImage),
                });
            } catch {
                // silently ignore — user sees loading state
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const handleViewStopResult = async (stopId: string) => {
        if (!id) return;
        setLoadingResult(true);
        setStopResult(null);
        try {
            const res = await providerService.getBookingStopResults(id, stopId);
            setStopResult(res.data ?? null);
        } finally {
            setLoadingResult(false);
        }
    };

    const handleCancelBooking = async () => {
        if (!id) return;
        setCancelling(true);
        try {
            const res = await bookingService.cancelWithRefund(id);
            if (res.data) {
                setCancelResult(res.data);
                setBooking(prev => prev ? { ...prev, status: "Cancelled" } : prev);
                setShowCancelConfirm(false);
            }
        } finally {
            setCancelling(false);
        }
    };

    const handleCheckIn = async (stopId: string) => {
        if (!scheduleId) return;
        setTrackedStops(prev => new Set([...prev, stopId]));
        try {
            await trackingService.track({ itineraryScheduleId: scheduleId, trackingId: stopId, type: TrackingTypeStop });
        } catch {
            setTrackedStops(prev => { const s = new Set(prev); s.delete(stopId); return s; });
        }
    };

    if (loading) return (
        <>
            <Header variant="solid" />
            <div className={styles.page}>
                <div className={styles.container} style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
                    <div className={styles.spinner} />
                </div>
            </div>
            <Footer />
        </>
    );

    if (!booking) return (
        <>
            <Header variant="solid" />
            <div className={styles.page}>
                <div className={styles.container} style={{ paddingTop: 80, textAlign: "center" }}>
                    <p>Booking not found.</p>
                    <Link href="/profile">← Back to Profile</Link>
                </div>
            </div>
            <Footer />
        </>
    );

    const effectiveStopStatus = (stop: Stop): NodeStatus => {
        if (trackedStops.has(stop.id)) return "completed";
        if (stop.activities.length > 0 && stop.activities.every(a => trackedActivities.has(a.id))) return "completed";
        return stop.status;
    };

    const effectiveActStatus = (act: Activity): NodeStatus =>
        trackedActivities.has(act.id) ? "completed" : act.status;

    const done  = booking.stops.filter(s => effectiveStopStatus(s) === "completed").length;
    const total = booking.stops.length;
    const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

    return (
        <>
            <Header variant="solid" />
            <div className={styles.page}>
                <div className={styles.container}>

                    {/* Breadcrumb */}
                    <nav className={styles.breadcrumb}>
                        <Link href="/">Home</Link>
                        <span>/</span>
                        <Link href="/profile">My Profile</Link>
                        <span>/</span>
                        <span>Journey Detail</span>
                    </nav>

                    {/* Hero card */}
                    <div className={styles.heroCard}>
                        <div className={styles.heroImage}>
                            <Image src={booking.tourImage} alt={booking.tourName} fill sizes="280px" style={{ objectFit: "cover" }} />
                            <div className={styles.heroImageOverlay} />
                        </div>
                        <div className={styles.heroContent}>
                            <div className={styles.heroTop}>
                                <div>
                                    <span className={`${styles.bookingBadge} ${BOOKING_STATUS_BADGE[booking.status]}`}>
                                        {booking.status}
                                    </span>
                                    <h1 className={styles.heroTitle}>{booking.tourName}</h1>
                                    <p className={styles.heroAgency}>by {booking.agencyName}</p>
                                </div>
                                <div className={styles.heroCode}>
                                    <span className={styles.heroCodeLabel}>Booking code</span>
                                    <span className={styles.heroCodeVal}>{booking.code}</span>
                                </div>
                            </div>

                            <div className={styles.heroMeta}>
                                <div className={styles.heroMetaItem}>
                                    <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                                    {booking.startDate} — {booking.endDate}
                                </div>
                                <div className={styles.heroMetaItem}>
                                    <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.7"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                                    {booking.durationDays} days
                                </div>
                                <div className={styles.heroMetaItem}>
                                    <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                                    {booking.travelers} traveler{booking.travelers > 1 ? "s" : ""}
                                </div>
                            </div>

                            <div className={styles.progressWrap}>
                                <div className={styles.progressHeader}>
                                    <span className={styles.progressLabel}>Journey Progress</span>
                                    <span className={styles.progressFraction}>{done} / {total} stops completed</span>
                                </div>
                                <div className={styles.progressBar}>
                                    <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main layout */}
                    <div className={styles.layout}>

                        {/* ── Timeline ── */}
                        <div className={styles.timeline}>
                            <h2 className={styles.timelineTitle}>
                                <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" fill="currentColor"/>
                                </svg>
                                Itinerary & Activity Tracker
                            </h2>

                            {booking.stops.map((stop, si) => {
                                const effStopStatus = effectiveStopStatus(stop);
                                const cfg = STATUS_CONFIG[effStopStatus];
                                const isLast = si === booking.stops.length - 1;

                                return (
                                    <div key={stop.id} className={styles.stopBlock}>
                                        {/* Transport used to arrive at this stop */}
                                        {si > 0 && stop.transportToNext && (
                                            <div className={styles.transportSegment}>
                                                <div className={styles.transportVLine}>
                                                    <div className={styles.transportVDash} style={{ borderColor: cfg.line }} />
                                                    <div className={styles.transportVehicle} style={{ borderColor: cfg.line, color: cfg.dot }}>
                                                        {transportIcon(stop.transportToNext.mode)}
                                                    </div>
                                                    <div className={styles.transportVDash} style={{ borderColor: cfg.line }} />
                                                </div>
                                                <div className={styles.transportMeta}>
                                                    <span className={styles.transportMetaVal}>{stop.transportToNext.duration}</span>
                                                    <span className={styles.transportMetaDot}>·</span>
                                                    <span className={styles.transportMetaVal}>{stop.transportToNext.distance}</span>
                                                    <span className={styles.transportMetaMode}>by {stop.transportToNext.mode}</span>
                                                </div>
                                            </div>
                                        )}
                                        <div className={styles.stopRow}>
                                            {/* Vertical line column */}
                                            <div className={styles.stopLine}>
                                                <div className={styles.stopConnectorHalf} style={{
                                                    borderColor: si === 0 ? "transparent" : cfg.line,
                                                    borderStyle: (si === 0 || effStopStatus === "upcoming") ? "dashed" : "solid",
                                                }}/>
                                                <div
                                                    className={`${styles.stopDot} ${effStopStatus === "current" ? styles.stopDotPulse : ""}`}
                                                    style={{ borderColor: cfg.dot, background: effStopStatus === "upcoming" ? "#fff" : cfg.dot }}
                                                >
                                                    {effStopStatus === "completed" && (
                                                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                                            <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                        </svg>
                                                    )}
                                                    {effStopStatus === "current" && <div className={styles.stopDotInner} />}
                                                    {effStopStatus === "upcoming" && <div className={styles.stopDotEmpty} style={{ background: cfg.dot }} />}
                                                </div>
                                                <div className={styles.stopConnectorHalf} style={{
                                                    borderColor: isLast ? "transparent" : cfg.line,
                                                    borderStyle: (isLast || effStopStatus === "upcoming") ? "dashed" : "solid",
                                                }}/>
                                            </div>

                                            {/* Stop card */}
                                            <div className={`${styles.stopCard} ${effStopStatus === "current" ? styles.stopCardCurrent : ""} ${effStopStatus === "completed" ? styles.stopCardCompleted : ""}`}>
                                                <div className={styles.stopHeader}>
                                                    <div className={styles.stopPhotoWrap}>
                                                        <Image src={stop.image} alt={stop.name} fill sizes="72px" style={{ objectFit: "cover", borderRadius: "50%" }} />
                                                        {stop.status === "current" && <div className={styles.stopPhotoBadge}>NOW</div>}
                                                    </div>
                                                    <div className={styles.stopInfo}>
                                                        <div className={styles.stopDayLabel}>{stop.dayLabel}</div>
                                                        <h3 className={styles.stopName}>{stop.name}</h3>
                                                        <p className={styles.stopAddress}>
                                                            <svg viewBox="0 0 24 24" fill="none" width="11" height="11">
                                                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" fill="currentColor"/>
                                                            </svg>
                                                            {stop.address}
                                                        </p>
                                                    </div>
                                                    <div className={styles.stopTime}>
                                                        <span>{stop.arrivalTime}</span>
                                                        <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M5 12h14M13 6l6 6-6 6" stroke="#9ca3af" strokeWidth="1.7" strokeLinecap="round"/></svg>
                                                        <span>{stop.departureTime}</span>
                                                    </div>
                                                    {effStopStatus !== "completed" ? (
                                                        <button
                                                            className={styles.checkInBtn}
                                                            onClick={() => handleCheckIn(stop.id)}
                                                        >
                                                            <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                                                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" fill="currentColor"/>
                                                            </svg>
                                                            Check In
                                                        </button>
                                                    ) : (
                                                        <span className={styles.checkedInBadge}>
                                                            <svg viewBox="0 0 24 24" fill="none" width="11" height="11"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                            Checked In
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Activities */}
                                                <div className={styles.activities}>
                                                    {stop.activities.map((act, ai) => {
                                                        const effActSt   = effectiveActStatus(act);
                                                        const actCfg     = STATUS_CONFIG[effActSt];
                                                        const isProvider = act.isProviderService;

                                                        return (
                                                            <div
                                                                key={act.id}
                                                                className={`${styles.activityItem} ${effActSt === "current" ? styles.activityCurrent : ""} ${isProvider ? styles.activityProvider : ""}`}
                                                            >
                                                                <div className={styles.activityDot} style={{ background: actCfg.dot }}>
                                                                    {effActSt === "completed" && (
                                                                        <svg viewBox="0 0 24 24" fill="none" width="9" height="9">
                                                                            <path d="M4 13l4 4L20 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
                                                                        </svg>
                                                                    )}
                                                                </div>
                                                                {ai < stop.activities.length - 1 && (
                                                                    <div className={styles.activityLine} style={{ background: actCfg.line }} />
                                                                )}
                                                                <div className={styles.activityContent}>
                                                                    <div className={styles.activityTop}>
                                                                        <span className={styles.activityEmoji}>{ACTIVITY_ICON[act.type]}</span>
                                                                        <span className={styles.activityName}>{act.name}</span>
                                                                        <span className={styles.activityTime}>{act.startTime} – {act.endTime}</span>
                                                                        {effActSt !== "upcoming" && (
                                                                            <span className={`${styles.activityBadge} ${effActSt === "completed" ? styles.activityBadgeDone : styles.activityBadgeNow}`}>
                                                                                {effActSt === "completed" ? "Done" : "Now"}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className={styles.activityDesc}>{act.description}</p>

                                                                    {isProvider && (
                                                                        <div className={styles.providerRow}>
                                                                            <div className={styles.providerTag}>
                                                                                <svg viewBox="0 0 24 24" fill="none" width="11" height="11">
                                                                                    <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.8"/>
                                                                                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                                                                </svg>
                                                                                {act.providerName}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* ── Stop-level result button ── */}
                                                {stop.hasProvider && (
                                                    <div className={styles.stopResultRow}>
                                                        <button
                                                            className={styles.resultBtnActive}
                                                            onClick={() => handleViewStopResult(stop.id)}
                                                        >
                                                            <span className={styles.resultBtnDot} />
                                                            <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                                                                <path d="M14 2v6h6M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                                            </svg>
                                                            View Health Results
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                    </div>
                                );
                            })}
                        </div>

                        {/* ── Sidebar ── */}
                        <aside className={styles.sidebar}>
                            <div className={styles.summaryCard}>
                                <h3 className={styles.summaryTitle}>Booking Summary</h3>
                                <div className={styles.summaryRow}>
                                    <span>Code</span>
                                    <span className={styles.summaryCode}>{booking.code}</span>
                                </div>
                                <div className={styles.summaryDivider} />
                                <div className={styles.summaryRow}><span>Tour</span><span className={styles.summaryVal}>{booking.tourName}</span></div>
                                <div className={styles.summaryRow}><span>Agency</span><span className={styles.summaryVal}>{booking.agencyName}</span></div>
                                <div className={styles.summaryRow}><span>Dates</span><span className={styles.summaryVal}>{booking.startDate} – {booking.endDate}</span></div>
                                <div className={styles.summaryRow}><span>Duration</span><span className={styles.summaryVal}>{booking.durationDays} days</span></div>
                                <div className={styles.summaryRow}><span>Travelers</span><span className={styles.summaryVal}>{booking.travelers} person{booking.travelers > 1 ? "s" : ""}</span></div>
                                <div className={styles.summaryDivider} />
                                <div className={`${styles.summaryRow} ${styles.summaryTotalRow}`}>
                                    <strong>Total Paid</strong>
                                    <strong className={styles.summaryTotal}>{booking.totalAmount.toLocaleString("vi-VN")}đ</strong>
                                </div>
                            </div>

                            <div className={styles.guideCard}>
                                <div className={styles.guideAvatar}>
                                    <svg viewBox="0 0 24 24" fill="none" width="26" height="26">
                                        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6"/>
                                        <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                                    </svg>
                                </div>
                                <div className={styles.guideInfo}>
                                    <span className={styles.guideLabel}>Your Tour Guide</span>
                                    <strong className={styles.guideName}>{booking.guideName}</strong>
                                    <a href={`tel:${booking.guidePhone}`} className={styles.guidePhone}>{booking.guidePhone}</a>
                                </div>
                            </div>

                            <div className={styles.progressCard}>
                                <div className={styles.progressCardTitle}>Progress Overview</div>
                                <div className={styles.progressCircleWrap}>
                                    <svg viewBox="0 0 80 80" className={styles.progressCircle}>
                                        <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="7"/>
                                        <circle cx="40" cy="40" r="34" fill="none" stroke="#2563eb" strokeWidth="7"
                                            strokeLinecap="round"
                                            strokeDasharray={`${2 * Math.PI * 34}`}
                                            strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
                                            transform="rotate(-90 40 40)"
                                        />
                                    </svg>
                                    <div className={styles.progressCircleLabel}>
                                        <span className={styles.progressCirclePct}>{pct}%</span>
                                        <span className={styles.progressCircleSub}>done</span>
                                    </div>
                                </div>
                                <div className={styles.progressLegend}>
                                    <div className={styles.legendRow}><span className={styles.legendDot} style={{ background: "#16a34a" }}/><span>{booking.stops.filter(s => effectiveStopStatus(s) === "completed").length} Completed</span></div>
                                    <div className={styles.legendRow}><span className={styles.legendDot} style={{ background: "#2563eb" }}/><span>{booking.stops.filter(s => effectiveStopStatus(s) === "current").length} In Progress</span></div>
                                    <div className={styles.legendRow}><span className={styles.legendDot} style={{ background: "#9ca3af" }}/><span>{booking.stops.filter(s => effectiveStopStatus(s) === "upcoming").length} Upcoming</span></div>
                                </div>
                            </div>

                            <Link href="/profile" className={styles.backBtn}>
                                <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                </svg>
                                Back to Profile
                            </Link>

                            {booking.status !== "Cancelled" && booking.status !== "Completed" && (
                                <button
                                    className={styles.cancelBookingBtn}
                                    onClick={() => setShowCancelConfirm(true)}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                                        <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                    </svg>
                                    Cancel Booking
                                </button>
                            )}
                        </aside>
                    </div>
                </div>
            </div>
            <Footer />

            {/* ════════════ STOP RESULT MODAL ════════════ */}
            {(stopResult || loadingResult) && (
                <div className={styles.resultOverlay} onClick={() => { setStopResult(null); }}>
                    <div className={styles.resultModal} onClick={e => e.stopPropagation()}>

                        <div className={styles.resultModalHeader}>
                            <div className={styles.resultModalIcon}>
                                <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                                    <path d="M14 2v6h6M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                </svg>
                            </div>
                            <div className={styles.resultModalTitleWrap}>
                                <h2 className={styles.resultModalTitle}>Health Results</h2>
                                {stopResult && <p className={styles.resultModalActivity}>{stopResult.providerName} · {stopResult.stopName}</p>}
                            </div>
                            <button className={styles.resultModalClose} onClick={() => setStopResult(null)}>
                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                                </svg>
                            </button>
                        </div>

                        {loadingResult ? (
                            <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Đang tải…</div>
                        ) : stopResult && (
                            <div className={styles.resultPassengerList}>
                                {stopResult.passengers.map((p) => (
                                    <div key={p.passengerId} className={styles.resultPassengerCard}>
                                        <div className={styles.resultPassengerHeader}>
                                            <div className={styles.resultPassengerAvatar}>
                                                {p.fullName.trim().split(" ").slice(-1)[0][0].toUpperCase()}
                                            </div>
                                            <div className={styles.resultPassengerInfo}>
                                                <span className={styles.resultPassengerName}>{p.fullName}</span>
                                                <span className={styles.resultPassengerMeta}>{p.age} yrs · ID: {p.idNumber}</span>
                                            </div>
                                            {p.resultSent ? (
                                                <span className={styles.resultSentBadge}>
                                                    <svg viewBox="0 0 24 24" fill="none" width="10" height="10"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                                                    Received
                                                </span>
                                            ) : (
                                                <span className={styles.resultPendingBadge}>Awaiting result</span>
                                            )}
                                        </div>

                                        {p.resultSent && (
                                            <div className={styles.resultPassengerBody}>
                                                {p.notes && (
                                                    <div className={styles.resultNotesBlock}>
                                                        <p className={styles.resultNotesLabel}>
                                                            <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                                            Notes & Diagnosis
                                                        </p>
                                                        <p className={styles.resultNotesText}>{p.notes}</p>
                                                    </div>
                                                )}
                                                {p.imageUrls.length > 0 && (
                                                    <div className={styles.resultImagesBlock}>
                                                        <p className={styles.resultNotesLabel}>
                                                            <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7"/><circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.7"/><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                                                            Medical Records ({p.imageUrls.length})
                                                        </p>
                                                        <div className={styles.resultImagesGrid}>
                                                            {p.imageUrls.map((url, i) => (
                                                                <a key={i} href={url} target="_blank" rel="noreferrer">
                                                                    <img src={url} alt={`result-${i}`} className={styles.resultThumb} />
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {p.sentAt && (
                                                    <p className={styles.resultSentTime}>
                                                        <svg viewBox="0 0 24 24" fill="none" width="11" height="11"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                                        Sent at {new Date(p.sentAt).toLocaleString("en-GB")}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={styles.resultFooter}>
                            <button className={styles.resultCloseBtn} onClick={() => setStopResult(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════ CANCEL CONFIRM MODAL ════════════ */}
            {showCancelConfirm && (
                <div className={styles.resultOverlay} onClick={() => !cancelling && setShowCancelConfirm(false)}>
                    <div className={styles.cancelModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.cancelModalIcon}>
                            <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
                                <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="1.8"/>
                                <path d="M12 8v4m0 4h.01" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <h3 className={styles.cancelModalTitle}>Confirm Cancellation</h3>
                        <p className={styles.cancelModalSub}>
                            Refund policy:
                        </p>
                        <ul className={styles.cancelPolicyList}>
                            <li><span className={styles.policyGreen}>Cancel 7+ days before</span> → 100% refund to wallet</li>
                            <li><span className={styles.policyAmber}>Cancel 2–7 days before</span> → 50% refund to wallet</li>
                            <li><span className={styles.policyRed}>Cancel within 2 days</span> → No refund</li>
                        </ul>
                        <p className={styles.cancelModalNote}>Refund is credited to your wallet instantly.</p>
                        <div className={styles.cancelModalActions}>
                            <button
                                className={styles.cancelModalBack}
                                onClick={() => setShowCancelConfirm(false)}
                                disabled={cancelling}
                            >
                                Go back
                            </button>
                            <button
                                className={styles.cancelModalConfirm}
                                onClick={handleCancelBooking}
                                disabled={cancelling}
                            >
                                {cancelling ? "Processing…" : "Confirm cancellation"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════ CANCEL RESULT MODAL ════════════ */}
            {cancelResult && (
                <div className={styles.resultOverlay} onClick={() => setCancelResult(null)}>
                    <div className={styles.cancelModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.cancelModalIcon}>
                            {cancelResult.refundAmount > 0 ? (
                                <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
                                    <circle cx="12" cy="12" r="10" stroke="#16a34a" strokeWidth="1.8"/>
                                    <path d="M8 12l3 3 5-5" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
                                    <circle cx="12" cy="12" r="10" stroke="#6b7280" strokeWidth="1.8"/>
                                    <path d="M12 8v4m0 4h.01" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round"/>
                                </svg>
                            )}
                        </div>
                        <h3 className={styles.cancelModalTitle}>Booking cancelled</h3>
                        <p className={styles.cancelModalSub}>{cancelResult.message}</p>
                        {cancelResult.refundAmount > 0 && (
                            <div className={styles.cancelRefundBox}>
                                <span className={styles.cancelRefundLabel}>Refunded to wallet</span>
                                <span className={styles.cancelRefundAmount}>
                                    +{cancelResult.refundAmount.toLocaleString("vi-VN")}đ
                                </span>
                            </div>
                        )}
                        <div className={styles.cancelModalActions}>
                            <Link href="/profile" className={styles.cancelModalBack}>
                                Back to home
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
