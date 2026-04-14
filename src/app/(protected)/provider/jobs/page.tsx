"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import JobCard from "@/components/commons/job-card/job-card";
import styles from "./page.module.scss";

// ── Types ─────────────────────────────────────────────────────────────────────
type JobStatus = "confirmed" | "pending" | "completed" | "cancelled";

interface TourJob {
    id: string;
    groupName: string;
    agency: string;
    arrivalDate: string;
    departureDate: string;
    arrivalTime: string;
    people: number;
    services: string[];
    status: JobStatus;
    notes?: string;
}

// ── Config ────────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<JobStatus, { label: string; color: string; bg: string; border: string }> = {
    confirmed: { label: "confirmed", color: "#065f46", bg: "#d1fae5", border: "#10b981" },
    pending:   { label: "pending",   color: "#92400e", bg: "#fef3c7", border: "#f59e0b" },
    completed: { label: "completed", color: "#1e40af", bg: "#dbeafe", border: "#3b82f6" },
    cancelled: { label: "cancelled", color: "#991b1b", bg: "#fee2e2", border: "#ef4444" },
};

const CATEGORY_OPTIONS = ["All Categories", "Medical", "Wellness", "Dental", "Cosmetic"];
const MONTHS   = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEKDAYS = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];

// ── Mock data ─────────────────────────────────────────────────────────────────
const now = new Date();
const Y = now.getFullYear();
const M = now.getMonth() + 1;
const TD = now.getDate();

