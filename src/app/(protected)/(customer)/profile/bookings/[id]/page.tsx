"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/layouts/header/header";
import Footer from "@/components/layouts/footer/footer";
import styles from "./page.module.scss";

// ── Types ─────────────────────────────────────────────────────────────────────
type NodeStatus    = "completed" | "current" | "upcoming";
type TransportMode = "car" | "bus" | "boat" | "walk";
type ActivityType  = "meal" | "sightseeing" | "shopping" | "activity" | "transport" | "rest" | "medical";
type ResultStatus  = "normal" | "warning" | "critical";

interface ResultItem {
    name: string;
    value: string;
    unit?: string;
    range?: string;
    status: ResultStatus;
}

interface MedicalResult {
    providerName: string;
    doctorName: string;
    specialty: string;
    date: string;
    summary: string;
    items: ResultItem[];
    notes?: string;
    followUp?: string;
}

interface Activity {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    description: string;
    type: ActivityType;
    status: NodeStatus;
    // Provider fields
    isProviderService?: boolean;
    providerName?: string;
    resultAvailable?: boolean;
    result?: MedicalResult;
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

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_BOOKINGS: Record<string, BookingDetail> = {
    "bk1": {
        id: "bk1",
        code: "BK-20240415-A3F7",
        tourName: "Ha Long Bay Medical & Wellness — 3D2N",
        tourImage: "/images/landing/explore_1.avif",
        agencyName: "Vietnam Medical Adventures Co.",
        startDate: "Apr 15, 2024",
        endDate: "Apr 18, 2024",
        durationDays: 3,
        travelers: 2,
        totalAmount: 8_500_000,
        status: "In Progress",
        guideName: "Nguyen Thi Hoa",
        guidePhone: "+84 912 345 678",
        stops: [
            {
                id: "s1", order: 1,
                name: "Hanoi — Medical Center",
                address: "52 Ly Thuong Kiet, Hoan Kiem, Hanoi",
                image: "/images/landing/explore_3.avif",
                arrivalTime: "07:00", departureTime: "10:30",
                dayLabel: "Day 1 · Apr 15",
                status: "completed",
                activities: [
                    {
                        id: "a1", name: "Group assembly & check-in",
                        startTime: "07:00", endTime: "07:30",
                        description: "Meet your guide and fellow travelers at the hotel lobby",
                        type: "activity", status: "completed",
                    },
                    {
                        id: "a2", name: "Breakfast (bánh mì & phở)",
                        startTime: "07:30", endTime: "08:30",
                        description: "Traditional Vietnamese breakfast at local café",
                        type: "meal", status: "completed",
                    },
                    {
                        id: "a3", name: "General Health Screening",
                        startTime: "08:30", endTime: "10:00",
                        description: "Full body check-up including blood pressure, BMI, and basic blood panel at Hanoi International Clinic",
                        type: "medical", status: "completed",
                        isProviderService: true,
                        providerName: "Hanoi International Clinic",
                        resultAvailable: true,
                        result: {
                            providerName: "Hanoi International Clinic",
                            doctorName: "Dr. Nguyen Thi Mai",
                            specialty: "General Medicine",
                            date: "Apr 15, 2024 · 08:45",
                            summary: "Overall health status is good. Blood pressure slightly elevated — recommend monitoring. All other markers within normal range.",
                            items: [
                                { name: "Blood Pressure",  value: "128/84",  unit: "mmHg", range: "< 120/80",    status: "warning"  },
                                { name: "Heart Rate",      value: "72",      unit: "bpm",  range: "60 – 100",     status: "normal"   },
                                { name: "BMI",             value: "23.4",    unit: "",     range: "18.5 – 24.9",  status: "normal"   },
                                { name: "Blood Glucose",   value: "95",      unit: "mg/dL",range: "70 – 99",      status: "normal"   },
                                { name: "Cholesterol",     value: "198",     unit: "mg/dL",range: "< 200",        status: "normal"   },
                                { name: "SpO₂",            value: "98",      unit: "%",    range: "95 – 100",     status: "normal"   },
                            ],
                            notes: "Patient is generally healthy. Slight hypertension noted — advised to reduce sodium intake and manage stress levels.",
                            followUp: "Schedule blood pressure re-check in 4 weeks.",
                        },
                    },
                ],
                transportToNext: { mode: "bus", duration: "3h 30min", distance: "160 km" },
            },
            {
                id: "s2", order: 2,
                name: "Ha Long Bay Pier",
                address: "Bai Chay Tourist Wharf, Quang Ninh",
                image: "/images/landing/explore_2.avif",
                arrivalTime: "12:00", departureTime: "13:30",
                dayLabel: "Day 1 · Apr 15",
                status: "completed",
                activities: [
                    {
                        id: "a4", name: "Board cruise & cabin check-in",
                        startTime: "12:00", endTime: "12:30",
                        description: "Welcome drink and settle into your private cabin",
                        type: "activity", status: "completed",
                    },
                    {
                        id: "a5", name: "Welcome lunch on deck",
                        startTime: "12:30", endTime: "13:30",
                        description: "Fresh seafood buffet with panoramic bay views",
                        type: "meal", status: "completed",
                    },
                ],
                transportToNext: { mode: "boat", duration: "1h 15min", distance: "22 km" },
            },
            {
                id: "s3", order: 3,
                name: "Sung Sot Cave & Wellness Spa",
                address: "Bo Hon Island, Ha Long Bay",
                image: "/images/landing/explore_1.avif",
                arrivalTime: "14:45", departureTime: "17:00",
                dayLabel: "Day 1 · Apr 15",
                status: "current",
                activities: [
                    {
                        id: "a6", name: "Guided cave exploration",
                        startTime: "14:45", endTime: "16:00",
                        description: "Walk through 1.5 km of spectacular limestone formations with a local geologist guide",
                        type: "sightseeing", status: "completed",
                    },
                    {
                        id: "a7", name: "Dental Consultation",
                        startTime: "15:30", endTime: "16:00",
                        description: "On-site dental check-up with specialist from Ha Long Bay Dental Clinic",
                        type: "medical", status: "current",
                        isProviderService: true,
                        providerName: "Ha Long Bay Dental Clinic",
                        resultAvailable: false,
                    },
                    {
                        id: "a8", name: "Photography at cave exit",
                        startTime: "16:00", endTime: "16:30",
                        description: "Panoramic view of Ha Long Bay — perfect for photos",
                        type: "activity", status: "current",
                    },
                    {
                        id: "a9", name: "Free exploration",
                        startTime: "16:30", endTime: "17:00",
                        description: "Browse the local souvenir stands and explore at your own pace",
                        type: "shopping", status: "upcoming",
                    },
                ],
                transportToNext: { mode: "boat", duration: "45 min", distance: "8 km" },
            },
            {
                id: "s4", order: 4,
                name: "Luon Cave Anchorage",
                address: "Luon Cave, Ha Long Bay",
                image: "/images/landing/explore_2.avif",
                arrivalTime: "17:45", departureTime: "06:30",
                dayLabel: "Day 1–2 · Overnight",
                status: "upcoming",
                activities: [
                    {
                        id: "a10", name: "Lab Results Review",
                        startTime: "18:00", endTime: "18:30",
                        description: "Review blood panel results with on-board medical officer",
                        type: "medical", status: "upcoming",
                        isProviderService: true,
                        providerName: "MedSea On-Board Clinic",
                        resultAvailable: false,
                    },
                    {
                        id: "a11", name: "Kayaking in Luon Lagoon",
                        startTime: "18:30", endTime: "19:30",
                        description: "Paddle through the emerald waters and mangrove arch",
                        type: "activity", status: "upcoming",
                    },
                    {
                        id: "a12", name: "Captain's seafood dinner",
                        startTime: "20:00", endTime: "22:00",
                        description: "Live music, local spirits, and a full seafood spread",
                        type: "meal", status: "upcoming",
                    },
                ],
                transportToNext: { mode: "boat", duration: "30 min", distance: "5 km" },
            },
            {
                id: "s5", order: 5,
                name: "Ti Top Island — Wellness",
                address: "Ti Top Island, Ha Long Bay",
                image: "/images/landing/explore_3.avif",
                arrivalTime: "07:00", departureTime: "09:30",
                dayLabel: "Day 2 · Apr 16",
                status: "upcoming",
                activities: [
                    {
                        id: "a13", name: "Sunrise yoga on deck",
                        startTime: "06:30", endTime: "07:30",
                        description: "Morning yoga led by our wellness instructor",
                        type: "activity", status: "upcoming",
                    },
                    {
                        id: "a14", name: "Spa & Massage Session",
                        startTime: "07:30", endTime: "09:00",
                        description: "60-min deep tissue massage at Ti Top Island Spa, by certified therapists",
                        type: "medical", status: "upcoming",
                        isProviderService: true,
                        providerName: "Ti Top Island Spa",
                        resultAvailable: false,
                    },
                ],
                transportToNext: { mode: "bus", duration: "3h 30min", distance: "165 km" },
            },
            {
                id: "s6", order: 6,
                name: "Return to Hanoi",
                address: "52 Ly Thuong Kiet, Hoan Kiem, Hanoi",
                image: "/images/landing/explore_1.avif",
                arrivalTime: "14:00", departureTime: "14:00",
                dayLabel: "Day 3 · Apr 18",
                status: "upcoming",
                activities: [
                    {
                        id: "a15", name: "Hotel drop-off & farewell",
                        startTime: "14:00", endTime: "14:30",
                        description: "Safe return to your Hanoi hotel — journey complete!",
                        type: "transport", status: "upcoming",
                    },
                ],
            },
        ],
    },
};

const DEFAULT_BOOKING = MOCK_BOOKINGS["bk1"];

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

const RESULT_STATUS: Record<ResultStatus, { color: string; bg: string; label: string }> = {
    normal:   { color: "#15803d", bg: "#dcfce7", label: "Normal"   },
    warning:  { color: "#b45309", bg: "#fef3c7", label: "Warning"  },
    critical: { color: "#b91c1c", bg: "#fee2e2", label: "Critical" },
};

function completedCount(stops: Stop[]) {
    return stops.filter(s => s.status === "completed").length;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BookingJourneyPage() {
    const { id } = useParams<{ id: string }>();
    const booking = MOCK_BOOKINGS[id] ?? DEFAULT_BOOKING;
    const done    = completedCount(booking.stops);
    const total   = booking.stops.length;
    const pct     = Math.round((done / total) * 100);

    const [resultActivity, setResultActivity] = useState<Activity | null>(null);

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
                                const cfg = STATUS_CONFIG[stop.status];
                                const isLast = si === booking.stops.length - 1;

                                return (
                                    <div key={stop.id} className={styles.stopBlock}>
                                        <div className={styles.stopRow}>
                                            {/* Vertical line column */}
                                            <div className={styles.stopLine}>
                                                <div className={styles.stopConnectorHalf} style={{
                                                    borderColor: si === 0 ? "transparent" : cfg.line,
                                                    borderStyle: (si === 0 || stop.status === "upcoming") ? "dashed" : "solid",
                                                }}/>
                                                <div
                                                    className={`${styles.stopDot} ${stop.status === "current" ? styles.stopDotPulse : ""}`}
                                                    style={{ borderColor: cfg.dot, background: stop.status === "upcoming" ? "#fff" : cfg.dot }}
                                                >
                                                    {stop.status === "completed" && (
                                                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                                            <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                        </svg>
                                                    )}
                                                    {stop.status === "current" && <div className={styles.stopDotInner} />}
                                                    {stop.status === "upcoming" && <div className={styles.stopDotEmpty} style={{ background: cfg.dot }} />}
                                                </div>
                                                <div className={styles.stopConnectorHalf} style={{
                                                    borderColor: isLast ? "transparent" : cfg.line,
                                                    borderStyle: (isLast || stop.status === "upcoming") ? "dashed" : "solid",
                                                }}/>
                                            </div>

                                            {/* Stop card */}
                                            <div className={`${styles.stopCard} ${stop.status === "current" ? styles.stopCardCurrent : ""}`}>
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
                                                </div>

                                                {/* Activities */}
                                                <div className={styles.activities}>
                                                    {stop.activities.map((act, ai) => {
                                                        const actCfg = STATUS_CONFIG[act.status];
                                                        const isProvider = act.isProviderService;
                                                        const hasResult  = act.resultAvailable && act.result;

                                                        return (
                                                            <div
                                                                key={act.id}
                                                                className={`${styles.activityItem} ${act.status === "current" ? styles.activityCurrent : ""} ${isProvider ? styles.activityProvider : ""}`}
                                                            >
                                                                <div className={styles.activityDot} style={{ background: actCfg.dot }}>
                                                                    {act.status === "completed" && (
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
                                                                        {act.status !== "upcoming" && (
                                                                            <span className={`${styles.activityBadge} ${act.status === "completed" ? styles.activityBadgeDone : styles.activityBadgeNow}`}>
                                                                                {act.status === "completed" ? "Done" : "Now"}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className={styles.activityDesc}>{act.description}</p>

                                                                    {/* Provider service row */}
                                                                    {isProvider && (
                                                                        <div className={styles.providerRow}>
                                                                            <div className={styles.providerTag}>
                                                                                <svg viewBox="0 0 24 24" fill="none" width="11" height="11">
                                                                                    <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.8"/>
                                                                                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                                                                </svg>
                                                                                {act.providerName}
                                                                            </div>

                                                                            {hasResult ? (
                                                                                /* ── Result AVAILABLE — glowing button ── */
                                                                                <button
                                                                                    className={styles.resultBtnActive}
                                                                                    onClick={() => setResultActivity(act)}
                                                                                >
                                                                                    <span className={styles.resultBtnDot} />
                                                                                    <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                                                                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                                                                                        <path d="M14 2v6h6M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                                                                    </svg>
                                                                                    View Result
                                                                                </button>
                                                                            ) : (
                                                                                /* ── Result PENDING — dimmed button ── */
                                                                                <button className={styles.resultBtnPending} disabled>
                                                                                    <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                                                                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                                                                                        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                                                                    </svg>
                                                                                    Awaiting result
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Transport segment */}
                                        {stop.transportToNext && (
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
                                    <div className={styles.legendRow}><span className={styles.legendDot} style={{ background: "#16a34a" }}/><span>{booking.stops.filter(s => s.status === "completed").length} Completed</span></div>
                                    <div className={styles.legendRow}><span className={styles.legendDot} style={{ background: "#2563eb" }}/><span>{booking.stops.filter(s => s.status === "current").length} In Progress</span></div>
                                    <div className={styles.legendRow}><span className={styles.legendDot} style={{ background: "#9ca3af" }}/><span>{booking.stops.filter(s => s.status === "upcoming").length} Upcoming</span></div>
                                </div>
                            </div>

                            <Link href="/profile" className={styles.backBtn}>
                                <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                </svg>
                                Back to Profile
                            </Link>
                        </aside>
                    </div>
                </div>
            </div>
            <Footer />

            {/* ════════════ RESULT MODAL ════════════ */}
            {resultActivity?.result && (
                <div className={styles.resultOverlay} onClick={() => setResultActivity(null)}>
                    <div className={styles.resultModal} onClick={e => e.stopPropagation()}>

                        {/* Modal header */}
                        <div className={styles.resultModalHeader}>
                            <div className={styles.resultModalIcon}>
                                <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                                    <path d="M14 2v6h6M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                </svg>
                            </div>
                            <div className={styles.resultModalTitleWrap}>
                                <h2 className={styles.resultModalTitle}>Medical Result</h2>
                                <p className={styles.resultModalActivity}>{resultActivity.name}</p>
                            </div>
                            <button className={styles.resultModalClose} onClick={() => setResultActivity(null)}>
                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                                </svg>
                            </button>
                        </div>

                        {/* Provider info */}
                        <div className={styles.resultProviderBar}>
                            <div className={styles.resultProviderItem}>
                                <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M3 21V7l9-4 9 4v14" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
                                {resultActivity.result.providerName}
                            </div>
                            <div className={styles.resultProviderItem}>
                                <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                {resultActivity.result.doctorName} · {resultActivity.result.specialty}
                            </div>
                            <div className={styles.resultProviderItem}>
                                <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                {resultActivity.result.date}
                            </div>
                        </div>

                        {/* Summary */}
                        <div className={styles.resultSummary}>
                            <svg viewBox="0 0 24 24" fill="none" width="14" height="14" style={{ flexShrink: 0, color: "#3b82f6" }}>
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                                <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                            </svg>
                            <p>{resultActivity.result.summary}</p>
                        </div>

                        {/* Result items */}
                        <div className={styles.resultItems}>
                            <p className={styles.resultItemsTitle}>Measurements & Values</p>
                            <div className={styles.resultItemsGrid}>
                                {resultActivity.result.items.map((item, i) => {
                                    const cfg = RESULT_STATUS[item.status];
                                    return (
                                        <div key={i} className={styles.resultItem} style={{ borderColor: cfg.color + "30" }}>
                                            <div className={styles.resultItemTop}>
                                                <span className={styles.resultItemName}>{item.name}</span>
                                                <span className={styles.resultItemBadge} style={{ background: cfg.bg, color: cfg.color }}>
                                                    {cfg.label}
                                                </span>
                                            </div>
                                            <div className={styles.resultItemValue}>
                                                {item.value}
                                                {item.unit && <span className={styles.resultItemUnit}> {item.unit}</span>}
                                            </div>
                                            {item.range && (
                                                <div className={styles.resultItemRange}>Ref: {item.range}</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Doctor notes */}
                        {resultActivity.result.notes && (
                            <div className={styles.resultNotes}>
                                <p className={styles.resultNotesTitle}>
                                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                    Doctor&apos;s Notes
                                </p>
                                <p className={styles.resultNotesText}>{resultActivity.result.notes}</p>
                            </div>
                        )}

                        {/* Follow-up */}
                        {resultActivity.result.followUp && (
                            <div className={styles.resultFollowUp}>
                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                <span>Follow-up: {resultActivity.result.followUp}</span>
                            </div>
                        )}

                        {/* Footer */}
                        <div className={styles.resultFooter}>
                            <button className={styles.resultDownloadBtn}>
                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                Download PDF
                            </button>
                            <button className={styles.resultCloseBtn} onClick={() => setResultActivity(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
