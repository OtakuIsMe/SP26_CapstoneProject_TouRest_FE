"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Header from "@/components/layouts/header/header";
import Footer from "@/components/layouts/footer/footer";
import BudgetSlider from "@/components/commons/budget-slider/budget-slider";
import PropertyCard from "@/components/commons/property-card/property-card";
import styles from "./page.module.scss";
import { agencyService } from "@/libs/services/agency.service";
import { ItineraryDTO } from "@/types/itinerary.type";

const PAGE_SIZE = 5;
const MAX_PRICE = 50_000_000;

// ── Filter options ────────────────────────────────────────────────────────────
type DurationOpt = "any" | "1" | "2-3" | "4-7" | "7+";

const DURATION_OPTIONS: { value: DurationOpt; label: string }[] = [
    { value: "any", label: "All" },
    { value: "1",   label: "1 day" },
    { value: "2-3", label: "2 – 3 days" },
    { value: "4-7", label: "4 – 7 days" },
    { value: "7+",  label: "7+ days" },
];

const VEHICLE_OPTIONS: { value: string; label: string }[] = [
    { value: "",           label: "All" },
    { value: "Bus",        label: "Bus" },
    { value: "MiniVan",    label: "Minivan" },
    { value: "PrivateCar", label: "Private Car" },
    { value: "Boat",       label: "Boat / Ferry" },
    { value: "Train",      label: "Train" },
    { value: "Walking",    label: "Walking" },
];

