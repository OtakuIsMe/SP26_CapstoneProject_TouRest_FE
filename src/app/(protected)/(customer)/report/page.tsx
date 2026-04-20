"use client";

import { useRef, useState } from "react";
import Header from "@/components/layouts/header/header";
import styles from "./page.module.scss";

// ── Types ──────────────────────────────────────────────────────────────────────
type ReportType     = "INCIDENT" | "COMPLAINT" | "FEEDBACK" | "FINANCIAL" | "OTHER";
type ReportStatus   = "PENDING" | "IN_REVIEW" | "RESOLVED" | "REJECTED";
type ReportPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface CustomerReport {
    id: string;
    code: string;
    title: string;
    type: ReportType;
    status: ReportStatus;
    priority: ReportPriority;
    description: string;
    relatedTour?: string;
    relatedBooking?: string;
    images: string[];
    submittedAt: string;
    updatedAt: string;
    adminReply?: string;
}

// ── Mock data ──────────────────────────────────────────────────────────────────
const MY_BOOKINGS = [
    { code: "BKG-20240410", tour: "Ha Long Bay & Wellness Retreat" },
    { code: "BKG-20240325", tour: "Hoi An Heritage & Spa Tour" },
    { code: "BKG-20240301", tour: "Phu Quoc Island Medical Escape" },
];

const MOCK_REPORTS: CustomerReport[] = [
    {
        id: "r1", code: "RPT-001",
        title: "Tour guide was absent on Day 2",
        type: "INCIDENT", status: "IN_REVIEW", priority: "HIGH",
        description: "The assigned guide did not show up for the morning excursion on Day 2. We were left unattended for over 2 hours.",
        relatedTour: "Ha Long Bay & Wellness Retreat",
        relatedBooking: "BKG-20240410",
        images: ["https://picsum.photos/seed/r1a/400/300"],
        submittedAt: "2026-04-10T09:30:00",
        updatedAt: "2026-04-14T10:00:00",
        adminReply: "We sincerely apologise for this inconvenience. Our operations team has been notified and is investigating. We will follow up within 2 business days.",
    },
    {
        id: "r2", code: "RPT-002",
        title: "Room quality did not match listing",
        type: "COMPLAINT", status: "RESOLVED", priority: "MEDIUM",
        description: "The beachfront bungalow had no hot water and broken air conditioning. Staff denied our request for a room change.",
        relatedTour: "Phu Quoc Island Medical Escape",
        relatedBooking: "BKG-20240301",
        images: ["https://picsum.photos/seed/r2a/400/300", "https://picsum.photos/seed/r2b/400/300"],
        submittedAt: "2026-03-05T14:00:00",
        updatedAt: "2026-03-10T11:30:00",
        adminReply: "We have issued a partial refund of 500,000₫ to your account and notified the hotel partner. Thank you for bringing this to our attention.",
    },
];

// ── Config ────────────────────────────────────────────────────────────────────
const TYPE_CFG: Record<ReportType, { label: string; color: string; bg: string; icon: string; desc: string }> = {
    INCIDENT:  { label: "Incident",   color: "#b91c1c", bg: "#fee2e2", icon: "⚠️", desc: "Safety or service failure" },
    COMPLAINT: { label: "Complaint",  color: "#92400e", bg: "#fef3c7", icon: "💬", desc: "Dissatisfied with service" },
    FEEDBACK:  { label: "Feedback",   color: "#065f46", bg: "#d1fae5", icon: "📝", desc: "General feedback or praise" },
    FINANCIAL: { label: "Financial",  color: "#1e40af", bg: "#dbeafe", icon: "💰", desc: "Billing or refund issue" },
    OTHER:     { label: "Other",      color: "#374151", bg: "#f3f4f6", icon: "•",  desc: "Anything else" },
};

const STATUS_CFG: Record<ReportStatus, { label: string; color: string; bg: string; dot: string; desc: string }> = {
    PENDING:   { label: "Pending",   color: "#92400e", bg: "#fef9c3", dot: "#f59e0b", desc: "Waiting for review" },
    IN_REVIEW: { label: "In Review", color: "#1e3a8a", bg: "#dbeafe", dot: "#3b82f6", desc: "Being reviewed by admin" },
    RESOLVED:  { label: "Resolved",  color: "#14532d", bg: "#dcfce7", dot: "#22c55e", desc: "Issue has been resolved" },
    REJECTED:  { label: "Rejected",  color: "#4b5563", bg: "#f3f4f6", dot: "#9ca3af", desc: "Report not accepted" },
};

