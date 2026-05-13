"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { StorageKeys } from "@/constants/storage";
import { agencyService } from "@/libs/services/agency.service";
import { ItineraryDTO, ItineraryStopWithActivitiesDTO } from "@/types/itinerary.type";
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

const tabs = ["Overview", "Tour Details", "Schedule", "Reviews"] as const;
type Tab = (typeof tabs)[number];

// ── Reviews ──────────────────────────────────────────────────────────────
interface TourReview {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    title: string;
    comment: string;
    images: string[];
    date: string;
    helpful: number;
    bookingCode: string;
    agencyReply?: string;
}


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
    const pathname = usePathname();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loginPromptOpen, setLoginPromptOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>("Overview");
    const [expanded, setExpanded] = useState(false);
    const [itinerary, setItinerary] = useState<ItineraryDTO | null>(null);
    const [stops, setStops] = useState<ItineraryStopWithActivitiesDTO[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem(StorageKeys.ACCESS_TOKEN));
    }, []);

    useEffect(() => {
        const id = Array.isArray(params.id) ? params.id[0] : params.id;
        if (!id) return;
        setLoading(true);
        Promise.all([
            agencyService.getItineraryById(id),
            agencyService.getItineraryStops(id),
        ]).then(([iRes, sRes]) => {
            if (iRes?.data) setItinerary(iRes.data);
            if (sRes?.data) setStops(sRes.data);
        }).finally(() => setLoading(false));
    }, [params.id]);
    const [activePlaceCat, setActivePlaceCat] = useState("Top Attractions");
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryIndex, setGalleryIndex] = useState(0);

    // Reviews tab state
    const [reviews, setReviews] = useState<TourReview[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsLoaded, setReviewsLoaded] = useState(false);
    const [reviewLightbox, setReviewLightbox] = useState<string | null>(null);

    useEffect(() => {
        const id = Array.isArray(params.id) ? params.id[0] : params.id;
        if (activeTab !== "Reviews" || reviewsLoaded || !id) return;
        setReviewsLoading(true);
        agencyService.getFeedbacksByItinerary(id).then(res => {
            if (res?.data) {
                setReviews(res.data.map(f => ({
                    id: f.bookingItineraryId,
                    name: f.isAnonymous ? "Anonymous" : (f.username ?? "Guest"),
                    avatar: f.isAnonymous ? undefined : f.userAvatar,
                    rating: f.rating,
                    title: f.title,
                    comment: f.comment ?? "",
                    images: [],
                    date: f.createAt,
                    helpful: 0,
                    bookingCode: f.bookingItineraryId.slice(0, 8).toUpperCase(),
                    agencyReply: f.agencyReply,
                })));
            }
            setReviewsLoaded(true);
        }).catch(() => setReviewsLoaded(true)).finally(() => setReviewsLoading(false));
    }, [activeTab, reviewsLoaded, params.id]);
    const [writeOpen, setWriteOpen] = useState(false);
    const [wRating, setWRating] = useState(0);
    const [wHover, setWHover] = useState(0);
    const [wTitle, setWTitle] = useState("");
    const [wComment, setWComment] = useState("");
    const [wError, setWError] = useState("");
    const [wImages, setWImages] = useState<{ preview: string; name: string }[]>([]);
    const [wDragging, setWDragging] = useState(false);
    const wFileRef = useRef<HTMLInputElement>(null);

    function processImages(files: FileList | File[]) {
        Array.from(files).filter(f => f.type.startsWith("image/")).forEach(file => {
            const reader = new FileReader();
            reader.onload = e => setWImages(prev => [...prev, { preview: e.target?.result as string, name: file.name }]);
            reader.readAsDataURL(file);
        });
    }

    function submitReview() {
        if (!wRating) { setWError("Please select a star rating."); return; }
        if (!wTitle.trim()) { setWError("Please enter a title."); return; }
        if (!wComment.trim()) { setWError("Please write a comment."); return; }
        const newR: TourReview = {
            id: Math.random().toString(36).slice(2),
            name: "You",
            rating: wRating,
            title: wTitle.trim(),
            comment: wComment.trim(),
            images: wImages.map(i => i.preview),
            date: new Date().toISOString().slice(0, 10),
            helpful: 0,
            bookingCode: "BKG-NEW",
        };
        setReviews(prev => [newR, ...prev]);
        setWriteOpen(false);
        setWRating(0); setWTitle(""); setWComment(""); setWError(""); setWImages([]);
        setActiveTab("Reviews");
    }

    // Schedule tab state
    const today = new Date();
    const [schedYear,  setSchedYear]  = useState(today.getFullYear());
    const [schedMonth, setSchedMonth] = useState(today.getMonth());
    const [selectedSchedId, setSelectedSchedId] = useState<string | null>(null);

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

    const schedules = itinerary?.schedules ?? [];

    function schedColorForDate(date: Date): string | null {
        const hit = schedules.find(s => {
            const start = new Date(s.startTime);
            const end   = new Date(s.endTime);
            const d = new Date(date); d.setHours(12);
            return d >= start && d <= end;
        });
        if (!hit) return null;
        return new Date(hit.endTime) >= today ? "#22c55e" : "#9ca3af";
    }

    const visibleSchedules = schedules.filter(s => {
        const d = new Date(s.startTime);
        return d.getFullYear() === schedYear && d.getMonth() === schedMonth;
    });

    const selectedSched = schedules.find(s => s.id === selectedSchedId) ?? null;

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
                        {loading
                            ? <span className={styles.skeletonBreadcrumb} />
                            : <span>{itinerary?.name ?? tour.title}</span>
                        }
                    </nav>

                    <div className={styles.layout}>
                        {/* ── LEFT ── */}
                        <div className={styles.left}>

                            {/* Title + meta */}
                            {loading ? (
                                <>
                                    <div className={styles.skeletonTitle} />
                                    <div className={styles.metaRow}>
                                        <div className={styles.skeletonMeta} style={{ width: 90 }} />
                                        <div className={styles.skeletonMeta} style={{ width: 120 }} />
                                        <div className={styles.skeletonMeta} style={{ width: 80 }} />
                                        <div className={styles.skeletonTag} />
                                        <div className={styles.skeletonTag} />
                                        <div className={styles.skeletonTag} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h1 className={styles.title}>{itinerary?.name ?? tour.title}</h1>
                                    <div className={styles.metaRow}>
                                        <span className={styles.metaItem}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm1 14.93V17a1 1 0 00-2 0v-.07A8.001 8.001 0 014.07 11H5a1 1 0 000-2h-.93A8.001 8.001 0 0111 4.07V5a1 1 0 002 0v-.93A8.001 8.001 0 0119.93 11H19a1 1 0 000 2h.93A8.001 8.001 0 0113 16.93z" fill="currentColor" /></svg>
                                            {itinerary ? `${itinerary.durationDays} days` : `${tour.meta.days} days, ${tour.meta.nights} nights`}
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
                                </>
                            )}

                            {/* Gallery */}
                            {loading ? (
                                <div className={styles.gallery}>
                                    <div className={styles.skeletonGalleryMain} />
                                    <div className={styles.galleryGrid}>
                                        {[0,1,2,3].map(i => (
                                            <div key={i} className={styles.skeletonGalleryThumb} />
                                        ))}
                                    </div>
                                </div>
                            ) : (() => {
                                const gallery = itinerary?.images?.length
                                    ? itinerary.images.map(img => img.url)
                                    : tour.gallery;
                                return (
                                    <div className={styles.gallery}>
                                        <div
                                            className={styles.galleryMain}
                                            onClick={() => { setGalleryIndex(0); setGalleryOpen(true); }}
                                        >
                                            <Image
                                                src={gallery[0]}
                                                alt="Main"
                                                fill
                                                sizes="560px"
                                                style={{ objectFit: "cover" }}
                                            />
                                        </div>
                                        <div className={styles.galleryGrid}>
                                            {gallery.slice(1, 5).map((src, i) => (
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
                                );
                            })()}

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
                                    {loading ? (
                                        <div className={styles.skeletonDescBlock}>
                                            {[100, 90, 95, 80, 88, 60].map((w, i) => (
                                                <div key={i} className={styles.skeletonDescLine} style={{ width: `${w}%` }} />
                                            ))}
                                        </div>
                                    ) : (
                                        <>
                                            <p className={`${styles.description} ${expanded ? styles.descriptionExpanded : ""}`}>
                                                {itinerary?.description ?? tour.description}
                                            </p>
                                            <button className={styles.readMore} onClick={() => setExpanded(!expanded)}>
                                                {expanded ? "Show less" : "Read More"}
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                    <path d={expanded ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </button>
                                        </>
                                    )}

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


                            {/* ── Tour Details ── */}
                            {activeTab === "Tour Details" && (
                                <div className={styles.tabContent}>
                                    <h2 className={styles.sectionTitle}>Tour Stops</h2>
                                    {stops.length === 0 ? (
                                        <p className={styles.emptyNote}>No stop information available.</p>
                                    ) : (
                                        <div className={styles.stopList}>
                                            {stops.map((stop, idx) => (
                                                <div key={stop.id} className={styles.stopCard}>
                                                    <div className={styles.stopHeader}>
                                                        <div className={styles.stopBadge}>{idx + 1}</div>
                                                        <div className={styles.stopMeta}>
                                                            <h3 className={styles.stopName}>{stop.name}</h3>
                                                            {stop.address && (
                                                                <span className={styles.stopAddress}>
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" fill="currentColor"/></svg>
                                                                    {stop.address}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {stop.activities.length > 0 && (
                                                        <div className={styles.activityList}>
                                                            {stop.activities.map(act => (
                                                                <div key={act.id} className={styles.activityItem}>
                                                                    <div className={styles.activityTime}>
                                                                        {new Date(act.startTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                                                        {" – "}
                                                                        {new Date(act.endTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                                                    </div>
                                                                    <div className={styles.activityBody}>
                                                                        <span className={styles.activityName}>{act.serviceName ?? act.customName}</span>
                                                                        {act.serviceDescription && (
                                                                            <span className={styles.activityDesc}>{act.serviceDescription}</span>
                                                                        )}
                                                                        {act.note && (
                                                                            <span className={styles.activityNote}>{act.note}</span>
                                                                        )}
                                                                    </div>
                                                                    <div className={styles.activityPrice}>
                                                                        {act.price.toLocaleString("vi-VN")}đ
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
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
                                                    const color = cell.thisMonth ? schedColorForDate(cell.date) : null;
                                                    const isToday = cell.date.toDateString() === today.toDateString();
                                                    const inSelected = selectedSched
                                                        ? (() => { const s = new Date(selectedSched.startTime); const e = new Date(selectedSched.endTime); const d = new Date(cell.date); d.setHours(12); return d >= s && d <= e; })()
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
                                                <span className={styles.legendItem}><span className={styles.legendDot} style={{ background:"#9ca3af" }}/>Past</span>
                                            </div>
                                        </div>

                                        {/* Schedule list */}
                                        <div className={styles.schedList}>
                                            {visibleSchedules.length === 0 ? (
                                                <p className={styles.schedEmpty}>No departures this month. Try another month.</p>
                                            ) : visibleSchedules.map(sched => {
                                                const start  = new Date(sched.startTime);
                                                const end    = new Date(sched.endTime);
                                                const isPast = end < today;
                                                const isSelected = selectedSchedId === sched.id;
                                                const fmtD = (d: Date) => d.toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
                                                return (
                                                    <div
                                                        key={sched.id}
                                                        className={`${styles.runCard} ${isSelected ? styles.runCardSelected : ""}`}
                                                        onClick={() => setSelectedSchedId(isSelected ? null : sched.id)}
                                                    >
                                                        <div className={styles.runCardTop}>
                                                            <div className={styles.runDates}>
                                                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                                                <strong>{fmtD(start)}</strong>
                                                                <span>→</span>
                                                                <strong>{fmtD(end)}</strong>
                                                            </div>
                                                            <span className={styles.runStatus} style={isPast
                                                                ? { background:"#f3f4f6", color:"#6b7280" }
                                                                : { background:"#d1fae5", color:"#065f46" }}>
                                                                {isPast ? "Past" : "Available"}
                                                            </span>
                                                        </div>

                                                        <div className={styles.runMeta}>
                                                            <span className={styles.runMetaItem}>
                                                                <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/></svg>
                                                                Guide: {sched.guideName ?? "—"}
                                                            </span>
                                                            <span className={styles.runMetaItem}>
                                                                <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                                                {sched.spotLeft ?? "—"} spots left
                                                            </span>
                                                        </div>

                                                        <div className={styles.runCardBottom}>
                                                            <div className={styles.runPrice}>
                                                                <span className={styles.runPriceNew}>
                                                                    {(itinerary?.price ?? 0).toLocaleString("vi-VN")}đ
                                                                </span>
                                                                <span className={styles.runPricePer}>/ person</span>
                                                            </div>
                                                            {!isPast ? (
                                                                <Link
                                                                    href={`/tours/${params?.id ?? 1}/booking?scheduleId=${sched.id}`}
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

                                            <p className={styles.schedAllHint}>
                                                Showing {visibleSchedules.length} departure{visibleSchedules.length !== 1 ? "s" : ""} in {MONTHS_FULL[schedMonth]}. Use the arrows to browse other months.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}


                            {/* ── Reviews ── */}
                            {activeTab === "Reviews" && (() => {
                                const total = reviews.length;
                                const avg = total ? +(reviews.reduce((s,r) => s + r.rating, 0) / total).toFixed(1) : 0;
                                const dist = [5,4,3,2,1].map(star => ({
                                    star,
                                    count: reviews.filter(r => r.rating === star).length,
                                    pct: total ? Math.round(reviews.filter(r => r.rating === star).length / total * 100) : 0,
                                }));
                                if (reviewsLoading) return (
                                    <div className={styles.tabContent} style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
                                        Đang tải đánh giá...
                                    </div>
                                );
                                return (
                                    <div className={styles.tabContent}>
                                        {/* Summary bar */}
                                        <div className={styles.reviewSummary}>
                                            <div className={styles.reviewAvgBlock}>
                                                <span className={styles.reviewAvgNum}>{avg}</span>
                                                <div className={styles.reviewStars}>
                                                    {[1,2,3,4,5].map(i => (
                                                        <svg key={i} width="18" height="18" viewBox="0 0 24 24">
                                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                                                fill={i <= Math.round(avg) ? "#f5a623" : "#e5e7eb"} />
                                                        </svg>
                                                    ))}
                                                </div>
                                                <span className={styles.reviewCount}>{total} reviews</span>
                                            </div>
                                            <div className={styles.reviewDistBars}>
                                                {dist.map(d => (
                                                    <div key={d.star} className={styles.reviewDistRow}>
                                                        <span className={styles.reviewDistLabel}>{d.star}★</span>
                                                        <div className={styles.reviewDistTrack}>
                                                            <div className={styles.reviewDistFill} style={{
                                                                width: `${d.pct}%`,
                                                                background: d.star >= 4 ? "#22c55e" : d.star === 3 ? "#f59e0b" : "#ef4444",
                                                            }}/>
                                                        </div>
                                                        <span className={styles.reviewDistCount}>{d.count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <button className={styles.writeReviewBtn} onClick={() => isLoggedIn ? setWriteOpen(true) : setLoginPromptOpen(true)}>
                                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                                Write a Review
                                            </button>
                                        </div>

                                        {/* Review cards */}
                                        <div className={styles.reviewList}>
                                            {reviews.length === 0 && reviewsLoaded && (
                                                <div className={styles.reviewEmpty}>
                                                    <div className={styles.reviewEmptyIcon}>
                                                        <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
                                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="#c7d2fe" strokeWidth="1.2" fill="#eef2ff"/>
                                                        </svg>
                                                        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" className={styles.reviewEmptyIconSm}>
                                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="#a5b4fc" strokeWidth="1.2" fill="#e0e7ff"/>
                                                        </svg>
                                                        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" className={styles.reviewEmptyIconXs}>
                                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="#c7d2fe" strokeWidth="1.2" fill="#eef2ff"/>
                                                        </svg>
                                                    </div>
                                                    <h3 className={styles.reviewEmptyTitle}>Chưa có đánh giá nào</h3>
                                                    <p className={styles.reviewEmptyDesc}>
                                                        Hãy là người đầu tiên chia sẻ trải nghiệm của bạn về tour này.<br/>
                                                        Đánh giá của bạn giúp ích rất nhiều cho những du khách khác!
                                                    </p>
                                                    <button
                                                        className={styles.reviewEmptyBtn}
                                                        onClick={() => isLoggedIn ? setWriteOpen(true) : setLoginPromptOpen(true)}
                                                    >
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                                                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                                        </svg>
                                                        Viết đánh giá đầu tiên
                                                    </button>
                                                </div>
                                            )}
                                            {reviews.map(r => (
                                                <div key={r.id} className={styles.reviewCard}>
                                                    {/* Top */}
                                                    <div className={styles.reviewCardTop}>
                                                        <div className={styles.reviewerAvatar}>
                                                            {r.avatar
                                                                ? <img src={r.avatar} alt={r.name} className={styles.reviewerAvatarImg}/>
                                                                : <span className={styles.reviewerAvatarFallback}>{r.name[0]}</span>
                                                            }
                                                        </div>
                                                        <div className={styles.reviewerMeta}>
                                                            <span className={styles.reviewerName}>{r.name}</span>
                                                            <span className={styles.reviewerDate}>{new Date(r.date).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })}</span>
                                                        </div>
                                                        <div className={styles.reviewCardStars}>
                                                            {[1,2,3,4,5].map(i => (
                                                                <svg key={i} width="13" height="13" viewBox="0 0 24 24">
                                                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                                                        fill={i <= r.rating ? "#f5a623" : "#e5e7eb"} />
                                                                </svg>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {/* Content */}
                                                    <p className={styles.reviewCardTitle}>{r.title}</p>
                                                    <p className={styles.reviewCardComment}>{r.comment}</p>
                                                    {/* Images */}
                                                    {r.images.length > 0 && (
                                                        <div className={styles.reviewImgRow}>
                                                            {r.images.map((img, i) => (
                                                                <div key={i} className={styles.reviewImgThumb} onClick={() => setReviewLightbox(img)}>
                                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                    <img src={img} alt="" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {/* Agency reply */}
                                                    {r.agencyReply && (
                                                        <div className={styles.reviewReply}>
                                                            <span className={styles.reviewReplyLabel}>Agency reply</span>
                                                            <p className={styles.reviewReplyText}>{r.agencyReply}</p>
                                                        </div>
                                                    )}
                                                    {/* Footer */}
                                                    <div className={styles.reviewCardFooter}>
                                                        <span className={styles.reviewBookingCode}>{r.bookingCode}</span>
                                                        {r.helpful > 0 && (
                                                            <span className={styles.reviewHelpful}>
                                                                <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                                                {r.helpful} found helpful
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* ── RIGHT — Booking card ── */}
                        <aside className={styles.sidebar}>
                            <div className={styles.bookingCard}>
                                {loading ? (
                                    <>
                                        <div className={styles.skeletonBookingName} />
                                        <div className={styles.skeletonRatingRow}>
                                            {[0,1,2,3,4].map(i => <div key={i} className={styles.skeletonStar} />)}
                                            <div className={styles.skeletonInline} style={{ width: 32 }} />
                                            <div className={styles.skeletonInline} style={{ width: 72 }} />
                                        </div>
                                        <div className={styles.bookingDates}>
                                            <div className={styles.dateBox}>
                                                <div className={styles.skeletonInline} style={{ width: 52, height: 11 }} />
                                                <div className={styles.skeletonInline} style={{ width: 70, height: 16, marginTop: 6 }} />
                                            </div>
                                            <div className={styles.dateArrow}>→</div>
                                            <div className={styles.dateBox}>
                                                <div className={styles.skeletonInline} style={{ width: 60, height: 11 }} />
                                                <div className={styles.skeletonInline} style={{ width: 70, height: 16, marginTop: 6 }} />
                                            </div>
                                        </div>
                                        <div className={styles.skeletonInline} style={{ width: 140, height: 14, marginBottom: 16 }} />
                                        <div className={styles.skeletonPrice} />
                                        <div className={styles.skeletonBtn} />
                                        <div className={styles.skeletonFeaturesRow}>
                                            {[0,1,2,3].map(i => <div key={i} className={styles.skeletonFeature} />)}
                                        </div>
                                    </>
                                ) : (() => {
                                    const now = new Date();
                                    const nearestSchedule = itinerary?.schedules
                                        ?.map(s => ({ ...s, start: new Date(s.startTime), end: new Date(s.endTime) }))
                                        .filter(s => s.start >= now)
                                        .sort((a, b) => a.start.getTime() - b.start.getTime())[0] ?? null;
                                    const fmtBookingDate = (d: Date) =>
                                        d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, ".");
                                    return (
                                        <>
                                            <h3 className={styles.bookingName}>{itinerary?.name ?? booking.name}</h3>

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
                                                    <span className={styles.dateValue}>
                                                        {nearestSchedule ? fmtBookingDate(nearestSchedule.start) : "—"}
                                                    </span>
                                                </div>
                                                <div className={styles.dateArrow}>→</div>
                                                <div className={styles.dateBox}>
                                                    <span className={styles.dateLabel}>Check-out</span>
                                                    <span className={styles.dateValue}>
                                                        {nearestSchedule ? fmtBookingDate(nearestSchedule.end) : "—"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className={styles.bookingLength}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm1 11h-4v-2h4V9l4 4-4 4v-4z" fill="currentColor" /></svg>
                                                Total Length: <strong>{itinerary?.durationDays ?? booking.days} days</strong>
                                            </div>

                                            <div className={styles.bookingPrice}>
                                                <span className={styles.priceNew}>
                                                    {(itinerary?.price ?? booking.price).toLocaleString("vi-VN")}đ
                                                </span>
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
                                        </>
                                    );
                                })()}
                            </div>
                        </aside>
                    </div>
                </div>
            </main>

            {/* ── Login Required Prompt ── */}
            {loginPromptOpen && (
                <div className={styles.reviewOverlay} onClick={() => setLoginPromptOpen(false)}>
                    <div className={styles.loginPrompt} onClick={e => e.stopPropagation()}>
                        <button className={styles.reviewModalClose} style={{ alignSelf: "flex-end", flexShrink: 0 }} onClick={() => setLoginPromptOpen(false)}>
                            <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                        </button>
                        <div className={styles.loginPromptIcon}>
                            <svg viewBox="0 0 24 24" fill="none" width="32" height="32"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>
                        </div>
                        <h3 className={styles.loginPromptTitle}>Sign in to leave feedback</h3>
                        <p className={styles.loginPromptDesc}>
                            You need to be signed in to write a review. Your experience helps other travellers make better decisions!
                        </p>
                        <div className={styles.loginPromptBtns}>
                            <Link
                                href={`/signin?redirect=${encodeURIComponent(pathname ?? "")}`}
                                className={styles.loginPromptSignIn}
                                onClick={() => setLoginPromptOpen(false)}
                            >
                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                Sign In
                            </Link>
                            <Link href="/signup" className={styles.loginPromptSignUp} onClick={() => setLoginPromptOpen(false)}>
                                Create Account
                            </Link>
                        </div>
                        <p className={styles.loginPromptCancel} onClick={() => setLoginPromptOpen(false)}>
                            Continue browsing without signing in
                        </p>
                    </div>
                </div>
            )}

            {/* ── Write Review Modal ── */}
            {writeOpen && (
                <div className={styles.reviewOverlay} onClick={() => setWriteOpen(false)}>
                    <div className={styles.reviewModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.reviewModalHeader}>
                            <div>
                                <h3 className={styles.reviewModalTitle}>Leave Feedback</h3>
                                <p className={styles.reviewModalSub}>{tour.title}</p>
                            </div>
                            <button className={styles.reviewModalClose} onClick={() => { setWriteOpen(false); setWRating(0); setWTitle(""); setWComment(""); setWError(""); setWImages([]); }}>
                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                            </button>
                        </div>

                        <div className={styles.reviewModalBody}>
                            {/* Star picker */}
                            <div className={styles.reviewField}>
                                <label className={styles.reviewLabel}>Your Rating <span className={styles.reviewRequired}>*</span></label>
                                <div className={styles.starPicker}>
                                    {[1,2,3,4,5].map(i => (
                                        <button
                                            key={i}
                                            type="button"
                                            className={`${styles.starPickerBtn} ${i <= (wHover || wRating) ? styles.starPickerFilled : ""}`}
                                            onMouseEnter={() => setWHover(i)}
                                            onMouseLeave={() => setWHover(0)}
                                            onClick={() => { setWRating(i); setWError(""); }}
                                        >★</button>
                                    ))}
                                    {wRating > 0 && (
                                        <span className={styles.starPickerLabel}>
                                            {["","Terrible","Poor","Average","Good","Excellent"][wRating]}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Title */}
                            <div className={styles.reviewField}>
                                <label className={styles.reviewLabel}>Title <span className={styles.reviewRequired}>*</span></label>
                                <input
                                    className={styles.reviewInput}
                                    placeholder="Summarize your experience…"
                                    value={wTitle}
                                    onChange={e => { setWTitle(e.target.value); setWError(""); }}
                                />
                            </div>

                            {/* Comment */}
                            <div className={styles.reviewField}>
                                <label className={styles.reviewLabel}>Your Review <span className={styles.reviewRequired}>*</span></label>
                                <textarea
                                    className={styles.reviewTextarea}
                                    rows={4}
                                    placeholder="Tell others about your experience — what you loved, what could be improved, and any tips for future travellers…"
                                    value={wComment}
                                    onChange={e => { setWComment(e.target.value); setWError(""); }}
                                />
                            </div>

                            {/* Images */}
                            <div className={styles.reviewField}>
                                <label className={styles.reviewLabel}>
                                    Photos
                                    <span className={styles.reviewLabelNote}>optional · PNG, JPG</span>
                                </label>
                                <div
                                    className={`${styles.reviewDropZone} ${wDragging ? styles.reviewDropZoneActive : ""}`}
                                    onDragOver={e => { e.preventDefault(); setWDragging(true); }}
                                    onDragLeave={() => setWDragging(false)}
                                    onDrop={e => { e.preventDefault(); setWDragging(false); processImages(Array.from(e.dataTransfer.files)); }}
                                    onClick={() => wFileRef.current?.click()}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" width="22" height="22" style={{ color: wDragging ? "#4f46e5" : "#9ca3af", flexShrink: 0 }}><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.6"/><circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    <span className={styles.reviewDropZoneText}>
                                        {wDragging ? "Release to add photos" : "Drag photos here or "}
                                        {!wDragging && <span className={styles.reviewDropZoneLink}>browse</span>}
                                    </span>
                                </div>
                                <input
                                    ref={wFileRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    style={{ display: "none" }}
                                    onChange={e => { if (e.target.files) processImages(e.target.files); if (wFileRef.current) wFileRef.current.value = ""; }}
                                />
                                {wImages.length > 0 && (
                                    <div className={styles.reviewImgPreviewGrid}>
                                        {wImages.map((img, i) => (
                                            <div key={i} className={styles.reviewImgPreviewThumb}>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={img.preview} alt={img.name} />
                                                <button
                                                    type="button"
                                                    className={styles.reviewImgPreviewRemove}
                                                    onClick={e => { e.stopPropagation(); setWImages(prev => prev.filter((_, j) => j !== i)); }}
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" width="9" height="9"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                                                </button>
                                            </div>
                                        ))}
                                        <button type="button" className={styles.reviewImgAddMore} onClick={() => wFileRef.current?.click()}>
                                            <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {wError && <p className={styles.reviewError}>{wError}</p>}
                        </div>

                        <div className={styles.reviewModalFooter}>
                            <button className={styles.reviewCancelBtn} onClick={() => { setWriteOpen(false); setWRating(0); setWTitle(""); setWComment(""); setWError(""); setWImages([]); }}>Cancel</button>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                {wImages.length > 0 && <span style={{ fontSize: 12, color: "#6b7280" }}>{wImages.length} photo{wImages.length > 1 ? "s" : ""}</span>}
                                <button className={styles.reviewSubmitBtn} onClick={submitReview}>
                                    <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Review image lightbox ── */}
            {reviewLightbox && (
                <div className={styles.lightbox} onClick={() => setReviewLightbox(null)}>
                    <button className={styles.lightboxClose} onClick={() => setReviewLightbox(null)}>✕</button>
                    <div className={styles.lightboxImg} onClick={e => e.stopPropagation()}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={reviewLightbox} alt="" style={{ maxWidth: "90vw", maxHeight: "88vh", objectFit: "contain", borderRadius: 10 }} />
                    </div>
                </div>
            )}

            {/* Lightbox */}
            {galleryOpen && (() => {
                const gallery = itinerary?.images?.length
                    ? itinerary.images.map(img => img.url)
                    : tour.gallery;
                return (
                    <div className={styles.lightbox} onClick={() => setGalleryOpen(false)}>
                        <button className={styles.lightboxClose} onClick={() => setGalleryOpen(false)}>✕</button>
                        <button
                            className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                            onClick={(e) => { e.stopPropagation(); setGalleryIndex((galleryIndex - 1 + gallery.length) % gallery.length); }}
                        >‹</button>
                        <div className={styles.lightboxImg} onClick={(e) => e.stopPropagation()}>
                            <Image src={gallery[galleryIndex]} alt="Gallery" fill sizes="90vw" style={{ objectFit: "contain" }} />
                        </div>
                        <button
                            className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                            onClick={(e) => { e.stopPropagation(); setGalleryIndex((galleryIndex + 1) % gallery.length); }}
                        >›</button>
                    </div>
                );
            })()}

            <Footer />
        </>
    );
}
