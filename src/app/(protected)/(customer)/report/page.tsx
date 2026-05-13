"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Header from "@/components/layouts/header/header";
import { authService } from "@/libs/services/auth.service";
import { userService } from "@/libs/services/user.service";
import { reportService, ReportDTO, ReportItemType, ReportStatus } from "@/libs/services/report.service";
import styles from "./page.module.scss";

// ── Visual config ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<ReportStatus, { label: string; color: string; bg: string; dot: string; desc: string }> = {
    Pending:  { label: "Pending",   color: "#92400e", bg: "#fef9c3", dot: "#f59e0b", desc: "Waiting for review" },
    Reviewed: { label: "In Review", color: "#1e3a8a", bg: "#dbeafe", dot: "#3b82f6", desc: "Being reviewed by admin" },
    Resolved: { label: "Resolved",  color: "#14532d", bg: "#dcfce7", dot: "#22c55e", desc: "Issue has been resolved" },
    Rejected: { label: "Rejected",  color: "#4b5563", bg: "#f3f4f6", dot: "#9ca3af", desc: "Report not accepted" },
};

const ITEM_TYPE_CFG: Record<ReportItemType, { label: string; color: string; bg: string; icon: string; desc: string }> = {
    Service:  { label: "Service",  color: "#b91c1c", bg: "#fee2e2", icon: "⚠️", desc: "Issue with a service" },
    Package:  { label: "Package",  color: "#1e40af", bg: "#dbeafe", icon: "📦", desc: "Issue with a package" },
    Booking:  { label: "Booking",  color: "#92400e", bg: "#fef3c7", icon: "📅", desc: "Issue with a booking" },
    Feedback: { label: "Feedback", color: "#065f46", bg: "#d1fae5", icon: "📝", desc: "General feedback" },
    User:     { label: "Other",    color: "#374151", bg: "#f3f4f6", icon: "•",  desc: "Other issue" },
};

