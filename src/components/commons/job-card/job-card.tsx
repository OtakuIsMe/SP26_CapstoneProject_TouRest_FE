"use client";

import { useRef, useState, useEffect } from "react";
import styles from "./job-card.module.scss";

export type JobCardStatus = "confirmed" | "pending" | "completed" | "cancelled";

export interface JobCardProps {
    time: string;
    title: string;
    status: JobCardStatus;
    onClick?: () => void;
    onEdit?: () => void;
    onCancel?: () => void;
}

const STATUS_CFG: Record<JobCardStatus, { label: string; color: string; bg: string; border: string }> = {
    confirmed: { label: "CONFIRMED", color: "#065f46", bg: "#d1fae5", border: "#10b981" },
    pending:   { label: "PENDING",   color: "#92400e", bg: "#fef3c7", border: "#f59e0b" },
    completed: { label: "DONE",      color: "#1e40af", bg: "#dbeafe", border: "#3b82f6" },
    cancelled: { label: "CANCELLED", color: "#991b1b", bg: "#fee2e2", border: "#ef4444" },
};

export default function JobCard({ time, title, status, onClick, onEdit, onCancel }: JobCardProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const cfg = STATUS_CFG[status];

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node))
                setMenuOpen(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div
            className={styles.card}
            style={{ borderLeftColor: cfg.border }}
            onClick={onClick}
        >
            {/* Top row: time + 3-dot */}
            <div className={styles.top}>
                <span className={styles.time}>
                    <svg viewBox="0 0 24 24" fill="none" width="11" height="11">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    {time}
                </span>

                <div className={styles.menuWrap} ref={menuRef}>
                    <button
                        className={styles.menuBtn}
                        onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
                        aria-label="Options"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                            <circle cx="12" cy="5"  r="1.5"/>
                            <circle cx="12" cy="12" r="1.5"/>
                            <circle cx="12" cy="19" r="1.5"/>
                        </svg>
                    </button>

                    {menuOpen && (
                        <div className={styles.dropdown}>
                            <button className={styles.dropItem} onClick={e => { e.stopPropagation(); setMenuOpen(false); onClick?.(); }}>
                                <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
                                View Details
                            </button>
                            <button className={styles.dropItem} onClick={e => { e.stopPropagation(); setMenuOpen(false); onEdit?.(); }}>
                                <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                Edit
                            </button>
                            <div className={styles.dropDivider}/>
                            <button className={`${styles.dropItem} ${styles.dropItemDanger}`} onClick={e => { e.stopPropagation(); setMenuOpen(false); onCancel?.(); }}>
                                <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Title */}
            <p className={styles.title}>{title}</p>

            {/* Badge */}
            <span
                className={styles.badge}
                style={{ background: cfg.bg, color: cfg.color }}
            >
                {cfg.label}
            </span>
        </div>
    );
}