function mkd(day: number, m = M) {
    return `${Y}-${String(m).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}

const MOCK_JOBS: TourJob[] = [
    { id:"j1", groupName:"Hanoi Golden Group", agency:"Vietnam Travel", arrivalDate:mkd(TD),   departureDate:mkd(TD+3),  arrivalTime:"08:00 AM", people:24, services:["Full Body Checkup","Dental"], status:"confirmed" },
    { id:"j2", groupName:"HCM Wellness Retreat", agency:"Saigon Tours", arrivalDate:mkd(TD),   departureDate:mkd(TD+2),  arrivalTime:"10:30 AM", people:12, services:["Spa & Massage","Blood Panel"], status:"pending" },
    { id:"j3", groupName:"Hue Heritage Group", agency:"Imperial Tours", arrivalDate:mkd(TD),   departureDate:mkd(TD+1),  arrivalTime:"02:00 PM", people:15, services:["Traditional Medicine"], status:"confirmed" },
    { id:"j4", groupName:"Da Nang Senior Care", agency:"Central Travel", arrivalDate:mkd(TD+2), departureDate:mkd(TD+5),  arrivalTime:"09:00 AM", people:30, services:["Cardiac Screening"], status:"confirmed", notes:"Need wheelchair access" },
    { id:"j5", groupName:"Korea Medical Tour", agency:"Seoul Medica", arrivalDate:mkd(TD+2), departureDate:mkd(TD+3),  arrivalTime:"11:00 AM", people:8,  services:["Cosmetic Consult"], status:"pending" },
    { id:"j6", groupName:"Mekong Delta Health", agency:"Delta Agency", arrivalDate:mkd(TD+5), departureDate:mkd(TD+7),  arrivalTime:"08:30 AM", people:18, services:["General Screening"], status:"pending" },
    { id:"j7", groupName:"Nha Trang Beach Tour", agency:"Coastal Journeys", arrivalDate:mkd(TD+5), departureDate:mkd(TD+6),  arrivalTime:"01:00 PM", people:10, services:["Dermatology"], status:"confirmed" },
    { id:"j8", groupName:"Sapa Mountain Retreat", agency:"Northern Trails", arrivalDate:mkd(TD+10), departureDate:mkd(TD+13), arrivalTime:"07:00 AM", people:20, services:["Respiratory Check"], status:"confirmed" },
    { id:"j9", groupName:"Phu Quoc Wellness", agency:"Island Tours", arrivalDate:mkd(TD+10), departureDate:mkd(TD+12), arrivalTime:"09:30 AM", people:14, services:["Spa & Massage","Eye Exam"], status:"pending" },
    { id:"j10",groupName:"Old Quarter Med Tour", agency:"Hanoi Heritage", arrivalDate:mkd(TD-3), departureDate:mkd(TD-1), arrivalTime:"10:00 AM", people:9,  services:["Dental Care"], status:"completed" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const parseDate  = (s: string) => new Date(s + "T00:00:00");
const isSameDay  = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const inRange    = (d: Date, s: Date, e: Date) => d >= s && d <= e;

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ProviderJobsPage() {
    const today = useMemo(() => new Date(), []);

    const [curYear,   setCurYear]   = useState(today.getFullYear());
    const [curMonth,  setCurMonth]  = useState(today.getMonth());
    const [category,  setCategory]  = useState("All Categories");
    const [catOpen,   setCatOpen]   = useState(false);
    const [filter,    setFilter]    = useState<"all"|JobStatus>("all");
    const [popup,     setPopup]     = useState<{ date: Date; jobs: TourJob[]; x: number; y: number } | null>(null);
    const catRef  = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // ── Grid cells ────────────────────────────────────────────────────────────
    const cells = useMemo(() => {
        const firstDay  = new Date(curYear, curMonth, 1).getDay();
        const daysInMo  = new Date(curYear, curMonth + 1, 0).getDate();
        const prevDays  = new Date(curYear, curMonth, 0).getDate();
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

    // Today's column index (0-6)
    const todayColIndex = today.getDay();
    const isCurrentMonthView = curYear === today.getFullYear() && curMonth === today.getMonth();

    function jobsOnDate(date: Date): TourJob[] {
        return MOCK_JOBS.filter(j => inRange(date, parseDate(j.arrivalDate), parseDate(j.departureDate)));
    }

    // Right panel: unconfirmed / pending groups
    const unconfirmed = useMemo(() =>
        MOCK_JOBS.filter(j => {
            const statusOk = filter === "all" || j.status === filter;
            return j.status === "pending" && statusOk;
        }).sort((a, b) => parseDate(a.arrivalDate).getTime() - parseDate(b.arrivalDate).getTime())
    , [filter]);

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className={styles.page}>

            {/* ── Top bar ── */}
            <div className={styles.topBar}>
                <div className={styles.topLeft}>
                    {/* Category dropdown */}
                    <div className={styles.catWrap} ref={catRef}>
                        <button
                            className={styles.catBtn}
                            onClick={e => { e.stopPropagation(); setCatOpen(o => !o); }}
                        >
                            {category}
                            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                        {catOpen && (
                            <div className={styles.catDropdown}>
                                {CATEGORY_OPTIONS.map(opt => (
                                    <button
                                        key={opt}
                                        className={`${styles.catOpt} ${category === opt ? styles.catOptActive : ""}`}
                                        onClick={() => { setCategory(opt); setCatOpen(false); }}
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
                    <button className={styles.iconBtn}>
                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                            <rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor"/>
                            <rect x="14" y="3" width="7" height="7" rx="1" fill="currentColor"/>
                            <rect x="3" y="14" width="7" height="7" rx="1" fill="currentColor"/>
                            <rect x="14" y="14" width="7" height="7" rx="1" fill="currentColor"/>
                        </svg>
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
                                    {isToday
                                        ? <span className={styles.todayPill}>{w}</span>
                                        : w
                                    }
                                </div>
                            );
                        })}
                    </div>

                    {/* Grid */}
                    <div className={styles.grid}>
                        {cells.map((cell, idx) => {
                            const colIndex  = idx % 7;
                            const isToday   = isSameDay(cell.date, today);
                            const isTodayCol= isCurrentMonthView && colIndex === todayColIndex;
                            const jobs      = jobsOnDate(cell.date);
                            const visible    = jobs.slice(0, 1);
                            const more       = jobs.length - 1;

                            return (
                                <div
                                    key={idx}
                                    className={[
                                        styles.cell,
                                        !cell.thisMonth ? styles.cellOther : "",
                                        isTodayCol      ? styles.cellTodayCol : "",
                                    ].join(" ")}
                                >
                                    {/* Cell header */}
                                    <div className={styles.cellHead}>
                                        <span className={styles.addNew}>Add New</span>
                                        <span className={`${styles.dayNum} ${isToday ? styles.dayNumToday : ""}`}>
                                            {cell.day}
                                        </span>
                                    </div>

                                    {/* Events */}
                                    <div className={styles.events}>
                                        {visible.map(job => {
                                            const isArrival = isSameDay(cell.date, parseDate(job.arrivalDate));
                                            return (
                                                <JobCard
                                                    key={job.id}
                                                    time={isArrival ? job.arrivalTime : "In stay"}
                                                    title={job.groupName}
                                                    status={job.status}
                                                />
                                            );
                                        })}

                                        {more > 0 && (
                                            <button
                                                className={styles.viewMore}
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    const rect = (e.currentTarget as HTMLElement).closest(`.${styles.cell}`)?.getBoundingClientRect();
                                                    setPopup({ date: cell.date, jobs, x: rect?.left ?? 0, y: rect?.top ?? 0 });
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
                                    {popup.jobs.map(job => {
                                        const isArrival = isSameDay(popup.date, parseDate(job.arrivalDate));
                                        return (
                                            <JobCard
                                                key={job.id}
                                                time={isArrival ? job.arrivalTime : "In stay"}
                                                title={job.groupName}
                                                status={job.status}
                                                onCancel={() => setPopup(null)}
                                            />
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
                        <h3 className={styles.rpTitle}>Unconfirmed Groups</h3>
                    </div>

                    {/* Filter select */}
                    <div className={styles.rpSelect}>
                        <select
                            className={styles.rpSelectInput}
                            value={filter}
                            onChange={e => setFilter(e.target.value as "all" | JobStatus)}
                        >
                            <option value="all">Select</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                        </select>
                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14" className={styles.rpSelectArrow}>
                            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>

                    {/* List */}
                    <div className={styles.rpList}>
                        {unconfirmed.length === 0 ? (
                            <p className={styles.rpEmpty}>No pending groups</p>
                        ) : unconfirmed.map(job => {
                            const cfg = STATUS_CFG[job.status];
                            return (
                                <div key={job.id} className={styles.rpCard} style={{ borderLeftColor: cfg.border }}>
                                    <div className={styles.rpCardTop}>
                                        <span className={styles.rpCardTime}>
                                            <svg viewBox="0 0 24 24" fill="none" width="10" height="10">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                            </svg>
                                            {job.arrivalTime}
                                        </span>
                                        <button className={styles.menuBtn} onClick={e => e.stopPropagation()}>
                                            <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
                                                <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                                            </svg>
                                        </button>
                                    </div>
                                    <span className={styles.rpCardName}>{job.groupName}</span>
                                    <span className={styles.rpCardMeta}>{job.agency} · {job.people} pax</span>
                                    <span className={styles.eventBadge} style={{ background: cfg.bg, color: cfg.color }}>
                                        {cfg.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Add button */}
                    <button className={styles.addDraftBtn}>
                        <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
                            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                        </svg>
                        Add New Job
                    </button>
                </div>
            </div>
        </div>
    );
}
