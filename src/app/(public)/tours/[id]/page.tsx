"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layouts/header/header";
import Footer from "@/components/layouts/footer/footer";
import styles from "./page.module.scss";

// ── mock data ──────────────────────────────────────────────────────────────
const tour = {
    title: "Santorini Tour: Unforgettable Journey",
    meta: {
        days: 3,
        nights: 4,
        country: "Greece",
        city: "Santorini",
        date: "16.04.2023",
        tags: ["Culture", "Island", "Beach"],
    },
    gallery: [
        "/images/landing/explore_1.avif",
        "/images/landing/explore_2.webp",
        "/images/landing/explore_3.jpg",
        "/images/landing/explore_4.avif",
        "/images/landing/banner.jpg",
    ],
    description: `Santorini is one of the most beautiful islands in the world, famous for its dramatic volcanic landscape, white-washed buildings with blue-domed churches, and stunning sunsets over the Aegean Sea.

This tour takes you through the most iconic spots of the island, from the charming village of Oia with its narrow cobblestone streets to the ancient ruins of Akrotiri, a Minoan Bronze Age settlement preserved under volcanic ash.

You will sail around the caldera, swim in the hot springs, explore the black sand beaches of Perissa and Kamari, and indulge in local Greek cuisine paired with the island's renowned wines.`,
    included: [
        { icon: "✓", label: "Airport transfers (round-trip)" },
        { icon: "✓", label: "4-night accommodation in boutique hotel" },
        { icon: "✓", label: "Daily breakfast included" },
        { icon: "✓", label: "Expert English-speaking tour guide" },
        { icon: "✓", label: "Caldera boat cruise with snorkeling" },
        { icon: "✓", label: "Wine tasting at local vineyard" },
        { icon: "✗", label: "International flights" },
        { icon: "✗", label: "Travel insurance" },
        { icon: "✗", label: "Personal expenses" },
    ],
    itinerary: [
        {
            day: 1,
            title: "Arrival & Oia Sunset",
            desc: "Arrive at Santorini Airport, transfer to hotel. Evening walk through Oia and watch the famous sunset.",
        },
        {
            day: 2,
            title: "Caldera Cruise & Hot Springs",
            desc: "Full-day boat cruise around the volcanic caldera. Visit the active volcano, swim in hot springs, and explore Thirassia island.",
        },
        {
            day: 3,
            title: "Akrotiri & Black Sand Beaches",
            desc: "Morning visit to the archaeological site of Akrotiri. Afternoon at Perissa black sand beach.",
        },
        {
            day: 4,
            title: "Fira & Wine Tasting",
            desc: "Explore the capital Fira, visit local museums and enjoy a wine tasting session at a renowned Santorinian winery.",
        },
    ],
    places: [
        {
            name: "The Castle of St. Nicholas",
            type: "Landmark",
            rating: 4.8,
            image: "/images/landing/explore_1.avif",
        },
        {
            name: "Hiking Trail Fira – Oia",
            type: "Outdoor Activity",
            rating: 4.9,
            image: "/images/landing/explore_2.webp",
        },
        {
            name: "Santorini Sailing",
            type: "Water Activity",
            rating: 4.7,
            image: "/images/landing/explore_3.jpg",
        },
    ],
};

const booking = {
    name: "Santorini – Group Tour (Guided)",
    rating: 4.69,
    reviews: 179,
    checkIn: "16.04.2023",
    checkOut: "20.04.2023",
    nights: 4,
    days: 3,
    price: 950,
    originalPrice: 1100,
    tripCode: "G3S1P8",
    features: [
        { icon: "👤", label: "Tour Guides" },
        { icon: "⭐", label: "Basic Level Service" },
        { icon: "👥", label: "Small Group" },
        { icon: "🥾", label: "Light Physical Rating" },
    ],
};

const tabs = ["Overview", "What's Included", "Tour Details", "Schedule", "Customization"] as const;
type Tab = (typeof tabs)[number];

// ── Schedule mock data ─────────────────────────────────────────────────────
type RunStatus = "available" | "almostFull" | "full" | "completed";