function durationToRange(d: DurationOpt): { low?: number; high?: number } {
    if (d === "1")   return { low: 1, high: 1 };
    if (d === "2-3") return { low: 2, high: 3 };
    if (d === "4-7") return { low: 4, high: 7 };
    if (d === "7+")  return { low: 8 };
    return {};
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function PropertyCardSkeleton() {
    return (
        <div className={styles.cardSkeleton}>
            <div className={styles.cardSkeletonImage} />
            <div className={styles.cardSkeletonContent}>
                <div className={styles.skeletonLine} style={{ width: "40%", height: 12 }} />
                <div className={styles.skeletonLine} style={{ width: "70%", height: 20 }} />
                <div className={styles.skeletonLine} style={{ width: "55%", height: 12 }} />
                <div className={styles.cardSkeletonBottom}>
                    <div className={styles.skeletonLine} style={{ width: "30%", height: 12 }} />
                    <div className={styles.skeletonLine} style={{ width: "25%", height: 20 }} />
                </div>
            </div>
        </div>
    );
}

// ── Filter section header ─────────────────────────────────────────────────────
function FilterHeader({
    title, open, onToggle,
}: { title: string; open: boolean; onToggle: () => void }) {
    return (
        <div className={styles.filterHeader} onClick={onToggle} style={{ cursor: "pointer" }}>
            <span className={styles.filterTitle}>{title}</span>
            <svg
                viewBox="0 0 24 24" fill="none" width="15" height="15"
                style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </div>
    );
}

// ── Main content ──────────────────────────────────────────────────────────────
function ToursContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const initDestination = searchParams.get("destination") ?? "";
    const initName        = searchParams.get("name") ?? "";
    const initDate        = searchParams.get("date") ?? "";

    const [tours,        setTours]        = useState<ItineraryDTO[]>([]);
    const [loading,      setLoading]      = useState(true);
    const [total,        setTotal]        = useState(0);
    const [page,         setPage]         = useState(1);
    const [lowPrice,     setLowPrice]     = useState(0);
    const [highPrice,    setHighPrice]    = useState(MAX_PRICE);
    const [destination,  setDestination]  = useState(initDestination);
    const [name,         setName]         = useState(initName);
    const [scheduleDate, setScheduleDate] = useState(initDate);
    const [duration,     setDuration]     = useState<DurationOpt>("any");
    const [vehicleType,  setVehicleType]  = useState("");

    // committed search values (applied on Search button)
    const [activeDestination, setActiveDestination] = useState(initDestination);
    const [activeName,        setActiveName]        = useState(initName);
    const [activeDate,        setActiveDate]        = useState(initDate);

    // collapsible filter sections
    const [durOpen, setDurOpen] = useState(true);
    const [vehOpen, setVehOpen] = useState(true);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    const fetchTours = useCallback(async (
        p: number,
        lo: number, hi: number,
        dest: string, nm: string,
        dur: DurationOpt, veh: string,
        dt: string,
    ) => {
        setLoading(true);
        const { low: durLow, high: durHigh } = durationToRange(dur);
        try {
            const res = await agencyService.getItineraries({
                page:           dt ? undefined : p,
                pageSize:       dt ? 200 : PAGE_SIZE,
                status:         "Active",
                lowPrice:       lo > 0         ? lo   : undefined,
                highPrice:      hi < MAX_PRICE ? hi   : undefined,
                destination:    dest.trim()    || undefined,
                name:           nm.trim()      || undefined,
                lowDurationDay: durLow,
                highDurationDay: durHigh,
                vehicleType:    veh            || undefined,
            });
            if (res.data) {
                let items = res.data.items ?? [];
                let count = res.data.total ?? 0;
                if (dt) {
                    items = items.filter(t =>
                        t.schedules.some(s => s.startTime.slice(0, 10) === dt)
                    );
                    count = items.length;
                }
                setTours(items);
                setTotal(count);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTours(1, 0, MAX_PRICE, initDestination, initName, "any", "", initDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (destination.trim())  params.set("destination", destination.trim());
        if (name.trim())         params.set("name", name.trim());
        if (scheduleDate)        params.set("date", scheduleDate);
        const qs = params.toString();
        router.replace(`/tours${qs ? `?${qs}` : ""}`, { scroll: false });
        setActiveDestination(destination);
        setActiveName(name);
        setActiveDate(scheduleDate);
        setPage(1);
        fetchTours(1, lowPrice, highPrice, destination, name, duration, vehicleType, scheduleDate);
    };

    const handleRangeChange = useCallback((lo: number, hi: number) => {
        setLowPrice(lo);
        setHighPrice(hi);
        setPage(1);
        fetchTours(1, lo, hi, activeDestination, activeName, duration, vehicleType, activeDate);
    }, [fetchTours, activeDestination, activeName, duration, vehicleType, activeDate]);

    const handleDurationChange = (d: DurationOpt) => {
        setDuration(d);
        setPage(1);
        fetchTours(1, lowPrice, highPrice, activeDestination, activeName, d, vehicleType, activeDate);
    };

    const handleVehicleChange = (v: string) => {
        setVehicleType(v);
        setPage(1);
        fetchTours(1, lowPrice, highPrice, activeDestination, activeName, duration, v, activeDate);
    };

    const goToPage = (p: number) => {
        setPage(p);
        fetchTours(p, lowPrice, highPrice, activeDestination, activeName, duration, vehicleType, activeDate);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const activeFilterCount = (duration !== "any" ? 1 : 0) + (vehicleType ? 1 : 0);

    return (
        <main>
            <Header variant="solid" />

            {/* ── Search Bar ── */}
            <div className={styles.searchBarWrap}>
                <div className={styles.searchBarInner}>
                    <div className={styles.sbField}>
                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16" className={styles.sbIcon}>
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" fill="currentColor"/>
                        </svg>
                        <div className={styles.sbFieldBody}>
                            <span className={styles.sbLabel}>Destination</span>
                            <input
                                className={styles.sbInput}
                                placeholder="Enter destination"
                                value={destination}
                                onChange={e => setDestination(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleSearch()}
                            />
                        </div>
                    </div>

                    <div className={styles.sbDivider} />

                    <div className={styles.sbDivider} />

                    <div className={styles.sbField}>
                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16" className={styles.sbIcon}>
                            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
                            <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                        <div className={styles.sbFieldBody}>
                            <span className={styles.sbLabel}>Start Date</span>
                            <input
                                type="date"
                                className={styles.sbInput}
                                value={scheduleDate}
                                onChange={e => setScheduleDate(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleSearch()}
                                style={{ colorScheme: "light" }}
                            />
                        </div>
                    </div>

                    <div className={styles.sbDivider} />

                    <div className={styles.sbField}>
                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16" className={styles.sbIcon}>
                            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/>
                            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                        </svg>
                        <div className={styles.sbFieldBody}>
                            <span className={styles.sbLabel}>Tour Name</span>
                            <input
                                className={styles.sbInput}
                                placeholder="Search by tour name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleSearch()}
                            />
                        </div>
                    </div>

                    <button className={styles.sbBtn} onClick={handleSearch}>
                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Search
                    </button>
                </div>
            </div>

            <div className={styles.container}>
                {/* Deals Banner */}
                <section className={styles.dealsSection}>
                    <h2 className={styles.dealsHeading}>Exclusive Deals Just for You!</h2>
                    <div className={styles.dealsBanner}>
                        <div className={styles.bannerContent}>
                            <div className={styles.bannerIcon}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" fill="#f59e0b" />
                                    <circle cx="12" cy="12" r="4" fill="#fff" />
                                </svg>
                            </div>
                            <p className={styles.bannerLabel}>Premium Medical Tours<br />Special Price!</p>
                            <p className={styles.bannerDiscount}>20%</p>
                            <p className={styles.bannerTerms}>*terms & conditions apply</p>
                        </div>
                        <div className={styles.bannerBrand}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M3 17l6-6 4 4 8-8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            TouRest
                        </div>
                        <div className={styles.bannerImage}>
                            <Image src="/images/landing/banner.jpg" alt="Medical tour deals" fill sizes="100vw" style={{ objectFit: "cover" }} />
                        </div>
                    </div>
                </section>

                {/* Results Header */}
                <section className={styles.resultsHeader}>
                    <div className={styles.resultsLeft}>
                        <h1 className={styles.resultsTitle}>
                            {loading ? "Loading..." : `${total} Tour${total !== 1 ? "s" : ""} found`}
                        </h1>
                        <div className={styles.resultsActions}>
                            <button className={styles.actionBtn}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Share
                            </button>
                            <button className={styles.actionBtn}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Save
                            </button>
                        </div>
                    </div>
                    <button className={styles.sortBtn}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M3 6h18M3 12h12M3 18h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        Sort: Featured
                    </button>
                </section>

                {/* Main Content */}
                <div className={styles.main}>

                    {/* ── Filter Sidebar ── */}
                    <aside className={styles.sidebar}>
                        <div className={styles.filtersLabelRow}>
                            <p className={styles.filtersLabel}>Filter by:</p>
                            {activeFilterCount > 0 && (
                                <button
                                    className={styles.clearFiltersBtn}
                                    onClick={() => { handleDurationChange("any"); handleVehicleChange(""); }}
                                >
                                    Clear ({activeFilterCount})
                                </button>
                            )}
                        </div>

                        {/* Price Range */}
                        <div className={styles.filterSection}>
                            <div className={styles.filterHeader}>
                                <span className={styles.filterTitle}>Price Range</span>
                            </div>
                            <BudgetSlider
                                min={0}
                                max={MAX_PRICE}
                                defaultMin={0}
                                defaultMax={MAX_PRICE}
                                onRangeChange={handleRangeChange}
                            />
                        </div>

                        {/* Duration */}
                        <div className={styles.filterSection}>
                            <FilterHeader title="Tour Duration" open={durOpen} onToggle={() => setDurOpen(o => !o)} />
                            {durOpen && (
                                <div className={styles.filterOpts}>
                                    {DURATION_OPTIONS.map(opt => (
                                        <label key={opt.value} className={styles.filterOpt}>
                                            <input
                                                type="radio"
                                                name="duration"
                                                className={styles.filterRadio}
                                                checked={duration === opt.value}
                                                onChange={() => handleDurationChange(opt.value)}
                                            />
                                            <span className={styles.filterOptLabel}>{opt.label}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Transport */}
                        <div className={styles.filterSection} style={{ borderBottom: "none" }}>
                            <FilterHeader title="Transport" open={vehOpen} onToggle={() => setVehOpen(o => !o)} />
                            {vehOpen && (
                                <div className={styles.filterOpts}>
                                    {VEHICLE_OPTIONS.map(opt => (
                                        <label key={opt.value} className={styles.filterOpt}>
                                            <input
                                                type="radio"
                                                name="vehicle"
                                                className={styles.filterRadio}
                                                checked={vehicleType === opt.value}
                                                onChange={() => handleVehicleChange(opt.value)}
                                            />
                                            <span className={styles.filterOptLabel}>{opt.label}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* ── Listings + Pagination ── */}
                    <div className={styles.listingsWrapper}>
                        <div className={styles.listings}>
                            {loading
                                ? Array.from({ length: PAGE_SIZE }).map((_, i) => <PropertyCardSkeleton key={i} />)
                                : tours.length > 0
                                    ? tours.map((tour) => (
                                        <PropertyCard
                                            key={tour.id}
                                            id={tour.id}
                                            image={tour.images?.[0]?.url}
                                            name={tour.name}
                                            description={tour.description}
                                            duration={tour.durationDays}
                                            stopCount={tour.stopCount}
                                            price={tour.price}
                                        />
                                    ))
                                    : (
                                        <div className={styles.emptyState}>
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                                <circle cx="11" cy="11" r="8" stroke="#9ca3af" strokeWidth="1.5" />
                                                <path d="M21 21l-4.35-4.35" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                            <p>No tours found matching your criteria.</p>
                                        </div>
                                    )
                            }
                        </div>

                        {/* Pagination */}
                        {!loading && totalPages > 1 && (
                            <div className={styles.pagination}>
                                <button
                                    className={styles.pageBtn}
                                    onClick={() => goToPage(page - 1)}
                                    disabled={page === 1}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                                    const isNear = Math.abs(p - page) <= 1 || p === 1 || p === totalPages;
                                    if (!isNear) {
                                        if (p === page - 2 || p === page + 2) return <span key={p} className={styles.pageDots}>…</span>;
                                        return null;
                                    }
                                    return (
                                        <button
                                            key={p}
                                            className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ""}`}
                                            onClick={() => goToPage(p)}
                                        >
                                            {p}
                                        </button>
                                    );
                                })}

                                <button
                                    className={styles.pageBtn}
                                    onClick={() => goToPage(page + 1)}
                                    disabled={page === totalPages}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}

export default function ToursPage() {
    return (
        <Suspense>
            <ToursContent />
        </Suspense>
    );
}
