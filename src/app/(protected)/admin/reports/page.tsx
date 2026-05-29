"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
    reportService,
    ReportDTO,
    ReportItemType,
    ReportStatus,
} from "@/libs/services/report.service";
import { providerService } from "@/libs/services/provider.service";
import styles from "./page.module.scss";

// ── Config ─────────────────────────────────────────────────────────────────────
const ITEM_TYPES: ReportItemType[] = ["Service", "Package", "Booking", "User", "Feedback"];
const STATUSES: ReportStatus[]     = ["Pending", "Reviewed", "Resolved", "Rejected"];

const STATUS_STYLE: Record<ReportStatus, { bg: string; color: string }> = {
    Pending:  { bg: "#fef3c7", color: "#92400e" },
    Reviewed: { bg: "#dbeafe", color: "#1e40af" },
    Resolved: { bg: "#d1fae5", color: "#065f46" },
    Rejected: { bg: "#fee2e2", color: "#991b1b" },
};

const TYPE_STYLE: Record<ReportItemType, { bg: string; color: string }> = {
    Service:  { bg: "#ede9fe", color: "#5b21b6" },
    Package:  { bg: "#fce7f3", color: "#9d174d" },
    Booking:  { bg: "#dbeafe", color: "#1e40af" },
    User:     { bg: "#f3f4f6", color: "#374151" },
    Feedback: { bg: "#d1fae5", color: "#065f46" },
};

