"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import styles from "./page.module.scss";

// ── Types ─────────────────────────────────────────────────────────────────────
type TourStatus = "confirmed" | "pending" | "completed" | "cancelled";

interface Tour {
    id: string;
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    departureTime: string;
    pax: number;
    category: string;
    status: TourStatus;
}

// ── Config ────────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<TourStatus, { label: string; color: string; bg: string; border: string; cardBg: string; cardText: string }> = {
    confirmed: { label: "Confirmed", color: "#065f46", bg: "#d1fae5", border: "#10b981", cardBg: "#ecfdf5", cardText: "#065f46" },
    pending:   { label: "Pending",   color: "#92400e", bg: "#fef3c7", border: "#f59e0b", cardBg: "#fffbeb", cardText: "#92400e" },
    completed: { label: "Done",      color: "#1e40af", bg: "#dbeafe", border: "#3b82f6", cardBg: "#eff6ff", cardText: "#1e40af" },
    cancelled: { label: "Cancelled", color: "#991b1b", bg: "#fee2e2", border: "#ef4444", cardBg: "#fef2f2", cardText: "#991b1b" },
};

const FILTER_OPTIONS = ["All Status", "Confirmed", "Pending", "Completed", "Cancelled"];
const MONTHS   = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEKDAYS = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];

// ── Mock data ─────────────────────────────────────────────────────────────────
const now = new Date();
const Y = now.getFullYear();
const M = now.getMonth() + 1;
const TD = now.getDate();

function mkd(day: number, m = M) {
    return `${Y}-${String(m).padStart(2,"0")}-${String(Math.max(1,day)).padStart(2,"0")}`;
}