interface TourRun {
    id: string;
    startDate: string; // "YYYY-MM-DD"
    endDate:   string;
    price:     number;
    originalPrice?: number;
    slots:     number;
    booked:    number;
    status:    RunStatus;
    guide:     string;
}

const TOUR_RUNS: TourRun[] = [
    { id:"r1", startDate:"2026-04-01", endDate:"2026-04-04", price:950,  originalPrice:1100, slots:20, booked:20, status:"full",      guide:"Alex Papadopoulos" },
    { id:"r2", startDate:"2026-04-10", endDate:"2026-04-13", price:950,  originalPrice:1100, slots:20, booked:18, status:"almostFull", guide:"Maria Konstantinou" },
    { id:"r3", startDate:"2026-04-20", endDate:"2026-04-23", price:950,                      slots:20, booked:9,  status:"available",  guide:"Nikos Stavros"      },
    { id:"r4", startDate:"2026-05-05", endDate:"2026-05-08", price:880,                      slots:20, booked:4,  status:"available",  guide:"Elena Georgiou"     },
    { id:"r5", startDate:"2026-05-18", endDate:"2026-05-21", price:880,                      slots:20, booked:0,  status:"available",  guide:"Alex Papadopoulos" },
    { id:"r6", startDate:"2026-06-02", endDate:"2026-06-05", price:1050,                     slots:20, booked:0,  status:"available",  guide:"Maria Konstantinou" },
    { id:"r7", startDate:"2026-06-15", endDate:"2026-06-18", price:1050,                     slots:20, booked:12, status:"available",  guide:"Nikos Stavros"      },
];

const RUN_STATUS_CFG: Record<RunStatus, { label: string; color: string; bg: string }> = {
    available:  { label: "Available",    color: "#065f46", bg: "#d1fae5" },
    almostFull: { label: "Almost Full",  color: "#92400e", bg: "#fef3c7" },
    full:       { label: "Full",         color: "#991b1b", bg: "#fee2e2" },
    completed:  { label: "Completed",    color: "#374151", bg: "#f3f4f6" },
};

function parseRunDate(s: string) { return new Date(s + "T00:00:00"); }
function fmtDate(s: string) {
    const d = parseRunDate(s);
    return d.toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
}
const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WDAYS_SHORT = ["Su","Mo","Tu","We","Th","Fr","Sa"];

const placeSidebar = [
    "Top Attractions",
    "Local Restaurants",
    "Hotels",
    "Expeditions",
    "Trekking Routes",
];
// ──────────────────────────────────────────────────────────────────────────

