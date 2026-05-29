"use client";

import { useState, useEffect } from "react";
import { agencyService } from "@/libs/services/agency.service";
import { AgencyScheduleDTO } from "@/types/itinerary.type";
import styles from "./page.module.scss";

type Tab = "pending" | "confirmed" | "all";

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function daysUntil(iso: string) {
    const diff = new Date(iso).getTime() - Date.now();
    const days = Math.ceil(diff / 86_400_000);
    if (days < 0)   return "Started";
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `in ${days} days`;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    Pending:   { label: "Pending",    cls: styles.badgePending   },
    Confirmed: { label: "Confirmed",  cls: styles.badgeConfirmed },
    Ongoing:   { label: "Ongoing",    cls: styles.badgeOngoing   },
    Completed: { label: "Completed",  cls: styles.badgeCompleted },
    Cancelled: { label: "Cancelled",  cls: styles.badgeCancelled },
};

export default function GuideJobsPage() {
    const [jobs, setJobs]           = useState<AgencyScheduleDTO[]>([]);
    const [loading, setLoading]     = useState(true);
    const [tab, setTab]             = useState<Tab>("pending");
    const [acting, setActing]       = useState<string | null>(null);
    const [toast, setToast]         = useState<{ msg: string; type: "success" | "error" } | null>(null);

    useEffect(() => {
        agencyService.getMyGuideSchedules()
            .then(r => setJobs(r.data ?? []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    function showToast(msg: string, type: "success" | "error") {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    }

    async function handleAccept(jobId: string) {
        setActing(jobId + "_accept");
        try {
            await agencyService.acceptSchedule(jobId);
            setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: "Confirmed" } : j));
            showToast("Job accepted! The agency has been notified.", "success");
        } catch {
            showToast("Failed to accept job. Please try again.", "error");
        } finally {
            setActing(null);
        }
    }

    async function handleReject(jobId: string) {
        setActing(jobId + "_reject");
        try {
            await agencyService.rejectSchedule(jobId);
            setJobs(prev => prev.filter(j => j.id !== jobId));
            showToast("Job declined. The agency has been notified.", "success");
        } catch {
            showToast("Failed to decline job. Please try again.", "error");
        } finally {
            setActing(null);
        }
    }

    const filtered = jobs.filter(j => {
        if (tab === "pending")   return j.status === "Pending";
        if (tab === "confirmed") return j.status === "Confirmed" || j.status === "Ongoing";
        return true;
    });

    const pendingCount = jobs.filter(j => j.status === "Pending").length;

    return (
        <div className={styles.page}>
            {/* Toast */}
            {toast && (
                <div className={`${styles.toast} ${toast.type === "error" ? styles.toastError : styles.toastSuccess}`}>
                    {toast.type === "success" ? (
                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                    )}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>My Jobs</h1>
                    <p className={styles.subtitle}>Tour schedules assigned to you</p>
                </div>
                {pendingCount > 0 && (
                    <div className={styles.pendingAlert}>
                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                            <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <strong>{pendingCount}</strong> job{pendingCount > 1 ? "s" : ""} waiting for your response
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${tab === "pending" ? styles.tabActive : ""}`}
                    onClick={() => setTab("pending")}
                >
                    Pending
                    {pendingCount > 0 && <span className={styles.tabBadge}>{pendingCount}</span>}
                </button>
                <button
                    className={`${styles.tab} ${tab === "confirmed" ? styles.tabActive : ""}`}
                    onClick={() => setTab("confirmed")}
                >
                    Confirmed
                </button>
                <button
                    className={`${styles.tab} ${tab === "all" ? styles.tabActive : ""}`}
                    onClick={() => setTab("all")}
                >
                    All Jobs
                    <span className={styles.tabCount}>{jobs.length}</span>
                </button>
            </div>

            {/* Content */}
            <div className={styles.content}>
                {loading ? (
                    <div className={styles.spinnerWrap}><div className={styles.spinner} /></div>
                ) : filtered.length === 0 ? (
                    <div className={styles.empty}>
                        <svg viewBox="0 0 24 24" fill="none" width="44" height="44" style={{ color: "#d1d5db" }}>
                            <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 13h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <p>{tab === "pending" ? "No pending jobs — you are all caught up!" : "No jobs found."}</p>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {filtered.map(job => {
                            const st         = STATUS_MAP[job.status] ?? { label: job.status, cls: styles.badgePending };
                            const isPending  = job.status === "Pending";
                            const isAccepting = acting === job.id + "_accept";
                            const isRejecting = acting === job.id + "_reject";
                            const isBusy     = isAccepting || isRejecting;

                            return (
                                <div key={job.id} className={`${styles.card} ${isPending ? styles.cardPending : ""}`}>
                                    {isPending && <div className={styles.cardPendingStripe} />}

                                    {/* Card header */}
                                    <div className={styles.cardHeader}>
                                        <div className={styles.cardIcon}>
                                            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" fill="currentColor"/>
                                            </svg>
                                        </div>
                                        <div className={styles.cardTitleWrap}>
                                            <h3 className={styles.cardTitle}>{job.itineraryName}</h3>
                                            <span className={`${styles.badge} ${st.cls}`}>{st.label}</span>
                                        </div>
                                    </div>

                                    {/* Meta */}
                                    <div className={styles.cardMeta}>
                                        <div className={styles.metaRow}>
                                            <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7"/>
                                                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                                            </svg>
                                            <span>{fmtDate(job.startTime)} → {fmtDate(job.endTime)}</span>
                                        </div>
                                        <div className={styles.metaRow}>
                                            <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.7"/>
                                                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                                            </svg>
                                            <span className={styles.metaCountdown}>{daysUntil(job.startTime)}</span>
                                        </div>
                                        <div className={styles.metaRow}>
                                            <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                                                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.7"/>
                                            </svg>
                                            <span>{job.spot - job.spotLeft} / {job.spot} guests booked</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {isPending && (
                                        <div className={styles.cardActions}>
                                            <div className={styles.actionHint}>
                                                <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                                                    <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                                </svg>
                                                Awaiting your response
                                            </div>
                                            <div className={styles.actionBtns}>
                                                <button
                                                    className={styles.rejectBtn}
                                                    disabled={isBusy}
                                                    onClick={() => handleReject(job.id)}
                                                >
                                                    {isRejecting ? <span className={styles.btnSpinner} /> : (
                                                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                                                        </svg>
                                                    )}
                                                    Decline
                                                </button>
                                                <button
                                                    className={styles.acceptBtn}
                                                    disabled={isBusy}
                                                    onClick={() => handleAccept(job.id)}
                                                >
                                                    {isAccepting ? <span className={styles.btnSpinner} /> : (
                                                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                                            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/>
                                                        </svg>
                                                    )}
                                                    Accept Job
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {job.status === "Confirmed" && (
                                        <div className={styles.cardConfirmed}>
                                            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            You accepted this job
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