const MOCK_TOURS: Tour[] = [
    { id:"t1",  name:"Ha Long Bay Explorer",   destination:"Ha Long Bay",    startDate:mkd(TD),    endDate:mkd(TD+3),   departureTime:"07:00 AM", pax:24, category:"Nature",   status:"confirmed" },
    { id:"t2",  name:"Sapa Cultural Trek",      destination:"Sapa",           startDate:mkd(TD),    endDate:mkd(TD+2),   departureTime:"06:30 AM", pax:12, category:"Culture",  status:"pending"   },
    { id:"t3",  name:"Hue Imperial Heritage",   destination:"Hue",            startDate:mkd(TD),    endDate:mkd(TD+1),   departureTime:"08:00 AM", pax:18, category:"History",  status:"confirmed" },
    { id:"t4",  name:"Hoi An Ancient Town",     destination:"Hoi An",         startDate:mkd(TD+2),  endDate:mkd(TD+4),   departureTime:"09:00 AM", pax:30, category:"Culture",  status:"confirmed" },
    { id:"t5",  name:"Phu Quoc Beach Escape",   destination:"Phu Quoc",       startDate:mkd(TD+2),  endDate:mkd(TD+5),   departureTime:"10:00 AM", pax:20, category:"Beach",    status:"pending"   },
    { id:"t6",  name:"Mekong Delta Cruise",     destination:"Mekong Delta",   startDate:mkd(TD+5),  endDate:mkd(TD+7),   departureTime:"07:30 AM", pax:15, category:"Nature",   status:"pending"   },
    { id:"t7",  name:"Da Nang Coast Ride",      destination:"Da Nang",        startDate:mkd(TD+5),  endDate:mkd(TD+6),   departureTime:"08:30 AM", pax:10, category:"Beach",    status:"confirmed" },
    { id:"t8",  name:"Ninh Binh Boat Tour",     destination:"Ninh Binh",      startDate:mkd(TD+8),  endDate:mkd(TD+9),   departureTime:"06:00 AM", pax:22, category:"Nature",   status:"confirmed" },
    { id:"t9",  name:"Hanoi City Discovery",    destination:"Hanoi",          startDate:mkd(TD+10), endDate:mkd(TD+11),  departureTime:"09:30 AM", pax:16, category:"City",     status:"pending"   },
    { id:"t10", name:"Old Quarter Food Walk",   destination:"Hanoi",          startDate:mkd(TD-4),  endDate:mkd(TD-2),   departureTime:"05:30 PM", pax:8,  category:"Food",     status:"completed" },
    { id:"t11", name:"Con Dao Island Trip",     destination:"Con Dao",        startDate:mkd(TD-2),  endDate:mkd(TD-1),   departureTime:"07:00 AM", pax:14, category:"Beach",    status:"completed" },
    { id:"t12", name:"Phong Nha Cave Trek",     destination:"Phong Nha",      startDate:mkd(TD+13), endDate:mkd(TD+15),  departureTime:"07:00 AM", pax:12, category:"Nature",   status:"confirmed" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const parseDate = (s: string) => new Date(s + "T00:00:00");
const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const inRange   = (d: Date, s: Date, e: Date) => d >= s && d <= e;

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AgencyToursPage() {
    const today = useMemo(() => new Date(), []);

    const [curYear,  setCurYear]  = useState(today.getFullYear());
    const [curMonth, setCurMonth] = useState(today.getMonth());
    const [filter,   setFilter]   = useState("All Status");
    const [filterOpen, setFilterOpen] = useState(false);
    const [popup, setPopup] = useState<{ date: Date; tours: Tour[]; x: number; y: number } | null>(null);

    const filterRef = useRef<HTMLDivElement>(null);
    const popupRef  = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
            if (popupRef.current && !popupRef.current.contains(e.target as Node) && popup) setPopup(null);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [popup]);

    // ── Grid cells ────────────────────────────────────────────────────────────
    const cells = useMemo(() => {
        const firstDay = new Date(curYear, curMonth, 1).getDay();
        const daysInMo = new Date(curYear, curMonth + 1, 0).getDate();
        const prevDays = new Date(curYear, curMonth, 0).getDate();
        const arr: { day: number; thisMonth: boolean; date: Date }[] = [];
        for (let i = 0; i < firstDay; i++) {
            const day = prevDays - firstDay + 1 + i;
            arr.push({ day, thisMonth: false, date: new Date(curYear, curMonth - 1, day) });
        }
        for (let i = 1; i <= daysInMo; i++)
            arr.push({ day: i, thisMonth: true, date: new Date(curYear, curMonth, i) });
        const rem = 42 - arr.length;
        for (let i = 1; i <= rem; i++)
            arr.push({ day: i, thisMonth: false, date: new Date(curYear, curMonth + 1, i) });
        return arr;
    }, [curYear, curMonth]);

    function prevMonth() {
        if (curMonth === 0) { setCurYear(y => y - 1); setCurMonth(11); }
        else setCurMonth(m => m - 1);
    }
    function nextMonth() {
        if (curMonth === 11) { setCurYear(y => y + 1); setCurMonth(0); }
        else setCurMonth(m => m + 1);
    }

    const todayColIndex = today.getDay();
    const isCurrentMonthView = curYear === today.getFullYear() && curMonth === today.getMonth();

    function toursOnDate(date: Date): Tour[] {
        const statusFilter = filter === "All Status" ? null : filter.toLowerCase() as TourStatus;
        return MOCK_TOURS.filter(t => {
            const inDay = inRange(date, parseDate(t.startDate), parseDate(t.endDate));
            if (!inDay) return false;
            if (statusFilter && t.status !== statusFilter) return false;
            return true;
        });
    }

    // Right panel: upcoming tours (next 7 days, sorted)
    const upcoming = useMemo(() =>
        MOCK_TOURS
            .filter(t => {
                const start = parseDate(t.startDate);
                return start >= today && (filter === "All Status" || t.status === filter.toLowerCase());
            })
            .sort((a, b) => parseDate(a.startDate).getTime() - parseDate(b.startDate).getTime())
            .slice(0, 8)
    , [filter, today]);

    const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    return (
        <div className={styles.page}>

            {/* ── Top bar ── */}
            <div className={styles.topBar}>
                <div className={styles.topLeft}>
                    {/* Status filter */}
                    <div className={styles.filterWrap} ref={filterRef}>
                        <button
                            className={styles.filterBtn}
                            onClick={() => setFilterOpen(o => !o)}
                        >
                            {filter}
                            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                        {filterOpen && (
                            <div className={styles.filterDropdown}>
                                {FILTER_OPTIONS.map(opt => (
                                    <button
                                        key={opt}
                                        className={`${styles.filterOpt} ${filter === opt ? styles.filterOptActive : ""}`}
                                        onClick={() => { setFilter(opt); setFilterOpen(false); }}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Month nav */}
                    <div className={styles.monthNav}>
                        <button className={styles.arrowBtn} onClick={prevMonth}>
                            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                        <span className={styles.monthLabel}>
                            {MONTHS[curMonth]} {curYear}
                            <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </span>
                        <button className={styles.arrowBtn} onClick={nextMonth}>
                            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div className={styles.topRight}>
                    <button
                        className={styles.todayBtn}
                        onClick={() => { setCurYear(today.getFullYear()); setCurMonth(today.getMonth()); }}
                    >
                        Today
                    </button>
                    <button className={styles.addBtn}>
                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                        </svg>
                        New Tour
                    </button>
                </div>
            </div>

            {/* ── Body ── */}
            <div className={styles.body}>

                {/* ══ Calendar ══ */}
                <div className={styles.calWrap}>
                    {/* Weekday headers */}
                    <div className={styles.weekRow}>
                        {WEEKDAYS.map((w, i) => {
                            const isToday = isCurrentMonthView && i === todayColIndex;
                            return (
                                <div key={w} className={`${styles.weekHead} ${isToday ? styles.weekHeadToday : ""}`}>
                                    {isToday ? <span className={styles.todayPill}>{w}</span> : w}
                                </div>
                            );
                        })}
                    </div>

                    {/* Grid */}
                    <div className={styles.grid}>
                        {cells.map((cell, idx) => {
                            const colIndex   = idx % 7;
                            const isToday    = isSameDay(cell.date, today);
                            const isTodayCol = isCurrentMonthView && colIndex === todayColIndex;
                            const tours      = toursOnDate(cell.date);
                            const visible    = tours.slice(0, 1);
                            const more       = tours.length - 1;

                            return (
                                <div
                                    key={idx}
                                    className={[
                                        styles.cell,
                                        !cell.thisMonth ? styles.cellOther : "",
                                        isTodayCol      ? styles.cellTodayCol : "",
                                    ].join(" ")}
                                >
                                    <div className={styles.cellHead}>
                                        <span className={styles.addNew}>Add New</span>
                                        <span className={`${styles.dayNum} ${isToday ? styles.dayNumToday : ""}`}>
                                            {cell.day}
                                        </span>
                                    </div>

                                    <div className={styles.events}>
                                        {visible.map(tour => {
                                            const cfg = STATUS_CFG[tour.status];
                                            const isStart = isSameDay(cell.date, parseDate(tour.startDate));
                                            return (
                                                <div
                                                    key={tour.id}
                                                    className={styles.tourCard}
                                                    style={{ background: cfg.cardBg, color: cfg.cardText, borderLeftColor: cfg.border }}
                                                >
                                                    <span className={styles.tourCardTime}>
                                                        <svg viewBox="0 0 24 24" fill="none" width="9" height="9">
                                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                                            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                                        </svg>
                                                        {isStart ? tour.departureTime : "In tour"}
                                                    </span>
                                                    <span className={styles.tourCardName}>{tour.name}</span>
                                                    <span className={styles.tourCardMeta}>{tour.pax} pax · {tour.destination}</span>
                                                </div>
                                            );
                                        })}

                                        {more > 0 && (
                                            <button
                                                className={styles.viewMore}
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    const rect = (e.currentTarget as HTMLElement).closest(`.${styles.cell}`)?.getBoundingClientRect();
                                                    setPopup({ date: cell.date, tours, x: rect?.left ?? 0, y: rect?.top ?? 0 });
                                                }}
                                            >
                                                View {more} More
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Popup ── */}
                    {popup && (
                        <div className={styles.popupOverlay} onClick={() => setPopup(null)}>
                            <div
                                className={styles.popup}
                                ref={popupRef}
                                onClick={e => e.stopPropagation()}
                                style={{ left: popup.x, top: popup.y }}
                            >
                                <div className={styles.popupHeader}>
                                    <span className={styles.popupDay}>{popup.date.getDate()}</span>
                                    <button className={styles.popupClose} onClick={() => setPopup(null)}>
                                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                                        </svg>
                                    </button>
                                </div>
                                <div className={styles.popupList}>
                                    {popup.tours.map(tour => {
                                        const cfg = STATUS_CFG[tour.status];
                                        const isStart = isSameDay(popup.date, parseDate(tour.startDate));
                                        return (
                                            <div
                                                key={tour.id}
                                                className={styles.tourCard}
                                                style={{ background: cfg.cardBg, color: cfg.cardText, borderLeftColor: cfg.border }}
                                            >
                                                <span className={styles.tourCardTime}>
                                                    <svg viewBox="0 0 24 24" fill="none" width="9" height="9">
                                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                                        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                                    </svg>
                                                    {isStart ? tour.departureTime : "In tour"}
                                                </span>
                                                <span className={styles.tourCardName}>{tour.name}</span>
                                                <span className={styles.tourCardMeta}>{tour.pax} pax · {tour.destination}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ══ Right panel ══ */}
                <div className={styles.rightPanel}>
                    <div className={styles.rpHeader}>
                        <h3 className={styles.rpTitle}>Upcoming Tours</h3>
                        <p className={styles.rpSubtitle}>Next scheduled departures</p>
                    </div>

                    <div className={styles.rpList}>
                        {upcoming.length === 0 ? (
                            <p className={styles.rpEmpty}>No upcoming tours</p>
                        ) : upcoming.map(tour => {
                            const cfg   = STATUS_CFG[tour.status];
                            const start = parseDate(tour.startDate);
                            return (
                                <div key={tour.id} className={styles.rpCard} style={{ borderLeftColor: cfg.border }}>
                                    <div className={styles.rpCardTop}>
                                        <span className={styles.rpCardDate}>
                                            <svg viewBox="0 0 24 24" fill="none" width="10" height="10">
                                                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                                                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                            </svg>
                                            {start.getDate()} {MONTHS_SHORT[start.getMonth()]}
                                        </span>
                                        <span className={styles.rpBadge} style={{ background: cfg.bg, color: cfg.color }}>
                                            {cfg.label}
                                        </span>
                                    </div>
                                    <span className={styles.rpCardName}>{tour.name}</span>
                                    <span className={styles.rpCardMeta}>{tour.destination} · {tour.pax} pax · {tour.departureTime}</span>
                                </div>
                            );
                        })}
                    </div>

                    <button className={styles.addTourBtn}>
                        <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
                            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                        </svg>
                        Add New Tour
                    </button>
                </div>
            </div>
        </div>
    );
}