export default function TourDetailPage() {
    const params = useParams();
    const [activeTab, setActiveTab] = useState<Tab>("Overview");
    const [expanded, setExpanded] = useState(false);
    const [activePlaceCat, setActivePlaceCat] = useState("Top Attractions");
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryIndex, setGalleryIndex] = useState(0);

    // Schedule tab state
    const today = new Date();
    const [schedYear,  setSchedYear]  = useState(today.getFullYear());
    const [schedMonth, setSchedMonth] = useState(today.getMonth());
    const [selectedRun, setSelectedRun] = useState<TourRun | null>(null);

    function schedPrev() {
        if (schedMonth === 0) { setSchedYear(y => y - 1); setSchedMonth(11); }
        else setSchedMonth(m => m - 1);
    }
    function schedNext() {
        if (schedMonth === 11) { setSchedYear(y => y + 1); setSchedMonth(0); }
        else setSchedMonth(m => m + 1);
    }

    // Build calendar cells for schedule month
    const schedCells = (() => {
        const firstDay = new Date(schedYear, schedMonth, 1).getDay();
        const daysInMo = new Date(schedYear, schedMonth + 1, 0).getDate();
        const prevDays = new Date(schedYear, schedMonth, 0).getDate();
        const arr: { day: number; thisMonth: boolean; date: Date }[] = [];
        for (let i = 0; i < firstDay; i++) {
            const d = prevDays - firstDay + 1 + i;
            arr.push({ day: d, thisMonth: false, date: new Date(schedYear, schedMonth - 1, d) });
        }
        for (let i = 1; i <= daysInMo; i++)
            arr.push({ day: i, thisMonth: true, date: new Date(schedYear, schedMonth, i) });
        const rem = 42 - arr.length;
        for (let i = 1; i <= rem; i++)
            arr.push({ day: i, thisMonth: false, date: new Date(schedYear, schedMonth + 1, i) });
        return arr;
    })();

    function runsOnDate(date: Date): TourRun[] {
        return TOUR_RUNS.filter(r => {
            const s = parseRunDate(r.startDate);
            const e = parseRunDate(r.endDate);
            return date >= s && date <= e;
        });
    }

    function runColorForDate(date: Date): string | null {
        const runs = runsOnDate(date);
        if (!runs.length) return null;
        if (runs.some(r => r.status === "available"))  return "#22c55e";
        if (runs.some(r => r.status === "almostFull")) return "#f59e0b";
        return "#ef4444";
    }

    const visibleRuns = TOUR_RUNS.filter(r => {
        const s = parseRunDate(r.startDate);
        return s.getFullYear() === schedYear && s.getMonth() === schedMonth;
    });

    return (
        <>
            <Header variant="solid" />

            <main className={styles.page}>
                <div className={styles.container}>

                    {/* Breadcrumb */}
                    <nav className={styles.breadcrumb}>
                        <Link href="/">Home</Link>
                        <span>/</span>
                        <Link href="/tours">Tours</Link>
                        <span>/</span>
                        <span>{tour.title}</span>
                    </nav>

                    <div className={styles.layout}>
                        {/* ── LEFT ── */}
                        <div className={styles.left}>

                            {/* Title + meta */}
                            <h1 className={styles.title}>{tour.title}</h1>
                            <div className={styles.metaRow}>
                                <span className={styles.metaItem}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm1 14.93V17a1 1 0 00-2 0v-.07A8.001 8.001 0 014.07 11H5a1 1 0 000-2h-.93A8.001 8.001 0 0111 4.07V5a1 1 0 002 0v-.93A8.001 8.001 0 0119.93 11H19a1 1 0 000 2h.93A8.001 8.001 0 0113 16.93z" fill="currentColor" /></svg>
                                    {tour.meta.days} days, {tour.meta.nights} nights
                                </span>
                                <span className={styles.metaDot}>·</span>
                                <span className={styles.metaItem}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" fill="currentColor" /></svg>
                                    {tour.meta.country}, {tour.meta.city}
                                </span>
                                <span className={styles.metaDot}>·</span>
                                <span className={styles.metaItem}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 4h-1V2h-2v2H8V2H6v2H5C3.89 4 3 4.9 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" fill="currentColor" /></svg>
                                    {tour.meta.date}
                                </span>
                                <span className={styles.metaDot}>·</span>
                                {tour.meta.tags.map((tag) => (
                                    <span key={tag} className={styles.tag}>{tag}</span>
                                ))}
                            </div>

                            {/* Gallery */}
                            <div className={styles.gallery}>
                                <div
                                    className={styles.galleryMain}
                                    onClick={() => { setGalleryIndex(0); setGalleryOpen(true); }}
                                >
                                    <Image
                                        src={tour.gallery[0]}
                                        alt="Main"
                                        fill
                                        sizes="560px"
                                        style={{ objectFit: "cover" }}
                                    />
                                </div>
                                <div className={styles.galleryGrid}>
                                    {tour.gallery.slice(1, 5).map((src, i) => (
                                        <div
                                            key={i}
                                            className={styles.galleryThumb}
                                            onClick={() => { setGalleryIndex(i + 1); setGalleryOpen(true); }}
                                        >
                                            <Image src={src} alt={`Photo ${i + 2}`} fill sizes="260px" style={{ objectFit: "cover" }} />
                                            {i === 3 && (
                                                <div className={styles.galleryMore}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z" fill="currentColor" /></svg>
                                                    Show gallery
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className={styles.tabs}>
                                {tabs.map((tab) => (
                                    <button
                                        key={tab}
                                        className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ""}`}
                                        onClick={() => setActiveTab(tab)}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* ── Overview ── */}
                            {activeTab === "Overview" && (
                                <div className={styles.tabContent}>
                                    <h2 className={styles.sectionTitle}>About This Tour</h2>
                                    <p className={`${styles.description} ${expanded ? styles.descriptionExpanded : ""}`}>
                                        {tour.description}
                                    </p>
                                    <button className={styles.readMore} onClick={() => setExpanded(!expanded)}>
                                        {expanded ? "Show less" : "Read More"}
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d={expanded ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>

                                    {/* Unmissable Places */}
                                    <div className={styles.places}>
                                        <h2 className={styles.sectionTitle}>The Unmissable Places</h2>
                                        <div className={styles.placesLayout}>
                                            <ul className={styles.placesSidebar}>
                                                {placeSidebar.map((cat) => (
                                                    <li key={cat}>
                                                        <button
                                                            className={`${styles.placesCat} ${activePlaceCat === cat ? styles.placesCatActive : ""}`}
                                                            onClick={() => setActivePlaceCat(cat)}
                                                        >
                                                            {cat}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className={styles.placesCards}>
                                                {tour.places.map((place) => (
                                                    <div key={place.name} className={styles.placeCard}>
                                                        <div className={styles.placeCardImg}>
                                                            <Image src={place.image} alt={place.name} fill sizes="200px" style={{ objectFit: "cover" }} />
                                                        </div>
                                                        <div className={styles.placeCardBody}>
                                                            <span className={styles.placeType}>{place.type}</span>
                                                            <p className={styles.placeName}>{place.name}</p>
                                                            <div className={styles.placeRating}>
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="#f5a623"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#f5a623" /></svg>
                                                                {place.rating}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── What's Included ── */}
                            {activeTab === "What's Included" && (
                                <div className={styles.tabContent}>
                                    <h2 className={styles.sectionTitle}>What&apos;s Included</h2>
                                    <div className={styles.includedGrid}>
                                        {tour.included.map((item, i) => (
                                            <div key={i} className={`${styles.includedItem} ${item.icon === "✗" ? styles.includedItemNo : ""}`}>
                                                <span className={styles.includedIcon}>{item.icon}</span>
                                                {item.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Tour Details ── */}
                            {activeTab === "Tour Details" && (
                                <div className={styles.tabContent}>
                                    <h2 className={styles.sectionTitle}>Day-by-Day Itinerary</h2>
                                    <div className={styles.itinerary}>
                                        {tour.itinerary.map((day) => (
                                            <div key={day.day} className={styles.dayCard}>
                                                <div className={styles.dayBadge}>Day {day.day}</div>
                                                <div className={styles.dayInfo}>
                                                    <h3 className={styles.dayTitle}>{day.title}</h3>
                                                    <p className={styles.dayDesc}>{day.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Schedule ── */}
                            {activeTab === "Schedule" && (
                                <div className={styles.tabContent}>
                                    <h2 className={styles.sectionTitle}>Available Departures</h2>
                                    <p className={styles.schedSubtitle}>
                                        This tour runs multiple times throughout the year. Select a departure that fits your plans.
                                    </p>

                                    <div className={styles.schedLayout}>
                                        {/* Mini calendar */}
                                        <div className={styles.schedCal}>
                                            <div className={styles.schedCalHeader}>
                                                <button className={styles.schedNavBtn} onClick={schedPrev}>
                                                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                </button>
                                                <span className={styles.schedCalMonth}>{MONTHS_FULL[schedMonth]} {schedYear}</span>
                                                <button className={styles.schedNavBtn} onClick={schedNext}>
                                                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                </button>
                                            </div>

                                            <div className={styles.schedWdays}>
                                                {WDAYS_SHORT.map(w => <span key={w} className={styles.schedWday}>{w}</span>)}
                                            </div>

                                            <div className={styles.schedGrid}>
                                                {schedCells.map((cell, idx) => {
                                                    const color = cell.thisMonth ? runColorForDate(cell.date) : null;
                                                    const isToday = cell.date.toDateString() === today.toDateString();
                                                    const inSelected = selectedRun
                                                        ? cell.date >= parseRunDate(selectedRun.startDate) && cell.date <= parseRunDate(selectedRun.endDate)
                                                        : false;
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={[
                                                                styles.schedCell,
                                                                !cell.thisMonth ? styles.schedCellOther : "",
                                                                color ? styles.schedCellHasRun : "",
                                                                isToday ? styles.schedCellToday : "",
                                                                inSelected ? styles.schedCellSelected : "",
                                                            ].join(" ")}
                                                            style={color && cell.thisMonth ? { "--run-color": color } as React.CSSProperties : {}}
                                                        >
                                                            {cell.day}
                                                            {color && cell.thisMonth && (
                                                                <span className={styles.schedDot} style={{ background: color }} />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Legend */}
                                            <div className={styles.schedLegend}>
                                                <span className={styles.legendItem}><span className={styles.legendDot} style={{ background:"#22c55e" }}/>Available</span>
                                                <span className={styles.legendItem}><span className={styles.legendDot} style={{ background:"#f59e0b" }}/>Almost Full</span>
                                                <span className={styles.legendItem}><span className={styles.legendDot} style={{ background:"#ef4444" }}/>Full</span>
                                            </div>
                                        </div>

                                        {/* Run list */}
                                        <div className={styles.schedList}>
                                            {visibleRuns.length === 0 ? (
                                                <p className={styles.schedEmpty}>No departures this month. Try another month.</p>
                                            ) : visibleRuns.map(run => {
                                                const cfg = RUN_STATUS_CFG[run.status];
                                                const pct = Math.round((run.booked / run.slots) * 100);
                                                const isSelected = selectedRun?.id === run.id;
                                                return (
                                                    <div
                                                        key={run.id}
                                                        className={`${styles.runCard} ${isSelected ? styles.runCardSelected : ""}`}
                                                        onClick={() => setSelectedRun(isSelected ? null : run)}
                                                    >
                                                        <div className={styles.runCardTop}>
                                                            <div className={styles.runDates}>
                                                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                                                <strong>{fmtDate(run.startDate)}</strong>
                                                                <span>→</span>
                                                                <strong>{fmtDate(run.endDate)}</strong>
                                                            </div>
                                                            <span className={styles.runStatus} style={{ background: cfg.bg, color: cfg.color }}>
                                                                {cfg.label}
                                                            </span>
                                                        </div>

                                                        <div className={styles.runMeta}>
                                                            <span className={styles.runMetaItem}>
                                                                <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/></svg>
                                                                Guide: {run.guide}
                                                            </span>
                                                            <span className={styles.runMetaItem}>
                                                                <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                                                {run.slots - run.booked} / {run.slots} spots left
                                                            </span>
                                                        </div>

                                                        {/* Occupancy bar */}
                                                        <div className={styles.runBar}>
                                                            <div className={styles.runBarTrack}>
                                                                <div
                                                                    className={styles.runBarFill}
                                                                    style={{ width: `${pct}%`, background: pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#22c55e" }}
                                                                />
                                                            </div>
                                                            <span className={styles.runBarPct}>{pct}%</span>
                                                        </div>

                                                        <div className={styles.runCardBottom}>
                                                            <div className={styles.runPrice}>
                                                                <span className={styles.runPriceNew}>${run.price.toLocaleString()}</span>
                                                                {run.originalPrice && (
                                                                    <span className={styles.runPriceOld}>${run.originalPrice.toLocaleString()}</span>
                                                                )}
                                                                <span className={styles.runPricePer}>/ person</span>
                                                            </div>
                                                            {run.status !== "full" && run.status !== "completed" ? (
                                                                <Link
                                                                    href={`/tours/${params?.id ?? 1}/booking?run=${run.id}`}
                                                                    className={styles.runBookBtn}
                                                                    onClick={e => e.stopPropagation()}
                                                                >
                                                                    Book This Date
                                                                </Link>
                                                            ) : (
                                                                <span className={styles.runFullTag}>Unavailable</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* All upcoming runs count */}
                                            <p className={styles.schedAllHint}>
                                                Showing {visibleRuns.length} departure{visibleRuns.length !== 1 ? "s" : ""} in {MONTHS_FULL[schedMonth]}. Use the arrows to browse other months.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── Customization ── */}
                            {activeTab === "Customization" && (
                                <div className={styles.tabContent}>
                                    <h2 className={styles.sectionTitle}>Customize Your Trip</h2>
                                    <p className={styles.customNote}>
                                        Want to tailor this tour to your preferences? Contact our travel experts to create a personalized itinerary just for you — private guide, preferred hotels, custom activities, and flexible dates.
                                    </p>
                                    <button className={styles.contactBtn}>Contact a Travel Expert</button>
                                </div>
                            )}
                        </div>

                        {/* ── RIGHT — Booking card ── */}
                        <aside className={styles.sidebar}>
                            <div className={styles.bookingCard}>
                                <div className={styles.discountBadge}>DISCOUNT</div>
                                <h3 className={styles.bookingName}>{booking.name}</h3>

                                <div className={styles.bookingRating}>
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <svg key={s} width="14" height="14" viewBox="0 0 24 24">
                                            <path
                                                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                                fill={s <= Math.round(booking.rating) ? "#f5a623" : "#e5e7eb"}
                                            />
                                        </svg>
                                    ))}
                                    <span className={styles.ratingValue}>{booking.rating}</span>
                                    <span className={styles.ratingCount}>{booking.reviews} reviews</span>
                                </div>

                                <div className={styles.bookingDates}>
                                    <div className={styles.dateBox}>
                                        <span className={styles.dateLabel}>Check-in</span>
                                        <span className={styles.dateValue}>{booking.checkIn}</span>
                                    </div>
                                    <div className={styles.dateArrow}>→</div>
                                    <div className={styles.dateBox}>
                                        <span className={styles.dateLabel}>Check-out</span>
                                        <span className={styles.dateValue}>{booking.checkOut}</span>
                                    </div>
                                </div>

                                <div className={styles.bookingLength}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm1 11h-4v-2h4V9l4 4-4 4v-4z" fill="currentColor" /></svg>
                                    Total Length: <strong>{booking.nights} nights, {booking.days} days</strong>
                                </div>

                                <div className={styles.bookingPrice}>
                                    <span className={styles.priceNew}>${booking.price.toLocaleString()}.00</span>
                                    <span className={styles.priceOld}>${booking.originalPrice.toLocaleString()}.00</span>
                                </div>

                                <div className={styles.tripCode}>
                                    Trip Code: <strong>{booking.tripCode}</strong>
                                </div>

                                <Link href={`/tours/${params?.id ?? 1}/booking`} className={styles.bookBtn}>Book Your Trip Now!</Link>

                                <div className={styles.bookingFeatures}>
                                    {booking.features.map((f) => (
                                        <div key={f.label} className={styles.featureItem}>
                                            <span>{f.icon}</span>
                                            <span>{f.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>

            {/* Lightbox */}
            {galleryOpen && (
                <div className={styles.lightbox} onClick={() => setGalleryOpen(false)}>
                    <button className={styles.lightboxClose} onClick={() => setGalleryOpen(false)}>✕</button>
                    <button
                        className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                        onClick={(e) => { e.stopPropagation(); setGalleryIndex((galleryIndex - 1 + tour.gallery.length) % tour.gallery.length); }}
                    >‹</button>
                    <div className={styles.lightboxImg} onClick={(e) => e.stopPropagation()}>
                        <Image src={tour.gallery[galleryIndex]} alt="Gallery" fill sizes="90vw" style={{ objectFit: "contain" }} />
                    </div>
                    <button
                        className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                        onClick={(e) => { e.stopPropagation(); setGalleryIndex((galleryIndex + 1) % tour.gallery.length); }}
                    >›</button>
                </div>
            )}

            <Footer />
        </>
    );
}