function fmt(iso?: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function AdminReportsPage() {
    const [reports, setReports]           = useState<ReportDTO[]>([]);
    const [loading, setLoading]           = useState(true);
    const [titleFilter, setTitleFilter]   = useState("");
    const [typeFilter, setTypeFilter]     = useState<ReportItemType | "">("");
    const [statusFilter, setStatusFilter] = useState<ReportStatus | "">("");

    // Review modal
    const [selected, setSelected]       = useState<ReportDTO | null>(null);
    const [editStatus, setEditStatus]   = useState<ReportStatus>("Pending");
    const [editDesc, setEditDesc]       = useState("");
    const [saving, setSaving]           = useState(false);
    const [lightbox, setLightbox]       = useState<string | null>(null);
    const [resolvedItemName, setResolvedItemName] = useState<string | null>(null);

    useEffect(() => {
        if (!selected) { setResolvedItemName(null); return; }
        if (selected.itemName) { setResolvedItemName(selected.itemName); return; }
        if (selected.itemType !== "Service" && selected.itemType !== "Package") { setResolvedItemName(null); return; }
        setResolvedItemName(null);
        (async () => {
            try {
                if (selected.itemType === "Service") {
                    const res = await providerService.getServiceById(selected.itemId);
                    setResolvedItemName(res.data?.name ?? null);
                } else {
                    const res = await providerService.getPackageById(selected.itemId);
                    setResolvedItemName(res.data?.name ?? null);
                }
            } catch { setResolvedItemName(null); }
        })();
    }, [selected]);

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const res = await reportService.search({
                title:    titleFilter  || undefined,
                itemType: typeFilter   || undefined,
                status:   statusFilter || undefined,
            });
            setReports(res?.data ?? []);
        } finally {
            setLoading(false);
        }
    }, [titleFilter, typeFilter, statusFilter]);

    useEffect(() => { fetchReports(); }, [fetchReports]);

    // Derived counts
    const total    = reports.length;
    const pending  = reports.filter(r => r.status === "Pending").length;
    const resolved = reports.filter(r => r.status === "Resolved").length;
    const rejected = reports.filter(r => r.status === "Rejected").length;

    function openModal(r: ReportDTO) {
        setSelected(r);
        setEditStatus(r.status);
        setEditDesc(r.description);
    }

    async function handleSave() {
        if (!selected?.id) return;
        setSaving(true);
        try {
            const res = await reportService.update(selected.id, editDesc, editStatus);
            setReports(prev => prev.map(r => r.id === selected.id ? (res.data ?? r) : r));
            setSelected(null);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(r: ReportDTO) {
        if (!r.id || !confirm(`Delete report "${r.title}"?`)) return;
        await reportService.remove(r.id);
        setReports(prev => prev.filter(x => x.id !== r.id));
        if (selected?.id === r.id) setSelected(null);
    }

    async function quickStatus(r: ReportDTO, status: ReportStatus) {
        if (!r.id) return;
        await reportService.update(r.id, r.description, status);
        setReports(prev => prev.map(x => x.id === r.id ? { ...x, status } : x));
    }

    return (
        <div className={styles.page}>

            {/* ── Header ── */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Reports</h1>
                    <p className={styles.subtitle}>Review and act on reports submitted by users</p>
                </div>
                <button className={styles.btnRefresh} onClick={fetchReports} disabled={loading}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M23 4v6h-6M1 20v-6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Refresh
                </button>
            </div>

            {/* ── Stats ── */}
            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <span className={styles.statNum}>{total}</span>
                    <span className={styles.statLbl}>Total Reports</span>
                </div>
                <div className={`${styles.statCard} ${styles.statPending}`}>
                    <div className={styles.statDot} />
                    <span className={styles.statNum}>{pending}</span>
                    <span className={styles.statLbl}>Pending</span>
                </div>
                <div className={`${styles.statCard} ${styles.statResolved}`}>
                    <div className={styles.statDot} />
                    <span className={styles.statNum}>{resolved}</span>
                    <span className={styles.statLbl}>Resolved</span>
                </div>
                <div className={`${styles.statCard} ${styles.statRejected}`}>
                    <div className={styles.statDot} />
                    <span className={styles.statNum}>{rejected}</span>
                    <span className={styles.statLbl}>Rejected</span>
                </div>
            </div>

            {/* ── Filter bar ── */}
            <div className={styles.filterBar}>
                <div className={styles.filterInputWrap}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={styles.filterIcon}>
                        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/>
                        <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                    <input
                        className={styles.filterInput}
                        placeholder="Search by title…"
                        value={titleFilter}
                        onChange={e => setTitleFilter(e.target.value)}
                    />
                </div>
                <select
                    className={styles.filterSelect}
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value as ReportItemType | "")}
                >
                    <option value="">All types</option>
                    {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select
                    className={styles.filterSelect}
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as ReportStatus | "")}
                >
                    <option value="">All statuses</option>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {/* ── Table ── */}
            <div className={styles.tableWrap}>
                {loading ? (
                    <div className={styles.loadingRow}><div className={styles.spinner} /></div>
                ) : reports.length === 0 ? (
                    <div className={styles.emptyRow}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                            <path d="M14 2v6h6M12 18v-6M9 15h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <p>No reports found.</p>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Report</th>
                                <th>Type</th>
                                <th>Reporter</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map(r => {
                                const ss = STATUS_STYLE[r.status];
                                const ts = TYPE_STYLE[r.itemType];
                                return (
                                    <tr key={r.id ?? `${r.userId}-${r.itemId}`}>
                                        <td>
                                            <div className={styles.reportCell}>
                                                <span className={styles.reportTitle}>{r.title}</span>
                                                <span className={styles.reportDesc}>
                                                    {r.description.length > 90
                                                        ? r.description.slice(0, 90) + "…"
                                                        : r.description}
                                                </span>
                                                {r.imageUrls && r.imageUrls.length > 0 && (
                                                    <span className={styles.attachBadge}>
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                                        </svg>
                                                        {r.imageUrls.length} attachment{r.imageUrls.length > 1 ? "s" : ""}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={styles.badge} style={{ background: ts.bg, color: ts.color }}>
                                                {r.itemType}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={styles.reporterName}>{r.userName ?? `${r.userId.slice(0, 8)}…`}</span>
                                        </td>
                                        <td>
                                            <span className={styles.badge} style={{ background: ss.bg, color: ss.color }}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className={styles.dateCell}>{fmt(r.createdAt)}</td>
                                        <td>
                                            <div className={styles.rowActions}>
                                                <button className={styles.btnView} onClick={() => openModal(r)}>
                                                    View
                                                </button>
                                                {r.status === "Pending" && (
                                                    <>
                                                        <button className={styles.btnResolve} onClick={() => quickStatus(r, "Resolved")}>
                                                            Resolve
                                                        </button>
                                                        <button className={styles.btnReject} onClick={() => quickStatus(r, "Rejected")}>
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                <button className={styles.btnDelete} onClick={() => handleDelete(r)}>
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                                                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Detail / Review modal ── */}
            {selected && (
                <div className={styles.overlay} onClick={() => setSelected(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHead}>
                            <div>
                                <h2 className={styles.modalTitle}>Report Detail</h2>
                                <p className={styles.modalSub}>ID: {selected.id ?? "—"}</p>
                            </div>
                            <button className={styles.modalClose} onClick={() => setSelected(null)}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.metaGrid}>
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>Title</span>
                                    <span className={styles.metaValue}>{selected.title}</span>
                                </div>
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>Item Type</span>
                                    <span
                                        className={styles.badge}
                                        style={{ background: TYPE_STYLE[selected.itemType].bg, color: TYPE_STYLE[selected.itemType].color }}
                                    >
                                        {selected.itemType}
                                    </span>
                                </div>
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>{selected.itemType === "Service" ? "Service" : selected.itemType === "Package" ? "Package" : "Item"}</span>
                                    <span className={styles.metaValue}>
                                        {resolvedItemName ?? (
                                            (selected.itemType === "Service" || selected.itemType === "Package")
                                                ? <span className={styles.mono}>{selected.itemId.slice(0, 8)}…</span>
                                                : "—"
                                        )}
                                    </span>
                                </div>
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>Reporter</span>
                                    <span className={styles.metaValue}>{selected.userName ?? <span className={styles.mono}>{selected.userId.slice(0, 8)}…</span>}</span>
                                </div>
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>Submitted</span>
                                    <span className={styles.metaValue}>{fmt(selected.createdAt)}</span>
                                </div>
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>Last updated</span>
                                    <span className={styles.metaValue}>{fmt(selected.updatedAt)}</span>
                                </div>
                            </div>

                            <div className={styles.fieldBlock}>
                                <label className={styles.fieldLabel}>Description</label>
                                <textarea
                                    className={styles.textarea}
                                    value={editDesc}
                                    onChange={e => setEditDesc(e.target.value)}
                                    rows={4}
                                    placeholder="Description…"
                                />
                            </div>

                            {selected.imageUrls && selected.imageUrls.length > 0 && (
                                <div className={styles.fieldBlock}>
                                    <label className={styles.fieldLabel}>Attachments</label>
                                    <div className={styles.imgGrid}>
                                        {selected.imageUrls.map((url, i) => (
                                            <div key={i} className={styles.imgThumb} onClick={() => setLightbox(url)}>
                                                <Image src={url} alt={`img-${i}`} fill sizes="100px" style={{ objectFit: "cover" }} />
                                                <div className={styles.imgOverlay}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                        <path d="M15 3h6v6M14 10l6.1-6.1M9 21H3v-6M10 14l-6.1 6.1" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                                                    </svg>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className={styles.fieldBlock}>
                                <label className={styles.fieldLabel}>Update Status</label>
                                <select
                                    className={styles.statusSelect}
                                    value={editStatus}
                                    onChange={e => setEditStatus(e.target.value as ReportStatus)}
                                >
                                    {STATUSES.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={styles.modalFoot}>
                            <button className={styles.btnDeleteModal} onClick={() => handleDelete(selected)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Delete Report
                            </button>
                            <div className={styles.modalFootRight}>
                                <button className={styles.cancelBtn} onClick={() => setSelected(null)}>Cancel</button>
                                <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                                    {saving ? "Saving…" : "Save changes"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Lightbox ── */}
            {lightbox && (
                <div className={styles.lightboxOverlay} onClick={() => setLightbox(null)}>
                    <div className={styles.lightboxImg}>
                        <Image src={lightbox} alt="attachment" fill style={{ objectFit: "contain" }} />
                    </div>
                    <button className={styles.lightboxClose} onClick={() => setLightbox(null)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}