const PRIORITY_CFG: Record<ReportPriority, { label: string; color: string; bg: string }> = {
    LOW:    { label: "Low",    color: "#6b7280", bg: "#f3f4f6" },
    MEDIUM: { label: "Medium", color: "#d97706", bg: "#fef3c7" },
    HIGH:   { label: "High",   color: "#dc2626", bg: "#fee2e2" },
    URGENT: { label: "Urgent", color: "#7c3aed", bg: "#ede9fe" },
};

function fmtDate(s: string) {
    return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function uid() { return Math.random().toString(36).slice(2, 9); }

// ── Component ─────────────────────────────────────────────────────────────────
export default function CustomerReportPage() {
    const [reports, setReports] = useState<CustomerReport[]>(MOCK_REPORTS);
    const [viewTarget, setViewTarget] = useState<CustomerReport | null>(null);
    const [lightboxImg, setLightboxImg] = useState<string | null>(null);

    // ── Form ──
    const [formOpen, setFormOpen]     = useState(false);
    const [fTitle, setFTitle]         = useState("");
    const [fType, setFType]           = useState<ReportType>("COMPLAINT");
    const [fPriority, setFPriority]   = useState<ReportPriority>("MEDIUM");
    const [fBooking, setFBooking]     = useState("");
    const [fDesc, setFDesc]           = useState("");
    const [fImages, setFImages]       = useState<{ preview: string; name: string }[]>([]);
    const [fError, setFError]         = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Derived tour from selected booking
    const fTour = MY_BOOKINGS.find(b => b.code === fBooking)?.tour ?? "";

    // ── Image helpers ──
    function processFiles(files: FileList | File[]) {
        Array.from(files).filter(f => f.type.startsWith("image/")).forEach(file => {
            const reader = new FileReader();
            reader.onload = e => setFImages(prev => [...prev, { preview: e.target?.result as string, name: file.name }]);
            reader.readAsDataURL(file);
        });
    }
    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files) processFiles(e.target.files);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
    function handleDrop(e: React.DragEvent) {
        e.preventDefault(); setIsDragging(false);
        processFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/")));
    }

    // ── Submit ──
    function submitReport() {
        if (!fTitle.trim()) { setFError("Please enter a report title."); return; }
        if (!fDesc.trim())  { setFError("Please describe the issue."); return; }
        const nr: CustomerReport = {
            id: uid(),
            code: `RPT-${String(reports.length + 1).padStart(3, "0")}`,
            title: fTitle.trim(),
            type: fType,
            status: "PENDING",
            priority: fPriority,
            description: fDesc.trim(),
            relatedTour: fTour || undefined,
            relatedBooking: fBooking || undefined,
            images: fImages.map(i => i.preview),
            submittedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setReports(prev => [nr, ...prev]);
        closeForm();
    }
    function closeForm() {
        setFormOpen(false);
        setFTitle(""); setFType("COMPLAINT"); setFPriority("MEDIUM");
        setFBooking(""); setFDesc(""); setFImages([]); setFError("");
    }

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <>
            <Header variant="solid" />

            <main className={styles.page}>
                <div className={styles.container}>

                    {/* ── Page header ── */}
                    <div className={styles.pageHeader}>
                        <div>
                            <h1 className={styles.pageTitle}>My Reports</h1>
                            <p className={styles.pageSubtitle}>Track issues, complaints, and feedback for your bookings.</p>
                        </div>
                        <button className={styles.newReportBtn} onClick={() => setFormOpen(true)}>
                            <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                            New Report
                        </button>
                    </div>

                    {/* ── Status legend ── */}
                    <div className={styles.statusLegend}>
                        {(Object.entries(STATUS_CFG) as [ReportStatus, typeof STATUS_CFG[ReportStatus]][]).map(([k, v]) => (
                            <div key={k} className={styles.legendItem}>
                                <span className={styles.legendDot} style={{ background: v.dot }} />
                                <span className={styles.legendLabel}>{v.label}</span>
                                <span className={styles.legendDesc}>{v.desc}</span>
                            </div>
                        ))}
                    </div>

                    {/* ── Report list ── */}
                    {reports.length === 0 ? (
                        <div className={styles.emptyState}>
                            <svg viewBox="0 0 24 24" fill="none" width="48" height="48"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                            <p>No reports yet</p>
                            <span>Encountered an issue with your tour? Submit a report and our team will help.</span>
                            <button className={styles.newReportBtn} onClick={() => setFormOpen(true)}>Submit Your First Report</button>
                        </div>
                    ) : (
                        <div className={styles.reportList}>
                            {reports.map(r => {
                                const tc = TYPE_CFG[r.type];
                                const sc = STATUS_CFG[r.status];
                                const pc = PRIORITY_CFG[r.priority];
                                return (
                                    <div key={r.id} className={styles.reportCard} onClick={() => setViewTarget(r)}>
                                        <div className={styles.priorityStripe} style={{ background: pc.color }} />

                                        <div className={styles.reportCardBody}>
                                            <div className={styles.reportCardTop}>
                                                <span className={styles.reportCode}>{r.code}</span>
                                                <span className={styles.typeBadge} style={{ background: tc.bg, color: tc.color }}>
                                                    {tc.icon} {tc.label}
                                                </span>
                                                <span className={styles.priorityBadge} style={{ background: pc.bg, color: pc.color }}>
                                                    {pc.label}
                                                </span>
                                                <span className={styles.statusBadge} style={{ background: sc.bg, color: sc.color }}>
                                                    <span className={styles.statusDot} style={{ background: sc.dot }} />
                                                    {sc.label}
                                                </span>
                                            </div>

                                            <p className={styles.reportTitle}>{r.title}</p>

                                            {r.adminReply && (
                                                <div className={styles.replyPreview}>
                                                    <svg viewBox="0 0 24 24" fill="none" width="11" height="11"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
                                                    <span>{r.adminReply}</span>
                                                </div>
                                            )}

                                            <div className={styles.reportCardMeta}>
                                                {r.relatedTour && (
                                                    <span className={styles.metaChip}>
                                                        <svg viewBox="0 0 24 24" fill="none" width="10" height="10"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/></svg>
                                                        {r.relatedTour}
                                                    </span>
                                                )}
                                                {r.relatedBooking && (
                                                    <span className={styles.metaChip}>
                                                        <svg viewBox="0 0 24 24" fill="none" width="10" height="10"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                                        {r.relatedBooking}
                                                    </span>
                                                )}
                                                {r.images.length > 0 && (
                                                    <span className={styles.metaChip}>
                                                        <svg viewBox="0 0 24 24" fill="none" width="10" height="10"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                                        {r.images.length} image{r.images.length > 1 ? "s" : ""}
                                                    </span>
                                                )}
                                                <span className={styles.metaChip} style={{ marginLeft: "auto" }}>
                                                    <svg viewBox="0 0 24 24" fill="none" width="10" height="10"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                                    {fmtDate(r.submittedAt)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Image strip */}
                                        {r.images.length > 0 && (
                                            <div className={styles.imageStrip}>
                                                {r.images.slice(0, 3).map((img, i) => (
                                                    <div key={i} className={styles.stripThumb} onClick={e => { e.stopPropagation(); setLightboxImg(img); }}>
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={img} alt="" />
                                                        {i === 2 && r.images.length > 3 && (
                                                            <div className={styles.stripMore}>+{r.images.length - 3}</div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* ════════════════ DETAIL MODAL ════════════════ */}
            {viewTarget && (
                <div className={styles.overlay} onClick={() => setViewTarget(null)}>
                    <div className={styles.detailModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div className={styles.modalHeaderLeft}>
                                <span className={styles.reportCode} style={{ fontSize: 13 }}>{viewTarget.code}</span>
                                <span className={styles.typeBadge} style={{ background: TYPE_CFG[viewTarget.type].bg, color: TYPE_CFG[viewTarget.type].color }}>
                                    {TYPE_CFG[viewTarget.type].icon} {TYPE_CFG[viewTarget.type].label}
                                </span>
                                <span className={styles.statusBadge} style={{ background: STATUS_CFG[viewTarget.status].bg, color: STATUS_CFG[viewTarget.status].color }}>
                                    <span className={styles.statusDot} style={{ background: STATUS_CFG[viewTarget.status].dot }} />
                                    {STATUS_CFG[viewTarget.status].label}
                                </span>
                            </div>
                            <button className={styles.closeBtn} onClick={() => setViewTarget(null)}>
                                <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"/></svg>
                            </button>
                        </div>

                        <div className={styles.detailBody}>
                            <h2 className={styles.detailTitle}>{viewTarget.title}</h2>

                            {/* Meta */}
                            <div className={styles.detailMetaGrid}>
                                {viewTarget.relatedTour && (
                                    <div className={styles.detailMetaItem}>
                                        <span className={styles.detailMetaKey}>Tour</span>
                                        <span className={styles.detailMetaVal}>{viewTarget.relatedTour}</span>
                                    </div>
                                )}
                                {viewTarget.relatedBooking && (
                                    <div className={styles.detailMetaItem}>
                                        <span className={styles.detailMetaKey}>Booking</span>
                                        <span className={styles.detailMetaVal}>{viewTarget.relatedBooking}</span>
                                    </div>
                                )}
                                <div className={styles.detailMetaItem}>
                                    <span className={styles.detailMetaKey}>Priority</span>
                                    <span className={styles.priorityBadge} style={{ background: PRIORITY_CFG[viewTarget.priority].bg, color: PRIORITY_CFG[viewTarget.priority].color }}>
                                        {PRIORITY_CFG[viewTarget.priority].label}
                                    </span>
                                </div>
                                <div className={styles.detailMetaItem}>
                                    <span className={styles.detailMetaKey}>Submitted</span>
                                    <span className={styles.detailMetaVal}>{fmtDate(viewTarget.submittedAt)}</span>
                                </div>
                                <div className={styles.detailMetaItem}>
                                    <span className={styles.detailMetaKey}>Last updated</span>
                                    <span className={styles.detailMetaVal}>{fmtDate(viewTarget.updatedAt)}</span>
                                </div>
                            </div>

                            {/* Description */}
                            <div className={styles.detailSection}>
                                <p className={styles.detailSectionTitle}>Description</p>
                                <p className={styles.detailDesc}>{viewTarget.description}</p>
                            </div>

                            {/* Images */}
                            {viewTarget.images.length > 0 && (
                                <div className={styles.detailSection}>
                                    <p className={styles.detailSectionTitle}>Attachments ({viewTarget.images.length})</p>
                                    <div className={styles.detailImageGrid}>
                                        {viewTarget.images.map((img, i) => (
                                            <div key={i} className={styles.detailImageThumb} onClick={() => setLightboxImg(img)}>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={img} alt="" />
                                                <div className={styles.imageOverlay}>
                                                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Admin reply */}
                            {viewTarget.adminReply && (
                                <div className={styles.adminReplyBox}>
                                    <div className={styles.adminReplyHeader}>
                                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
                                        Response from TouRest Support
                                    </div>
                                    <p className={styles.adminReplyText}>{viewTarget.adminReply}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════ NEW REPORT MODAL ════════════════ */}
            {formOpen && (
                <div className={styles.overlay} onClick={closeForm}>
                    <div className={styles.formModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h3 className={styles.formTitle}>Submit a Report</h3>
                                <p className={styles.formSubtitle}>Tell us what happened and we&apos;ll help resolve it.</p>
                            </div>
                            <button className={styles.closeBtn} onClick={closeForm}>
                                <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"/></svg>
                            </button>
                        </div>

                        <div className={styles.formBody}>
                            {/* Type */}
                            <div className={styles.field}>
                                <label className={styles.label}>Report Type <span className={styles.required}>*</span></label>
                                <div className={styles.typeGrid}>
                                    {(Object.keys(TYPE_CFG) as ReportType[]).map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            className={`${styles.typeOption} ${fType === t ? styles.typeOptionActive : ""}`}
                                            style={fType === t ? { borderColor: TYPE_CFG[t].color, background: TYPE_CFG[t].bg, color: TYPE_CFG[t].color } : {}}
                                            onClick={() => setFType(t)}
                                        >
                                            <span className={styles.typeIcon}>{TYPE_CFG[t].icon}</span>
                                            <span className={styles.typeLabel}>{TYPE_CFG[t].label}</span>
                                            <span className={styles.typeDesc}>{TYPE_CFG[t].desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Title */}
                            <div className={styles.field}>
                                <label className={styles.label}>Report Title <span className={styles.required}>*</span></label>
                                <input
                                    className={styles.input}
                                    placeholder="Briefly describe the issue…"
                                    value={fTitle}
                                    onChange={e => { setFTitle(e.target.value); setFError(""); }}
                                />
                            </div>

                            {/* Booking + priority */}
                            <div className={styles.fieldRow}>
                                <div className={styles.field}>
                                    <label className={styles.label}>Related Booking</label>
                                    <select className={`${styles.input} ${styles.select}`} value={fBooking} onChange={e => setFBooking(e.target.value)}>
                                        <option value="">— Select booking —</option>
                                        {MY_BOOKINGS.map(b => (
                                            <option key={b.code} value={b.code}>{b.code} · {b.tour}</option>
                                        ))}
                                    </select>
                                    {fTour && <p className={styles.fieldHint}>{fTour}</p>}
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>Priority</label>
                                    <div className={styles.priorityGroup}>
                                        {(Object.keys(PRIORITY_CFG) as ReportPriority[]).map(p => (
                                            <button
                                                key={p}
                                                type="button"
                                                className={`${styles.priorityOption} ${fPriority === p ? styles.priorityOptionActive : ""}`}
                                                style={fPriority === p ? { background: PRIORITY_CFG[p].bg, color: PRIORITY_CFG[p].color, borderColor: PRIORITY_CFG[p].color } : {}}
                                                onClick={() => setFPriority(p)}
                                            >
                                                {PRIORITY_CFG[p].label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className={styles.field}>
                                <label className={styles.label}>Description <span className={styles.required}>*</span></label>
                                <textarea
                                    className={styles.textarea}
                                    rows={4}
                                    placeholder="Describe what happened — when, where, who was involved, and any steps you&apos;ve already taken…"
                                    value={fDesc}
                                    onChange={e => { setFDesc(e.target.value); setFError(""); }}
                                />
                            </div>

                            {/* Image upload */}
                            <div className={styles.field}>
                                <label className={styles.label}>
                                    Attachments
                                    <span className={styles.labelNote}>PNG, JPG · up to 8 files</span>
                                </label>
                                <div
                                    className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ""}`}
                                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className={styles.dropZoneIcon}>
                                        <svg viewBox="0 0 24 24" fill="none" width="26" height="26"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7"/><circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    </div>
                                    <p className={styles.dropZoneText}>{isDragging ? "Release to attach" : "Drag & drop images here"}</p>
                                    <p className={styles.dropZoneHint}>or <span>click to browse</span></p>
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFileSelect} />

                                {fImages.length > 0 && (
                                    <div className={styles.previewGrid}>
                                        {fImages.map((img, i) => (
                                            <div key={i} className={styles.previewThumb}>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={img.preview} alt={img.name} />
                                                <button
                                                    type="button"
                                                    className={styles.previewRemove}
                                                    onClick={e => { e.stopPropagation(); setFImages(prev => prev.filter((_, j) => j !== i)); }}
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" width="9" height="9"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                                                </button>
                                            </div>
                                        ))}
                                        <button type="button" className={styles.addMoreBtn} onClick={() => fileInputRef.current?.click()}>
                                            <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                            <span>Add</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {fError && <p className={styles.errorMsg}>{fError}</p>}
                        </div>

                        <div className={styles.formFooter}>
                            <button className={styles.btnCancel} onClick={closeForm}>Cancel</button>
                            <div className={styles.formFooterRight}>
                                {fImages.length > 0 && <span className={styles.attachNote}>{fImages.length} file{fImages.length > 1 ? "s" : ""} attached</span>}
                                <button className={styles.btnSubmit} onClick={submitReport}>
                                    <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    Submit Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox */}
            {lightboxImg && (
                <div className={styles.lightbox} onClick={() => setLightboxImg(null)}>
                    <button className={styles.lightboxClose} onClick={() => setLightboxImg(null)}>
                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={lightboxImg} alt="" onClick={e => e.stopPropagation()} />
                </div>
            )}
        </>
    );
}
