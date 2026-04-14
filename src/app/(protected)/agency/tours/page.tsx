"use client";

import { useState } from "react";
import styles from "./page.module.scss";
import TourMapBuilder from "@/components/commons/tour-map-builder/tour-map-builder";

// ── Types ─────────────────────────────────────────────────────────────────────
type TourStatus = "DRAFT" | "ACTIVE" | "INACTIVE";

interface TourStop {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
}

interface ActivityItem {
    id: string;
    type: "service" | "package" | "custom";
    name: string;
    serviceName?: string;
    startTime: string;
    endTime: string;
    price: number;
    note: string;
}

interface StopWithActivities extends TourStop {
    activities: ActivityItem[];
}

interface TourSchedule {
    id: string;
    startTime: string;
    endTime: string;
}

interface Itinerary {
    id: string;
    name: string;
    description: string;
    price: number;
    durationDays: number;
    status: TourStatus;
    stops: { name: string; address: string }[];
    schedules: TourSchedule[];
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_TOURS: Itinerary[] = [
    {
        id: "i1", name: "Ha Long Bay & Wellness Retreat", description: "3-day cruise combining scenic bay views with medical wellness services at top providers.",
        price: 4200000, durationDays: 3, status: "ACTIVE",
        stops: [{ name: "Ha Long Bay", address: "Quảng Ninh" }, { name: "Tuan Chau Island", address: "Hạ Long, Quảng Ninh" }],
        schedules: [
            { id: "s1", startTime: "2026-04-13", endTime: "2026-04-16" },
            { id: "s2", startTime: "2026-05-01", endTime: "2026-05-04" },
        ],
    },
    {
        id: "i2", name: "Sapa Mountain Health Trek", description: "Trek through the misty mountains while enjoying herbal spa and respiratory health checks.",
        price: 3500000, durationDays: 4, status: "ACTIVE",
        stops: [{ name: "Sapa Town", address: "Lào Cai" }, { name: "Fansipan", address: "Sa Pa, Lào Cai" }, { name: "Cat Cat Village", address: "Lào Cai" }],
        schedules: [{ id: "s3", startTime: "2026-04-20", endTime: "2026-04-24" }],
    },
    {
        id: "i3", name: "Hoi An Heritage & Spa Tour", description: "Explore the ancient town by day and unwind with full-body treatments by evening.",
        price: 2800000, durationDays: 2, status: "DRAFT",
        stops: [{ name: "Hoi An Ancient Town", address: "Quảng Nam" }, { name: "An Bang Beach", address: "Hội An, Quảng Nam" }],
        schedules: [],
    },
    {
        id: "i4", name: "Phu Quoc Island Medical Escape", description: "Beach holiday combined with comprehensive health screening packages.",
        price: 5600000, durationDays: 5, status: "ACTIVE",
        stops: [{ name: "Phu Quoc North", address: "Kiên Giang" }, { name: "Phu Quoc South", address: "Kiên Giang" }],
        schedules: [
            { id: "s4", startTime: "2026-04-25", endTime: "2026-04-30" },
            { id: "s5", startTime: "2026-05-15", endTime: "2026-05-20" },
            { id: "s6", startTime: "2026-06-01", endTime: "2026-06-06" },
        ],
    },
    {
        id: "i5", name: "Hanoi Cultural Dental Tour", description: "Visit historic sites while receiving premium dental care from certified providers.",
        price: 1900000, durationDays: 2, status: "INACTIVE",
        stops: [{ name: "Old Quarter", address: "Hoàn Kiếm, Hà Nội" }],
        schedules: [],
    },
];

// ── Mock services & packages for activity picker ──────────────────────────────
const MOCK_SERVICES = [
    { id: "sv1", name: "Full Body Massage",    duration: 90,  price: 450000,  category: "Wellness"  },
    { id: "sv2", name: "Full Blood Panel",     duration: 60,  price: 350000,  category: "Medical"   },
    { id: "sv3", name: "Herbal Steam Bath",    duration: 45,  price: 280000,  category: "Wellness"  },
    { id: "sv4", name: "Dental Cleaning",      duration: 60,  price: 200000,  category: "Dental"    },
    { id: "sv5", name: "Eye Examination",      duration: 30,  price: 150000,  category: "Medical"   },
    { id: "sv6", name: "Deep Tissue Massage",  duration: 60,  price: 380000,  category: "Wellness"  },
    { id: "sv7", name: "Cardiac Screening",    duration: 90,  price: 600000,  category: "Medical"   },
    { id: "sv8", name: "Aromatherapy Facial",  duration: 75,  price: 320000,  category: "Cosmetic"  },
];

const MOCK_PACKAGES = [
    { id: "pk1", name: "Basic Wellness Pack",   services: ["sv1", "sv3"],        price: 680000  },
    { id: "pk2", name: "Full Health Screening", services: ["sv2", "sv5", "sv7"], price: 950000  },
    { id: "pk3", name: "Premium Spa Day",       services: ["sv1", "sv6", "sv8"], price: 1050000 },
    { id: "pk4", name: "Dental & Eye Pack",     services: ["sv4", "sv5"],        price: 320000  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<TourStatus, { label: string; color: string; bg: string; accent: string }> = {
    ACTIVE:   { label: "Active",   color: "#15803d", bg: "#dcfce7", accent: "#22c55e" },
    DRAFT:    { label: "Draft",    color: "#b45309", bg: "#fef3c7", accent: "#f59e0b" },
    INACTIVE: { label: "Inactive", color: "#6b7280", bg: "#f3f4f6", accent: "#d1d5db" },
};

function fmtPrice(n: number) { return n.toLocaleString("vi-VN") + " ₫"; }
function fmtDate(s: string) {
    const d = new Date(s + "T00:00:00");
    return d.toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
}
function uid() { return Math.random().toString(36).slice(2); }

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AgencyToursPage() {
    const [tours, setTours] = useState<Itinerary[]>(MOCK_TOURS);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<TourStatus | "">("");

    // Schedule modal
    const [schedTarget, setSchedTarget] = useState<Itinerary | null>(null);
    const [schedStart, setSchedStart] = useState("");
    const [schedEnd,   setSchedEnd]   = useState("");
    const [schedErr,   setSchedErr]   = useState("");

    // Wizard modal
    const [wizOpen, setWizOpen]   = useState(false);
    const [wizStep, setWizStep]   = useState(1);
    // step1
    const [wName, setWName]       = useState("");
    const [wDesc, setWDesc]       = useState("");
    const [wPrice, setWPrice]     = useState("");
    const [wDays, setWDays]       = useState("");
    const [wStatus, setWStatus]   = useState<TourStatus>("DRAFT");
    // step 2 – map itinerary
    const [wStops, setWStops]     = useState<StopWithActivities[]>([]);
    // pending stop (when user clicks the map)
    const [pendingMarker, setPendingMarker]         = useState<{ lat: number; lng: number } | null>(null);
    const [pendingName, setPendingName]             = useState("");
    const [pendingAddress, setPendingAddress]       = useState("");
    const [pendingAddrLoading, setPendingAddrLoading] = useState(false);
    // activity sub-modal
    const [actTarget, setActTarget] = useState<string | null>(null); // stopId
    const [actType, setActType]     = useState<"service"|"package"|"custom">("service");
    const [actServiceId, setActServiceId] = useState("");
    const [actPackageId, setActPackageId] = useState("");
    const [actCustomName, setActCustomName] = useState("");
    const [actStart, setActStart]   = useState("");
    const [actEnd, setActEnd]       = useState("");
    const [actPrice, setActPrice]   = useState("");
    const [actNote, setActNote]     = useState("");

    // Filtered tours
    const filtered = tours.filter(t => {
        const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !statusFilter || t.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const stats = {
        total:     tours.length,
        active:    tours.filter(t => t.status === "ACTIVE").length,
        draft:     tours.filter(t => t.status === "DRAFT").length,
        schedules: tours.reduce((acc, t) => acc + t.schedules.length, 0),
    };

    // ── Schedule handlers ────────────────────────────────────────────────────
    function openSched(tour: Itinerary) {
        setSchedTarget(tour);
        setSchedStart("");
        setSchedEnd("");
        setSchedErr("");
    }

    function submitSched() {
        if (!schedStart || !schedEnd) { setSchedErr("Please select both start and end dates."); return; }
        if (schedEnd <= schedStart)   { setSchedErr("End date must be after start date."); return; }
        setTours(prev => prev.map(t =>
            t.id === schedTarget!.id
                ? { ...t, schedules: [...t.schedules, { id: uid(), startTime: schedStart, endTime: schedEnd }] }
                : t
        ));
        setSchedTarget(null);
    }

    // ── Wizard helpers ───────────────────────────────────────────────────────
    function handleMapClick(lat: number, lng: number) {
        setPendingMarker({ lat, lng });
        setPendingName("");
        setPendingAddress("");
        setPendingAddrLoading(true);
        fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { headers: { "Accept-Language": "vi,en" } }
        )
            .then(r => r.json())
            .then(data => {
                if (data?.address) {
                    const parts = [
                        data.address.road || data.address.suburb || data.address.neighbourhood,
                        data.address.city || data.address.town || data.address.county,
                        data.address.state,
                    ].filter(Boolean);
                    setPendingAddress(parts.join(", "));
                } else if (data?.display_name) {
                    setPendingAddress(data.display_name.split(",").slice(0, 3).join(",").trim());
                }
            })
            .catch(() => {})
            .finally(() => setPendingAddrLoading(false));
    }

    function confirmPendingStop() {
        if (!pendingMarker || !pendingName.trim()) return;
        setWStops(prev => [...prev, {
            id: uid(),
            name: pendingName.trim(),
            address: pendingAddress.trim(),
            latitude: pendingMarker.lat,
            longitude: pendingMarker.lng,
            activities: [],
        }]);
        setPendingMarker(null);
        setPendingName("");
        setPendingAddress("");
    }

    function removeStop(id: string) { setWStops(prev => prev.filter(s => s.id !== id)); }

    function openAddActivity(stopId: string) {
        setActTarget(stopId);
        setActType("service");
        setActServiceId("");
        setActPackageId("");
        setActCustomName("");
        setActStart("");
        setActEnd("");
        setActPrice("");
        setActNote("");
    }

    function confirmAddActivity() {
        if (!actTarget) return;
        const stopIdx = wStops.findIndex(s => s.id === actTarget);
        if (stopIdx === -1) return;
        const newActs: ActivityItem[] = [];

        if (actType === "service" && actServiceId) {
            const svc = MOCK_SERVICES.find(s => s.id === actServiceId)!;
            newActs.push({ id: uid(), type: "service", name: svc.name, startTime: actStart, endTime: actEnd, price: Number(actPrice) || svc.price, note: actNote });
        } else if (actType === "package" && actPackageId) {
            const pkg = MOCK_PACKAGES.find(p => p.id === actPackageId)!;
            pkg.services.forEach((svId, idx) => {
                const svc = MOCK_SERVICES.find(s => s.id === svId)!;
                newActs.push({ id: uid(), type: "package", name: svc.name, serviceName: pkg.name, startTime: actStart, endTime: actEnd, price: svc.price, note: actNote });
            });
        } else if (actType === "custom" && actCustomName) {
            newActs.push({ id: uid(), type: "custom", name: actCustomName, startTime: actStart, endTime: actEnd, price: Number(actPrice) || 0, note: actNote });
        }

        if (!newActs.length) return;
        setWStops(prev => prev.map(s =>
            s.id === actTarget ? { ...s, activities: [...s.activities, ...newActs] } : s
        ));
        setActTarget(null);
    }

    function removeActivity(stopId: string, actId: string) {
        setWStops(prev => prev.map(s =>
            s.id === stopId ? { ...s, activities: s.activities.filter(a => a.id !== actId) } : s
        ));
    }

    function submitWizard() {
        setTours(prev => [{
            id: uid(),
            name: wName,
            description: wDesc,
            price: Number(wPrice) || 0,
            durationDays: Number(wDays) || 1,
            status: wStatus,
            stops: wStops.map(s => ({ name: s.name, address: s.address })),
            schedules: [],
        }, ...prev]);
        setWizOpen(false);
        setWizStep(1);
        setWName(""); setWDesc(""); setWPrice(""); setWDays(""); setWStatus("DRAFT");
        setWStops([]);
        setPendingMarker(null); setPendingName(""); setPendingAddress("");
    }

    const ACTIVITY_TYPE_COLOR: Record<string, { bg: string; color: string }> = {
        service: { bg: "#eff6ff", color: "#3b82f6" },
        package: { bg: "#f5f3ff", color: "#7c3aed" },
        custom:  { bg: "#f0fdf4", color: "#16a34a" },
    };

    return (
        <div className={styles.page}>

            {/* ── Stats ── */}
            <div className={styles.statsRow}>
                {[
                    { label: "Total Tours",      value: stats.total,     bg: "#eff6ff", color: "#3b82f6",
                      icon: <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8"/></svg> },
                    { label: "Active Tours",     value: stats.active,    bg: "#f0fdf4", color: "#16a34a",
                      icon: <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                    { label: "Drafts",           value: stats.draft,     bg: "#fffbeb", color: "#d97706",
                      icon: <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
                    { label: "Upcoming Schedules", value: stats.schedules, bg: "#f5f3ff", color: "#7c3aed",
                      icon: <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
                ].map(s => (
                    <div key={s.label} className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                        <div className={styles.statBody}>
                            <p className={styles.statLabel}>{s.label}</p>
                            <p className={styles.statValue}>{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Top bar ── */}
            <div className={styles.topBar}>
                <div className={styles.topLeft}>
                    <div className={styles.searchBox}>
                        <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                        <input placeholder="Search tours…" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value as TourStatus | "")}>
                        <option value="">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="DRAFT">Draft</option>
                        <option value="INACTIVE">Inactive</option>
                    </select>
                </div>
                <button className={styles.addBtn} onClick={() => { setWizOpen(true); setWizStep(1); }}>
                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                    New Tour
                </button>
            </div>

            {/* ── Tour cards ── */}
            <div className={styles.tourGrid}>
                {filtered.map(tour => {
                    const cfg = STATUS_CFG[tour.status];
                    const upcomingCount = tour.schedules.filter(s => new Date(s.endTime) >= new Date()).length;
                    return (
                        <div key={tour.id} className={styles.tourCard} style={{ borderTop: `3px solid ${cfg.accent}` }}>

                            {/* ── Head: name + badge + description ── */}
                            <div className={styles.tourCardHead}>
                                <div className={styles.tourCardTopRow}>
                                    <h3 className={styles.tourName}>{tour.name}</h3>
                                    <span className={styles.statusBadge} style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                                </div>
                                {tour.description && <p className={styles.tourDesc}>{tour.description}</p>}
                            </div>

                            {/* ── Meta pills ── */}
                            <div className={styles.tourMeta}>
                                <span className={styles.tourMetaItem}>
                                    <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                    {tour.durationDays} days
                                </span>
                                <span className={styles.tourMetaItem}>
                                    <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                    {fmtPrice(tour.price)}
                                </span>
                                <span className={styles.tourMetaItem}>
                                    <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
                                    {tour.stops.length} {tour.stops.length === 1 ? "stop" : "stops"}
                                </span>
                                {upcomingCount > 0 && (
                                    <span className={styles.tourMetaItem} style={{ marginLeft: "auto", background: "#f5f3ff", border: "1px solid #ede9fe", color: "#6d28d9" }}>
                                        <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                        {upcomingCount} upcoming
                                    </span>
                                )}
                            </div>

                            {/* ── Stop route chips ── */}
                            {tour.stops.length > 0 && (
                                <div className={styles.tourStops}>
                                    {tour.stops.map((s, i) => (
                                        <div key={s.name} className={styles.stopChipWrapper}>
                                            <span className={styles.stopChipNum}>{i + 1}</span>
                                            <span className={styles.stopChipName}>{s.name}</span>
                                            {i < tour.stops.length - 1 && (
                                                <span className={styles.stopArrow}>
                                                    <svg viewBox="0 0 16 8" fill="none" width="16" height="8">
                                                        <path d="M0 4h14M10 1l4 3-4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ── Actions footer ── */}
                            <div className={styles.tourCardActions}>
                                <button className={styles.actionBtn}>
                                    <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
                                    View
                                </button>
                                <button className={styles.actionBtn}>
                                    <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                    Edit
                                </button>
                                <button className={`${styles.actionBtn} ${styles.actionBtnGreen}`} onClick={() => openSched(tour)}>
                                    <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                    + Schedule
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ════════════════ SCHEDULE MODAL ════════════════ */}
            {schedTarget && (
                <div className={styles.overlay} onClick={() => setSchedTarget(null)}>
                    <div className={styles.schedModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h3 className={styles.modalTitle}>Add Schedule</h3>
                                <p className={styles.modalSubtitle}>{schedTarget.name}</p>
                            </div>
                            <button className={styles.modalCloseBtn} onClick={() => setSchedTarget(null)}>
                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <p style={{ fontSize:13, color:"#6b7280", margin:0 }}>
                                Set the departure and return dates for this tour run. Guests will see this as an available booking slot.
                            </p>
                            <div className={styles.fieldRow}>
                                <div className={styles.field}>
                                    <label className={styles.label}>Departure Date <span className={styles.required}>*</span></label>
                                    <input className={`${styles.input} ${schedErr && !schedStart ? styles.inputError : ""}`} type="date" value={schedStart} onChange={e => { setSchedStart(e.target.value); setSchedErr(""); }} />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>Return Date <span className={styles.required}>*</span></label>
                                    <input className={`${styles.input} ${schedErr && !schedEnd ? styles.inputError : ""}`} type="date" value={schedEnd} min={schedStart} onChange={e => { setSchedEnd(e.target.value); setSchedErr(""); }} />
                                </div>
                            </div>
                            {schedStart && schedEnd && (
                                <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:9, padding:"10px 14px", fontSize:13, color:"#15803d", display:"flex", alignItems:"center", gap:7 }}>
                                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                    Duration: {Math.ceil((new Date(schedEnd).getTime() - new Date(schedStart).getTime()) / 86400000)} days
                                </div>
                            )}
                            {schedErr && <p className={styles.errorMsg}>{schedErr}</p>}
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.btnCancel} onClick={() => setSchedTarget(null)}>Cancel</button>
                            <button className={styles.btnSubmit} onClick={submitSched}>
                                <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                                Add Schedule
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════ CREATE TOUR WIZARD ════════════════ */}
            {wizOpen && (
                <div className={styles.overlay} onClick={() => setWizOpen(false)}>
                    <div className={styles.wizardModal} onClick={e => e.stopPropagation()}>

                        {/* Step bar */}
                        <div className={styles.wizardSteps}>
                            {[
                                { n:1, label:"Basic Info"    },
                                { n:2, label:"Itinerary Map" },
                                { n:3, label:"Review"        },
                            ].map((s, i, arr) => (
                                <div key={s.n} className={styles.wizardStep}>
                                    <div className={`${styles.stepCircle} ${wizStep > s.n ? styles.stepCircleDone : wizStep === s.n ? styles.stepCircleActive : ""}`}>
                                        {wizStep > s.n
                                            ? <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                            : s.n
                                        }
                                    </div>
                                    <span className={`${styles.stepLabel} ${wizStep > s.n ? styles.stepLabelDone : wizStep === s.n ? styles.stepLabelActive : ""}`}>{s.label}</span>
                                    {i < arr.length - 1 && <div className={`${styles.stepLine} ${wizStep > s.n ? styles.stepLineDone : ""}`} />}
                                </div>
                            ))}
                        </div>

                        {/* ── Step 1: Basic Info ── */}
                        {wizStep === 1 && (
                            <div className={styles.wizardBody}>
                                <div>
                                    <p className={styles.stepTitle}>Basic Information</p>
                                    <p className={styles.stepSubtitle}>Give your itinerary a name, description, duration and price.</p>
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>Tour Name <span className={styles.required}>*</span></label>
                                    <input className={styles.input} placeholder="e.g. Ha Long Bay Wellness Retreat" value={wName} onChange={e => setWName(e.target.value)} />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>Description</label>
                                    <textarea className={styles.textarea} placeholder="Briefly describe this tour…" rows={3} value={wDesc} onChange={e => setWDesc(e.target.value)} />
                                </div>
                                <div className={styles.fieldRow}>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Price (₫) <span className={styles.required}>*</span></label>
                                        <input className={styles.input} type="number" min="0" placeholder="3500000" value={wPrice} onChange={e => setWPrice(e.target.value)} />
                                    </div>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Duration (days) <span className={styles.required}>*</span></label>
                                        <input className={styles.input} type="number" min="1" placeholder="3" value={wDays} onChange={e => setWDays(e.target.value)} />
                                    </div>
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>Initial Status</label>
                                    <select className={`${styles.input} ${styles.select}`} value={wStatus} onChange={e => setWStatus(e.target.value as TourStatus)}>
                                        <option value="DRAFT">Draft — not visible to customers</option>
                                        <option value="ACTIVE">Active — visible and bookable</option>
                                        <option value="INACTIVE">Inactive — hidden</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* ── Step 2: Itinerary Map ── */}
                        {wizStep === 2 && (
                            <div className={styles.wizardBodyFull}>
                                <div className={styles.mapItineraryStep}>
                                    <div>
                                        <p className={styles.stepTitle}>Build Your Itinerary</p>
                                        <p className={styles.stepSubtitle}>Click on the map to add stops. For each stop, add services or packages as activities.</p>
                                    </div>
                                    <div className={styles.mapItineraryContent}>
                                        {/* Left: interactive map */}
                                        <TourMapBuilder
                                            stops={wStops.map(s => ({ id: s.id, name: s.name, latitude: s.latitude, longitude: s.longitude }))}
                                            onMapClick={handleMapClick}
                                        />

                                        {/* Right: stops panel */}
                                        <div className={styles.stopsScrollPanel}>
                                            {wStops.length === 0 ? (
                                                <div className={styles.emptyStopsHint}>
                                                    <svg viewBox="0 0 24 24" fill="none" width="28" height="28"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6"/></svg>
                                                    <p>No stops yet</p>
                                                    <p>Click anywhere on the map to pin your first stop</p>
                                                </div>
                                            ) : (
                                                wStops.map((stop, idx) => (
                                                    <div key={stop.id} className={styles.stopPanelCard}>
                                                        <div className={styles.stopPanelHead}>
                                                            <span className={styles.stopNumBadge}>{idx + 1}</span>
                                                            <div className={styles.stopPanelInfo}>
                                                                <p className={styles.stopPanelName}>{stop.name}</p>
                                                                {stop.address && <p className={styles.stopPanelAddr}>{stop.address}</p>}
                                                            </div>
                                                            <button className={styles.stopDeleteBtn} onClick={() => removeStop(stop.id)}>
                                                                <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                                                            </button>
                                                        </div>
                                                        {stop.activities.length > 0 && (
                                                            <div className={styles.stopPanelActivities}>
                                                                {stop.activities.map(act => {
                                                                    const tc = ACTIVITY_TYPE_COLOR[act.type];
                                                                    return (
                                                                        <div key={act.id} className={styles.stopPanelActivity}>
                                                                            <span style={{ background: tc.bg, color: tc.color, fontSize: 9.5, fontWeight: 700, padding: "1px 6px", borderRadius: 4, flexShrink: 0, textTransform: "uppercase" }}>{act.type}</span>
                                                                            <span className={styles.stopPanelActivityName}>{act.name}</span>
                                                                            {(act.startTime || act.endTime) && (
                                                                                <span className={styles.stopPanelActivityTime}>
                                                                                    {act.startTime || "?"}{act.endTime ? `–${act.endTime}` : ""}
                                                                                </span>
                                                                            )}
                                                                            <button className={styles.stopPanelActivityDelete} onClick={() => removeActivity(stop.id, act.id)}>
                                                                                <svg viewBox="0 0 24 24" fill="none" width="11" height="11"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                        <button className={styles.stopPanelAddActBtn} onClick={() => openAddActivity(stop.id)}>
                                                            <svg viewBox="0 0 24 24" fill="none" width="11" height="11"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                                                            Add Activity
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Step 3: Review ── */}
                        {wizStep === 3 && (
                            <div className={styles.wizardBody}>
                                <div>
                                    <p className={styles.stepTitle}>Review & Create</p>
                                    <p className={styles.stepSubtitle}>Double-check everything before creating the tour.</p>
                                </div>
                                <div className={styles.reviewSection}>
                                    <p className={styles.reviewSectionTitle}>
                                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.8"/></svg>
                                        Basic Info
                                    </p>
                                    <div className={styles.reviewRow}><span className={styles.reviewKey}>Name</span><span className={styles.reviewVal}>{wName || "—"}</span></div>
                                    <div className={styles.reviewRow}><span className={styles.reviewKey}>Duration</span><span className={styles.reviewVal}>{wDays || "—"} days</span></div>
                                    <div className={styles.reviewRow}><span className={styles.reviewKey}>Price</span><span className={styles.reviewVal}>{wPrice ? fmtPrice(Number(wPrice)) : "—"}</span></div>
                                    <div className={styles.reviewRow}><span className={styles.reviewKey}>Status</span><span className={styles.reviewVal}>{wStatus}</span></div>
                                </div>
                                <div className={styles.reviewSection}>
                                    <p className={styles.reviewSectionTitle}>
                                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
                                        Itinerary ({wStops.length} stops)
                                    </p>
                                    {wStops.map((s, i) => (
                                        <div key={s.id} className={styles.reviewStop}>
                                            <span className={styles.reviewStopNum}>{i + 1}</span>
                                            <div className={styles.reviewStopInfo}>
                                                <p className={styles.reviewStopName}>{s.name || `Stop ${i + 1}`}</p>
                                                {s.address && <p className={styles.reviewStopAddr}>{s.address}</p>}
                                                {s.activities.map(a => (
                                                    <p key={a.id} className={styles.reviewActivity}>
                                                        <svg viewBox="0 0 24 24" fill="none" width="10" height="10"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                                        {a.name} {a.price > 0 ? `— ${fmtPrice(a.price)}` : ""}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {wStops.length === 0 && <p style={{ fontSize:13, color:"#9ca3af" }}>No stops added.</p>}
                                </div>
                            </div>
                        )}

                        {/* Wizard footer */}
                        <div className={styles.wizardFooter}>
                            <button className={styles.btnBack} onClick={() => { if (wizStep > 1) setWizStep(s => s - 1); else setWizOpen(false); }}>
                                <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                {wizStep === 1 ? "Cancel" : "Back"}
                            </button>
                            <div className={styles.wizardFooterRight}>
                                <span style={{ fontSize:12, color:"#9ca3af" }}>Step {wizStep} of 3</span>
                                {wizStep < 3
                                    ? <button className={styles.btnNext} onClick={() => setWizStep(s => s + 1)} disabled={wizStep === 1 && !wName.trim()}>
                                        Next
                                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                      </button>
                                    : <button className={styles.btnNext} onClick={submitWizard}>
                                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                        Create Tour
                                      </button>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════ ADD ACTIVITY SUB-MODAL ════════════════ */}
            {actTarget && (
                <div className={styles.overlay} style={{ zIndex:500 }} onClick={() => setActTarget(null)}>
                    <div className={styles.activityModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h3 className={styles.modalTitle}>Add Activity</h3>
                                <p className={styles.modalSubtitle}>{wStops.find(s => s.id === actTarget)?.name || "Stop"}</p>
                            </div>
                            <button className={styles.modalCloseBtn} onClick={() => setActTarget(null)}>
                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                            </button>
                        </div>
                        <div className={styles.modalBody} style={{ overflowY:"auto", maxHeight:"55vh" }}>
                            {/* Type tabs */}
                            <div className={styles.activityTypeTabs}>
                                {(["service","package","custom"] as const).map(t => (
                                    <button key={t} className={`${styles.activityTypeTab} ${actType === t ? styles.activityTypeTabActive : ""}`} onClick={() => setActType(t)}>
                                        {t === "service" ? "Service" : t === "package" ? "Package" : "Custom"}
                                    </button>
                                ))}
                            </div>
                            <p style={{ fontSize:11.5, color:"#9ca3af", margin:"4px 0 12px" }}>
                                {actType === "service" && "Pick a single provider service"}
                                {actType === "package" && "Pick a package — all included services will be added at once"}
                                {actType === "custom" && "Add a custom activity (meal, sightseeing, transfer, etc.)"}
                            </p>

                            {/* Service picker */}
                            {actType === "service" && (
                                <div className={styles.field}>
                                    <label className={styles.label}>Select Service</label>
                                    <div className={styles.serviceGrid}>
                                        {MOCK_SERVICES.map(svc => (
                                            <div key={svc.id} className={`${styles.serviceOption} ${actServiceId === svc.id ? styles.serviceOptionSelected : ""}`} onClick={() => setActServiceId(svc.id)}>
                                                <p className={styles.serviceOptName}>{svc.name}</p>
                                                <p className={styles.serviceOptMeta}>{svc.category} · {svc.duration} min · {fmtPrice(svc.price)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Package picker */}
                            {actType === "package" && (
                                <div className={styles.field}>
                                    <label className={styles.label}>Select Package</label>
                                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                                        {MOCK_PACKAGES.map(pkg => {
                                            const svcNames = pkg.services.map(id => MOCK_SERVICES.find(s => s.id === id)?.name).join(", ");
                                            return (
                                                <div key={pkg.id} className={`${styles.serviceOption} ${actPackageId === pkg.id ? styles.serviceOptionSelected : ""}`} onClick={() => setActPackageId(pkg.id)} style={{ gridColumn:"1/-1" }}>
                                                    <p className={styles.serviceOptName}>{pkg.name} — {fmtPrice(pkg.price)}</p>
                                                    <p className={styles.serviceOptMeta}>{svcNames}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Custom */}
                            {actType === "custom" && (
                                <div className={styles.field}>
                                    <label className={styles.label}>Activity Name <span className={styles.required}>*</span></label>
                                    <input className={styles.input} placeholder="e.g. Lunch at local restaurant" value={actCustomName} onChange={e => setActCustomName(e.target.value)} />
                                </div>
                            )}

                            {/* Time + price + note */}
                            <div className={styles.fieldRow} style={{ marginTop:12 }}>
                                <div className={styles.field}>
                                    <label className={styles.label}>Start Time</label>
                                    <input className={styles.input} type="time" value={actStart} onChange={e => setActStart(e.target.value)} />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>End Time</label>
                                    <input className={styles.input} type="time" value={actEnd} onChange={e => setActEnd(e.target.value)} />
                                </div>
                            </div>
                            {actType !== "package" && (
                                <div className={styles.field}>
                                    <label className={styles.label}>Price (₫) {actType === "service" && <span className={styles.hint}>— leave blank to use service default</span>}</label>
                                    <input className={styles.input} type="number" min="0" placeholder="0" value={actPrice} onChange={e => setActPrice(e.target.value)} />
                                </div>
                            )}
                            <div className={styles.field}>
                                <label className={styles.label}>Note</label>
                                <input className={styles.input} placeholder="Optional note for this activity" value={actNote} onChange={e => setActNote(e.target.value)} />
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.btnCancel} onClick={() => setActTarget(null)}>Cancel</button>
                            <button className={styles.btnSubmit}
                                disabled={actType === "service" ? !actServiceId : actType === "package" ? !actPackageId : !actCustomName}
                                onClick={confirmAddActivity}>
                                <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                                Add to Stop
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ════════════════ PENDING STOP DIALOG ════════════════ */}
            {pendingMarker && (
                <div className={styles.overlay} style={{ zIndex: 600 }} onClick={() => setPendingMarker(null)}>
                    <div className={styles.pendingStopModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h3 className={styles.modalTitle}>New Stop</h3>
                                <p className={styles.modalSubtitle}>
                                    {pendingMarker.lat.toFixed(5)}, {pendingMarker.lng.toFixed(5)}
                                </p>
                            </div>
                            <button className={styles.modalCloseBtn} onClick={() => setPendingMarker(null)}>
                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.field}>
                                <label className={styles.label}>Stop Name <span className={styles.required}>*</span></label>
                                <input
                                    className={styles.input}
                                    placeholder="e.g. Ha Long Bay"
                                    value={pendingName}
                                    onChange={e => setPendingName(e.target.value)}
                                    onKeyDown={e => { if (e.key === "Enter" && pendingName.trim()) confirmPendingStop(); }}
                                    autoFocus
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>
                                    Address / Location
                                    {pendingAddrLoading && <span style={{ color:"#9ca3af", fontWeight:400, marginLeft:6 }}>— detecting…</span>}
                                </label>
                                <input
                                    className={styles.input}
                                    placeholder="e.g. Quảng Ninh, Vietnam"
                                    value={pendingAddress}
                                    onChange={e => setPendingAddress(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.btnCancel} onClick={() => setPendingMarker(null)}>Cancel</button>
                            <button
                                className={styles.btnSubmit}
                                disabled={!pendingName.trim()}
                                onClick={confirmPendingStop}
                            >
                                <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                                Add Stop
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
