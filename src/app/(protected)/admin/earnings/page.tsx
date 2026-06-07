"use client";

import { useEffect, useState } from "react";
import { adminService } from "@/libs/services/admin.service";
import type { ScheduleEarningDTO } from "@/types/earning.type";
import styles from "./page.module.scss";

const COMMISSION_RATE = 0.2; // 20% admin fee

function fmtVND(n: number) {
    return n.toLocaleString("vi-VN") + "đ";
}
function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminEarningsPage() {
    const [earnings, setEarnings] = useState<ScheduleEarningDTO[]>([]);
    const [loading,  setLoading]  = useState(true);
    const [filter,   setFilter]   = useState<"all" | "pending" | "released">("all");
    const [releasing, setReleasing] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    function showToast(msg: string, ok: boolean) {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3500);
    }

    function load() {
        setLoading(true);
        adminService.getScheduleEarnings()
            .then(res => { if (res?.data) setEarnings(res.data); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }

    useEffect(load, []);

    async function handleRelease(scheduleId: string) {
        setReleasing(scheduleId);
        try {
            await adminService.releaseEarnings(scheduleId);
            setEarnings(prev => prev.map(e =>
                e.scheduleId === scheduleId
                    ? { ...e, released: true, releasedAt: new Date().toISOString() }
                    : e
            ));
            showToast("Earnings released successfully.", true);
        } catch {
            showToast("Failed to release earnings. Please try again.", false);
        } finally {
            setReleasing(null);
        }
    }

    const filtered = earnings.filter(e => {
        if (filter === "pending")  return !e.released;
        if (filter === "released") return e.released;
        return true;
    });

    const totalPending  = earnings.filter(e => !e.released).length;
    const totalReleased = earnings.filter(e =>  e.released).length;
    const totalAdminFee = earnings.filter(e => e.released).reduce((s, e) => s + e.adminFee, 0);

    return (
        <div className={styles.page}>
            {/* Toast */}
            {toast && (
                <div className={`${styles.toast} ${toast.ok ? styles.toastOk : styles.toastErr}`}>
                    {toast.ok
                        ? <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        : <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                    }
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.title}>Trip Earnings</h1>
                    <p className={styles.subtitle}>
                        Release completed trip earnings — agency & provider each receive <strong>80%</strong>, admin keeps <strong>20%</strong>
                    </p>
                </div>
                <button className={styles.refreshBtn} onClick={load}>
                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                        <path d="M23 4v6h-6M1 20v-6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Refresh
                </button>
            </div>

            {/* Summary chips */}
            <div className={styles.summaryRow}>
                <div className={styles.chip} style={{ background: "#fef3c7", borderColor: "#fde68a" }}>
                    <span className={styles.chipNum} style={{ color: "#92400e" }}>{totalPending}</span>
                    <span className={styles.chipLabel}>Pending Release</span>
                </div>
                <div className={styles.chip} style={{ background: "#dcfce7", borderColor: "#bbf7d0" }}>
                    <span className={styles.chipNum} style={{ color: "#15803d" }}>{totalReleased}</span>
                    <span className={styles.chipLabel}>Released</span>
                </div>
                <div className={styles.chip} style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}>
                    <span className={styles.chipNum} style={{ color: "#1d4ed8" }}>{fmtVND(totalAdminFee)}</span>
                    <span className={styles.chipLabel}>Admin Fees Collected</span>
                </div>
            </div>

            {/* Filter tabs */}
            <div className={styles.filterRow}>
                {(["all", "pending", "released"] as const).map(f => (
                    <button
                        key={f}
                        className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ""}`}
                        onClick={() => setFilter(f)}
                    >
                        {f === "all" ? "All" : f === "pending" ? "Pending" : "Released"}
                        {f === "pending" && totalPending > 0 && (
                            <span className={styles.badge}>{totalPending}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className={styles.loadingWrap}><div className={styles.spinner} /></div>
            ) : filtered.length === 0 ? (
                <div className={styles.emptyWrap}>
                    <svg viewBox="0 0 24 24" fill="none" width="48" height="48">
                        <circle cx="12" cy="12" r="10" stroke="#d1d5db" strokeWidth="1.5"/>
                        <path d="M12 6v2M12 16v2M9.5 9.5a2.5 2.5 0 015 0c0 1.5-1.5 2-2.5 2.5S9.5 13 9.5 14.5a2.5 2.5 0 005 0" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <p>No earnings found</p>
                </div>
            ) : (
                <div className={styles.list}>
                    {filtered.map(e => {
                        const busy = releasing === e.scheduleId;
                        return (
                            <div key={e.scheduleId} className={`${styles.card} ${e.released ? styles.cardReleased : ""}`}>
                                {/* Card header */}
                                <div className={styles.cardHead}>
                                    <div className={styles.cardHeadLeft}>
                                        <span className={`${styles.statusDot} ${e.released ? styles.dotGreen : styles.dotAmber}`} />
                                        <div>
                                            <span className={styles.tourName}>{e.itineraryName}</span>
                                            <span className={styles.agencyName}>{e.agencyName}</span>
                                        </div>
                                    </div>
                                    <div className={styles.cardHeadRight}>
                                        <span className={styles.dateRange}>
                                            {fmtDate(e.startTime)} → {fmtDate(e.endTime)}
                                        </span>
                                        {e.released
                                            ? <span className={styles.releasedBadge}>Released {e.releasedAt ? fmtDate(e.releasedAt) : ""}</span>
                                            : (
                                                <button
                                                    className={styles.releaseBtn}
                                                    disabled={busy}
                                                    onClick={() => handleRelease(e.scheduleId)}
                                                >
                                                    {busy ? <span className={styles.btnSpinner} /> : (
                                                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                                            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                                                        </svg>
                                                    )}
                                                    Release Earnings
                                                </button>
                                            )
                                        }
                                    </div>
                                </div>

                                {/* Breakdown grid */}
                                <div className={styles.breakdown}>
                                    {/* Total */}
                                    <div className={styles.bRow}>
                                        <span className={styles.bLabel}>Total Bookings</span>
                                        <span className={styles.bTotal}>{fmtVND(e.totalBookingAmount)}</span>
                                    </div>

                                    <div className={styles.bDivider} />

                                    {/* Agency */}
                                    <div className={styles.bRow}>
                                        <div className={styles.bPartyCell}>
                                            <span className={styles.partyDot} style={{ background: "#6366f1" }} />
                                            <div>
                                                <span className={styles.bPartyName}>Agency — {e.agencyName}</span>
                                                <span className={styles.bSub}>{fmtVND(e.agencyTotal)} × 80%</span>
                                            </div>
                                        </div>
                                        <span className={styles.bPayout} style={{ color: "#6366f1" }}>{fmtVND(e.agencyPayout)}</span>
                                    </div>

                                    {/* Provider(s) */}
                                    {e.providers.map(p => (
                                        <div key={p.providerId} className={styles.bRow}>
                                            <div className={styles.bPartyCell}>
                                                <span className={styles.partyDot} style={{ background: "#f97316" }} />
                                                <div>
                                                    <span className={styles.bPartyName}>Provider — {p.providerName}</span>
                                                    <span className={styles.bSub}>{fmtVND(p.total)} × 80%</span>
                                                </div>
                                            </div>
                                            <span className={styles.bPayout} style={{ color: "#f97316" }}>{fmtVND(p.payout)}</span>
                                        </div>
                                    ))}

                                    <div className={styles.bDivider} />

                                    {/* Admin fee */}
                                    <div className={styles.bRow}>
                                        <div className={styles.bPartyCell}>
                                            <span className={styles.partyDot} style={{ background: "#10b981" }} />
                                            <div>
                                                <span className={styles.bPartyName}>Admin Fee</span>
                                                <span className={styles.bSub}>{fmtVND(e.totalBookingAmount)} × {Math.round(COMMISSION_RATE * 100)}%</span>
                                            </div>
                                        </div>
                                        <span className={styles.bPayout} style={{ color: "#10b981" }}>{fmtVND(e.adminFee)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