function fmtDate(s?: string) {
    if (!s) return "—";
    return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

interface PreviewFile { preview: string; file: File; }

export default function CustomerReportPage() {
    const [reports, setReports]         = useState<ReportDTO[]>([]);
    const [loading, setLoading]         = useState(true);
    const [viewTarget, setViewTarget]   = useState<ReportDTO | null>(null);
    const [lightboxImg, setLightboxImg] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);

    // ── Form state ──
    const [formOpen, setFormOpen]       = useState(false);
    const [fTitle, setFTitle]           = useState("");
    const [fItemType, setFItemType]     = useState<ReportItemType>("Booking");
    const [fDesc, setFDesc]             = useState("");
    const [fImages, setFImages]         = useState<PreviewFile[]>([]);
    const [isDragging, setIsDragging]   = useState(false);
    const [fError, setFError]           = useState("");
    const [submitting, setSubmitting]   = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Load ──
    const loadReports = useCallback(async (username: string) => {
        try {
            const res = await reportService.search({ userName: username });
            setReports(res.data ?? []);
        } catch {
            setReports([]);
        }
    }, []);

    useEffect(() => {
        authService.getMe()
            .then(async res => {
                const user = res.data;
                setCurrentUser({ id: user.id, username: user.username });
                await loadReports(user.username);
            })
            .finally(() => setLoading(false));
    }, [loadReports]);

    // ── Image helpers ──
    const processFiles = (files: FileList | File[]) => {
        Array.from(files)
            .filter(f => f.type.startsWith("image/"))
            .slice(0, 8 - fImages.length)
            .forEach(file => {
                const reader = new FileReader();
                reader.onload = e => setFImages(prev => [...prev, { preview: e.target?.result as string, file }]);
                reader.readAsDataURL(file);
            });
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) processFiles(e.target.files);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setIsDragging(false);
        processFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/")));
    };

    // ── Submit ──
    const submitReport = async () => {
        if (!fTitle.trim()) { setFError("Please enter a report title."); return; }
        if (!fDesc.trim())  { setFError("Please describe the issue."); return; }
        if (!currentUser)   { setFError("Not logged in."); return; }

        setSubmitting(true); setFError("");
        try {
            // Upload all images first
            const imageUrls: string[] = [];
            for (const img of fImages) {
                const uploadRes = await userService.uploadImage(img.file);
                imageUrls.push(uploadRes.data.url);
            }

            await reportService.create({
                userId:      currentUser.id,
                title:       fTitle.trim(),
                description: fDesc.trim(),
                itemId:      currentUser.id,
                itemType:    fItemType,
                status:      "Pending",
                imageUrls:   imageUrls.length > 0 ? imageUrls : undefined,
            });

            await loadReports(currentUser.username);
            closeForm();
        } catch {
            setFError("Failed to submit. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const closeForm = () => {
        setFormOpen(false);
        setFTitle(""); setFItemType("Booking"); setFDesc("");
        setFImages([]); setFError("");
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <>
            <Header variant="solid" />

            <main className={styles.page}>
                <div className={styles.container}>

                    {/* Page header */}
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

                    {/* Status legend */}
                    <div className={styles.statusLegend}>
                        {(Object.entries(STATUS_CFG) as [ReportStatus, typeof STATUS_CFG[ReportStatus]][]).map(([k, v]) => (
                            <div key={k} className={styles.legendItem}>
                                <span className={styles.legendDot} style={{ background: v.dot }} />
                                <span className={styles.legendLabel}>{v.label}</span>
                                <span className={styles.legendDesc}>{v.desc}</span>
                            </div>
                        ))}
                    </div>

                    {/* Report list */}
                    {loading ? (
                        <div className={styles.loadingWrap}>
                            <div className={styles.spinner} />
                            <p>Loading reports…</p>
                        </div>
                    ) : reports.length === 0 ? (
                        <div className={styles.emptyState}>
                            <svg viewBox="0 0 24 24" fill="none" width="48" height="48"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                            <p>No reports yet</p>
                            <span>Encountered an issue? Submit a report and our team will help.</span>
                            <button className={styles.newReportBtn} onClick={() => setFormOpen(true)}>Submit Your First Report</button>
                        </div>
                    ) : (
                        <div className={styles.reportList}>
                            {reports.map((r, idx) => {
                                const tc = ITEM_TYPE_CFG[r.itemType] ?? ITEM_TYPE_CFG.User;
                                const sc = STATUS_CFG[r.status] ?? STATUS_CFG.Pending;
                                return (
                                    <div key={r.id ?? idx} className={styles.reportCard} onClick={() => setViewTarget(r)}>
                                        <div className={styles.priorityStripe} style={{ background: tc.color }} />
                                        <div className={styles.reportCardBody}>
                                            <div className={styles.reportCardTop}>
                                                <span className={styles.typeBadge} style={{ background: tc.bg, color: tc.color }}>
                                                    {tc.icon} {tc.label}
                                                </span>
                                                <span className={styles.statusBadge} style={{ background: sc.bg, color: sc.color }}>
                                                    <span className={styles.statusDot} style={{ background: sc.dot }} />
                                                    {sc.label}
                                                </span>
                                            </div>
                                            <p className={styles.reportTitle}>{r.title}</p>
                                            <p className={styles.reportDesc}>{r.description}</p>
                                            <div className={styles.reportCardMeta}>
                                                {r.imageUrls && r.imageUrls.length > 0 && (
                                                    <span className={styles.metaChip}>
                                                        <svg viewBox="0 0 24 24" fill="none" width="10" height="10"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                                        {r.imageUrls.length} image{r.imageUrls.length > 1 ? "s" : ""}
                                                    </span>
                                                )}
                                                <span className={styles.metaChip} style={{ marginLeft: "auto" }}>
                                                    <svg viewBox="0 0 24 24" fill="none" width="10" height="10"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                                    {fmtDate(r.createdAt)}
                                                </span>
                                            </div>
                                        </div>

                                        {r.imageUrls && r.imageUrls.length > 0 && (
                                            <div className={styles.imageStrip}>
                                                {r.imageUrls.slice(0, 3).map((img, i) => (
                                                    <div key={i} className={styles.stripThumb} onClick={e => { e.stopPropagation(); setLightboxImg(img); }}>
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={img} alt="" />
                                                        {i === 2 && r.imageUrls!.length > 3 && (
                                                            <div className={styles.stripMore}>+{r.imageUrls!.length - 3}</div>
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
                                <span className={styles.typeBadge} style={{ background: ITEM_TYPE_CFG[viewTarget.itemType]?.bg, color: ITEM_TYPE_CFG[viewTarget.itemType]?.color }}>
                                    {ITEM_TYPE_CFG[viewTarget.itemType]?.icon} {ITEM_TYPE_CFG[viewTarget.itemType]?.label}
                                </span>
                                <span className={styles.statusBadge} style={{ background: STATUS_CFG[viewTarget.status]?.bg, color: STATUS_CFG[viewTarget.status]?.color }}>
                                    <span className={styles.statusDot} style={{ background: STATUS_CFG[viewTarget.status]?.dot }} />
                                    {STATUS_CFG[viewTarget.status]?.label}
                                </span>
                            </div>
                            <button className={styles.closeBtn} onClick={() => setViewTarget(null)}>
                                <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"/></svg>
                            </button>
                        </div>
                        <div className={styles.detailBody}>
                            <h2 className={styles.detailTitle}>{viewTarget.title}</h2>
                            <div className={styles.detailMetaGrid}>
                                <div className={styles.detailMetaItem}>
                                    <span className={styles.detailMetaKey}>Submitted</span>
                                    <span className={styles.detailMetaVal}>{fmtDate(viewTarget.createdAt)}</span>
                                </div>
                                <div className={styles.detailMetaItem}>
                                    <span className={styles.detailMetaKey}>Last updated</span>
                                    <span className={styles.detailMetaVal}>{fmtDate(viewTarget.updatedAt)}</span>
                                </div>
                                <div className={styles.detailMetaItem}>
                                    <span className={styles.detailMetaKey}>Status</span>
                                    <span className={styles.detailMetaVal}>{STATUS_CFG[viewTarget.status]?.label}</span>
                                </div>
                            </div>
                            <div className={styles.detailSection}>
                                <p className={styles.detailSectionTitle}>Description</p>
                                <p className={styles.detailDesc}>{viewTarget.description}</p>
                            </div>
                            {viewTarget.imageUrls && viewTarget.imageUrls.length > 0 && (
                                <div className={styles.detailSection}>
                                    <p className={styles.detailSectionTitle}>Attachments ({viewTarget.imageUrls.length})</p>
                                    <div className={styles.detailImageGrid}>
                                        {viewTarget.imageUrls.map((img, i) => (
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
                            {/* Category */}
                            <div className={styles.field}>
                                <label className={styles.label}>Report Category <span className={styles.required}>*</span></label>
                                <div className={styles.typeGrid}>
                                    {(Object.keys(ITEM_TYPE_CFG) as ReportItemType[]).map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            className={`${styles.typeOption} ${fItemType === t ? styles.typeOptionActive : ""}`}
                                            style={fItemType === t ? { borderColor: ITEM_TYPE_CFG[t].color, background: ITEM_TYPE_CFG[t].bg, color: ITEM_TYPE_CFG[t].color } : {}}
                                            onClick={() => setFItemType(t)}
                                        >
                                            <span className={styles.typeIcon}>{ITEM_TYPE_CFG[t].icon}</span>
                                            <span className={styles.typeLabel}>{ITEM_TYPE_CFG[t].label}</span>
                                            <span className={styles.typeDesc}>{ITEM_TYPE_CFG[t].desc}</span>
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

                            {/* Description */}
                            <div className={styles.field}>
                                <label className={styles.label}>Description <span className={styles.required}>*</span></label>
                                <textarea
                                    className={styles.textarea}
                                    rows={4}
                                    placeholder="Describe what happened — when, where, who was involved…"
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

                                {fImages.length < 8 && (
                                    <div
                                        className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ""}`}
                                        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <div className={styles.dropZoneIcon}>
                                            <svg viewBox="0 0 24 24" fill="none" width="28" height="28"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.6"/><circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                        </div>
                                        <p className={styles.dropZoneText}>{isDragging ? "Release to attach" : "Drag & drop images here"}</p>
                                        <p className={styles.dropZoneHint}>or <span>click to browse</span></p>
                                    </div>
                                )}

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    style={{ display: "none" }}
                                    onChange={handleFileSelect}
                                />

                                {fImages.length > 0 && (
                                    <div className={styles.previewGrid}>
                                        {fImages.map((img, i) => (
                                            <div key={i} className={styles.previewThumb}>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={img.preview} alt={img.file.name} />
                                                <button
                                                    type="button"
                                                    className={styles.previewRemove}
                                                    onClick={e => { e.stopPropagation(); setFImages(prev => prev.filter((_, j) => j !== i)); }}
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" width="9" height="9"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                                                </button>
                                            </div>
                                        ))}
                                        {fImages.length < 8 && (
                                            <button type="button" className={styles.addMoreBtn} onClick={() => fileInputRef.current?.click()}>
                                                <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                                <span>Add</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {fError && <p className={styles.errorMsg}>{fError}</p>}
                        </div>

                        <div className={styles.formFooter}>
                            <button className={styles.btnCancel} onClick={closeForm} disabled={submitting}>Cancel</button>
                            <div className={styles.formFooterRight}>
                                {fImages.length > 0 && (
                                    <span className={styles.attachNote}>{fImages.length} file{fImages.length > 1 ? "s" : ""} attached</span>
                                )}
                                <button className={styles.btnSubmit} onClick={submitReport} disabled={submitting}>
                                    {submitting ? (
                                        <>
                                            <div className={styles.btnSpinner} />
                                            {fImages.length > 0 ? "Uploading…" : "Submitting…"}
                                        </>
                                    ) : (
                                        <>
                                            <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                            Submit Report
                                        </>
                                    )}
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
