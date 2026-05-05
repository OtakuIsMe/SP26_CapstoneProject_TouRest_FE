"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { adminService } from "@/libs/services/admin.service";
import { ProviderDetailDTO, ProviderDTO } from "@/types/provider.type";
import { AgencyDetailDTO, AgencyDTO } from "@/types/agency.type";
import DataTable, { ActionDef, ColumnDef } from "@/components/commons/data-table/DataTable";
import styles from "./page.module.scss";

type Tab = "providers" | "agencies";
type EntityKind = "agency" | "provider";

interface ApproveTarget {
    id: string;
    name: string;
    kind: EntityKind;
}

interface AccountForm {
    email: string;
    password: string;
    username: string;
    phone: string;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    Pending:   { label: "Pending",   cls: styles.statusPending  },
    Active:    { label: "Approved",  cls: styles.statusApproved },
    Inactive:  { label: "Inactive",  cls: styles.statusRejected },
    Suspended: { label: "Suspended", cls: styles.statusRejected },
};

function StatusBadge({ status }: { status: string }) {
    const s = STATUS_MAP[status] ?? { label: status, cls: "" };
    return <span className={`${styles.badge} ${s.cls}`}>{s.label}</span>;
}

function NameCell({ name, avatarBg, avatarColor }: { name: string; avatarBg: string; avatarColor: string }) {
    return (
        <div className={styles.nameCell}>
            <div className={styles.avatar} style={{ background: avatarBg, color: avatarColor }}>
                {name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <span className={styles.nameText}>{name}</span>
        </div>
    );
}

function ApproveModal({
    target,
    onClose,
    onSuccess,
}: {
    target: ApproveTarget;
    onClose: () => void;
    onSuccess: (id: string) => void;
}) {
    const [form, setForm] = useState<AccountForm>({ email: "", password: "", username: "", phone: "" });
    const [showPw, setShowPw] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const overlayRef = useRef<HTMLDivElement>(null);

    const set = (k: keyof AccountForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.email || !form.password || !form.username) {
            setError("Email, password and username are required.");
            return;
        }
        if (form.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        setError("");
        setSubmitting(true);
        try {
            const body = {
                email: form.email,
                password: form.password,
                username: form.username,
                phone: form.phone || undefined,
            };
            if (target.kind === "agency") {
                await adminService.approveAgency(target.id);
                await adminService.createAgencyAccount(target.id, body);
            } else {
                await adminService.approveProvider(target.id);
                await adminService.createProviderAccount(target.id, body);
            }
            onSuccess(target.id);
            onClose();
        } catch {
            setError("Failed to approve. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className={styles.overlay}
            ref={overlayRef}
            onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <div>
                        <h2 className={styles.modalTitle}>Approve & Create Account</h2>
                        <p className={styles.modalSub}>
                            Creating account for <strong>{target.name}</strong>
                        </p>
                    </div>
                    <button className={styles.modalClose} onClick={onClose} type="button">
                        <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>

                <form className={styles.modalForm} onSubmit={handleSubmit}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Email <span className={styles.req}>*</span></label>
                        <input
                            type="email"
                            className={styles.input}
                            placeholder="account@email.com"
                            value={form.email}
                            onChange={set("email")}
                            autoFocus
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Username <span className={styles.req}>*</span></label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="username"
                            value={form.username}
                            onChange={set("username")}
                            maxLength={50}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Password <span className={styles.req}>*</span></label>
                        <div className={styles.pwWrap}>
                            <input
                                type={showPw ? "text" : "password"}
                                className={styles.input}
                                placeholder="Min. 6 characters"
                                value={form.password}
                                onChange={set("password")}
                            />
                            <button
                                type="button"
                                className={styles.pwToggle}
                                onClick={() => setShowPw((v) => !v)}
                            >
                                {showPw ? (
                                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                        <path d="M17.94 17.94A10.94 10.94 0 0112 20C7 20 2.73 16.11 1 12c.74-1.81 1.93-3.4 3.43-4.63M9.9 4.24A9.12 9.12 0 0112 4c5 0 9.27 3.89 11 8a10.89 10.89 0 01-1.41 2.6M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                        <path d="M1 12C2.73 7.89 7 4 12 4s9.27 3.89 11 8c-1.73 4.11-6 8-11 8S2.73 16.11 1 12z" stroke="currentColor" strokeWidth="2"/>
                                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Phone <span className={styles.opt}>(optional)</span></label>
                        <input
                            type="tel"
                            className={styles.input}
                            placeholder="+84..."
                            value={form.phone}
                            onChange={set("phone")}
                        />
                    </div>

                    {error && <p className={styles.errorMsg}>{error}</p>}

                    <div className={styles.modalActions}>
                        <button type="button" className={styles.btnCancel} onClick={onClose} disabled={submitting}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.btnApprove} disabled={submitting}>
                            {submitting ? "Approving…" : "Approve & Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ProviderDetailModal({
    providerId,
    onClose,
}: {
    providerId: string;
    onClose: () => void;
}) {
    const [detail, setDetail] = useState<ProviderDetailDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [imgIndex, setImgIndex] = useState(0);
    const [descExpanded, setDescExpanded] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        adminService.getProviderDetail(providerId)
            .then((res) => setDetail(res.data ?? null))
            .finally(() => setLoading(false));
    }, [providerId]);

    const fmt = (t: string) => {
        const [h, m] = t.split(":");
        const hour = parseInt(h);
        return `${hour % 12 || 12}:${m} ${hour < 12 ? "AM" : "PM"}`;
    };

    const prev = () => detail && setImgIndex((i) => (i - 1 + detail.images.length) % detail.images.length);
    const next = () => detail && setImgIndex((i) => (i + 1) % detail.images.length);

    return (
        <div
            className={styles.overlay}
            ref={overlayRef}
            onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
            <div className={`${styles.modal} ${styles.detailModal}`}>

                {/* ── Hero image section ── */}
                <div className={styles.detailHero}>
                    {loading ? null : detail?.images.length ? (
                        <>
                            <Image
                                key={imgIndex}
                                src={detail.images[imgIndex]}
                                alt={`Photo ${imgIndex + 1}`}
                                fill
                                className={styles.heroImg}
                                style={{ objectFit: "cover" }}
                                unoptimized
                            />
                            <div className={styles.heroGradient} />

                            {detail.images.length > 1 && (
                                <>
                                    <button className={`${styles.galleryNav} ${styles.galleryPrev}`} onClick={prev}>‹</button>
                                    <button className={`${styles.galleryNav} ${styles.galleryNext}`} onClick={next}>›</button>
                                    <span className={styles.galleryCount}>
                                        {imgIndex + 1} / {detail.images.length}
                                    </span>
                                </>
                            )}
                        </>
                    ) : (
                        <div className={styles.heroNoImg}>
                            <svg viewBox="0 0 24 24" fill="none" width="40" height="40">
                                <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                                <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>No images uploaded</span>
                        </div>
                    )}

                    {/* Close button always on hero */}
                    <button className={styles.heroClose} onClick={onClose} type="button">
                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                        </svg>
                    </button>

                    {/* Provider name overlay */}
                    {!loading && detail && (
                        <div className={styles.heroMeta}>
                            <div>
                                <h2 className={styles.heroName}>{detail.name}</h2>
                                <p className={styles.heroSub}>Submitted {new Date(detail.createdAt).toLocaleDateString("en-GB")}</p>
                            </div>
                            <StatusBadge status={detail.status} />
                        </div>
                    )}
                </div>

                {/* ── Thumbnail strip ── */}
                {!loading && detail && detail.images.length > 1 && (
                    <div className={styles.thumbStrip}>
                        {detail.images.map((url, i) => (
                            <button
                                key={i}
                                className={`${styles.thumb} ${i === imgIndex ? styles.thumbActive : ""}`}
                                onClick={() => setImgIndex(i)}
                            >
                                <Image src={url} alt="" fill style={{ objectFit: "cover" }} unoptimized />
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Loading ── */}
                {loading && <div className={styles.detailLoading}>Loading details</div>}

                {/* ── Body ── */}
                {!loading && detail && (
                    <div className={styles.detailBody}>
                        <div className={styles.infoCards}>
                            {/* Email */}
                            <div className={styles.infoCard}>
                                <div className={`${styles.infoIcon} ${styles.iconBlue}`}>
                                    <svg viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.7"/><path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.7"/></svg>
                                </div>
                                <div className={styles.infoCardContent}>
                                    <span className={styles.infoCardLabel}>Email</span>
                                    <a href={`mailto:${detail.contactEmail}`} className={styles.infoCardLink}>{detail.contactEmail}</a>
                                </div>
                            </div>

                            {/* Phone */}
                            <div className={styles.infoCard}>
                                <div className={`${styles.infoIcon} ${styles.iconGreen}`}>
                                    <svg viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 013.09 4.18 2 2 0 015.09 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L9.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.7"/></svg>
                                </div>
                                <div className={styles.infoCardContent}>
                                    <span className={styles.infoCardLabel}>Phone</span>
                                    <span className={styles.infoCardValue}>{detail.contactPhone || "—"}</span>
                                </div>
                            </div>

                            {/* Hours */}
                            <div className={styles.infoCard}>
                                <div className={`${styles.infoIcon} ${styles.iconOrange}`}>
                                    <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                                </div>
                                <div className={styles.infoCardContent}>
                                    <span className={styles.infoCardLabel}>Opening Hours</span>
                                    <span className={styles.infoCardValue}>{fmt(detail.startTime)} – {fmt(detail.endTime)}</span>
                                </div>
                            </div>

                            {/* Address (full width) */}
                            <div className={`${styles.infoCard} ${styles.infoCardWide}`}>
                                <div className={`${styles.infoIcon} ${styles.iconTeal}`}>
                                    <svg viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="1.7"/><path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.7"/></svg>
                                </div>
                                <div className={styles.infoCardContent}>
                                    <span className={styles.infoCardLabel}>Address</span>
                                    <span className={styles.infoCardValue}>{detail.address || "—"}</span>
                                </div>
                            </div>
                        </div>

                        {/* OpenStreetMap */}
                        {detail.latitude !== 0 && detail.longitude !== 0 && (
                            <div className={styles.mapSection}>
                                <div className={styles.mapHeader}>
                                    <div className={`${styles.infoIcon} ${styles.iconPurple}`} style={{ width: 28, height: 28 }}>
                                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.7"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.7"/></svg>
                                    </div>
                                    <span className={styles.mapTitle}>Location</span>
                                    <span className={styles.mapCoords}>
                                        {Number(detail.latitude).toFixed(6)}, {Number(detail.longitude).toFixed(6)}
                                    </span>
                                    <a
                                        href={`https://www.openstreetmap.org/?mlat=${detail.latitude}&mlon=${detail.longitude}#map=16/${detail.latitude}/${detail.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.mapLink}
                                    >
                                        Open in OSM ↗
                                    </a>
                                </div>
                                <iframe
                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(detail.longitude) - 0.008},${Number(detail.latitude) - 0.006},${Number(detail.longitude) + 0.008},${Number(detail.latitude) + 0.006}&layer=mapnik&marker=${detail.latitude},${detail.longitude}`}
                                    title="Provider location"
                                    loading="lazy"
                                    style={{ width: "100%", height: 240, border: "none", display: "block" }}
                                />
                            </div>
                        )}

                        {/* Description with Read More */}
                        {detail.description && (
                            <div className={styles.descSection}>
                                <p className={styles.descTitle}>About this provider</p>
                                <p className={`${styles.descText} ${!descExpanded ? styles.descClamped : ""}`}>
                                    {detail.description}
                                </p>
                                {detail.description.length > 220 && (
                                    <button
                                        className={styles.readMoreBtn}
                                        onClick={() => setDescExpanded((v) => !v)}
                                    >
                                        {descExpanded ? "Show less ↑" : "Read more ↓"}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function AgencyDetailModal({
    agencyId,
    onClose,
}: {
    agencyId: string;
    onClose: () => void;
}) {
    const [detail, setDetail] = useState<AgencyDetailDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [imgIndex, setImgIndex] = useState(0);
    const [descExpanded, setDescExpanded] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        adminService.getAgencyDetail(agencyId)
            .then((res) => setDetail(res.data ?? null))
            .finally(() => setLoading(false));
    }, [agencyId]);

    const fmt = (t: string) => {
        const [h, m] = t.split(":");
        const hour = parseInt(h);
        return `${hour % 12 || 12}:${m} ${hour < 12 ? "AM" : "PM"}`;
    };

    const prev = () => detail && setImgIndex((i) => (i - 1 + detail.images.length) % detail.images.length);
    const next = () => detail && setImgIndex((i) => (i + 1) % detail.images.length);

    return (
        <div
            className={styles.overlay}
            ref={overlayRef}
            onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
            <div className={`${styles.modal} ${styles.detailModal}`}>

                {/* ── Hero ── */}
                <div className={styles.detailHero}>
                    {loading ? null : detail?.images.length ? (
                        <>
                            <Image
                                key={imgIndex}
                                src={detail.images[imgIndex]}
                                alt={`Photo ${imgIndex + 1}`}
                                fill
                                className={styles.heroImg}
                                style={{ objectFit: "cover" }}
                                unoptimized
                            />
                            <div className={styles.heroGradient} />
                            {detail.images.length > 1 && (
                                <>
                                    <button className={`${styles.galleryNav} ${styles.galleryPrev}`} onClick={prev}>‹</button>
                                    <button className={`${styles.galleryNav} ${styles.galleryNext}`} onClick={next}>›</button>
                                    <span className={styles.galleryCount}>{imgIndex + 1} / {detail.images.length}</span>
                                </>
                            )}
                        </>
                    ) : (
                        <div className={styles.heroNoImg}>
                            <svg viewBox="0 0 24 24" fill="none" width="40" height="40">
                                <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                                <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>No images uploaded</span>
                        </div>
                    )}

                    <button className={styles.heroClose} onClick={onClose} type="button">
                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                        </svg>
                    </button>

                    {!loading && detail && (
                        <div className={styles.heroMeta}>
                            <div>
                                <h2 className={styles.heroName}>{detail.name}</h2>
                                <p className={styles.heroSub}>Submitted {new Date(detail.createdAt).toLocaleDateString("en-GB")}</p>
                            </div>
                            <StatusBadge status={detail.status} />
                        </div>
                    )}
                </div>

                {/* ── Thumbnails ── */}
                {!loading && detail && detail.images.length > 1 && (
                    <div className={styles.thumbStrip}>
                        {detail.images.map((url, i) => (
                            <button
                                key={i}
                                className={`${styles.thumb} ${i === imgIndex ? styles.thumbActive : ""}`}
                                onClick={() => setImgIndex(i)}
                            >
                                <Image src={url} alt="" fill style={{ objectFit: "cover" }} unoptimized />
                            </button>
                        ))}
                    </div>
                )}

                {loading && <div className={styles.detailLoading}>Loading details</div>}

                {!loading && detail && (
                    <div className={styles.detailBody}>
                        <div className={styles.infoCards}>
                            <div className={styles.infoCard}>
                                <div className={`${styles.infoIcon} ${styles.iconBlue}`}>
                                    <svg viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.7"/><path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.7"/></svg>
                                </div>
                                <div className={styles.infoCardContent}>
                                    <span className={styles.infoCardLabel}>Email</span>
                                    <a href={`mailto:${detail.contactEmail}`} className={styles.infoCardLink}>{detail.contactEmail}</a>
                                </div>
                            </div>

                            <div className={styles.infoCard}>
                                <div className={`${styles.infoIcon} ${styles.iconGreen}`}>
                                    <svg viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 013.09 4.18 2 2 0 015.09 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L9.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.7"/></svg>
                                </div>
                                <div className={styles.infoCardContent}>
                                    <span className={styles.infoCardLabel}>Phone</span>
                                    <span className={styles.infoCardValue}>{detail.contactPhone || "—"}</span>
                                </div>
                            </div>

                            <div className={styles.infoCard}>
                                <div className={`${styles.infoIcon} ${styles.iconOrange}`}>
                                    <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                                </div>
                                <div className={styles.infoCardContent}>
                                    <span className={styles.infoCardLabel}>Opening Hours</span>
                                    <span className={styles.infoCardValue}>{fmt(detail.startTime)} – {fmt(detail.endTime)}</span>
                                </div>
                            </div>

                            <div className={`${styles.infoCard} ${styles.infoCardWide}`}>
                                <div className={`${styles.infoIcon} ${styles.iconTeal}`}>
                                    <svg viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="1.7"/><path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.7"/></svg>
                                </div>
                                <div className={styles.infoCardContent}>
                                    <span className={styles.infoCardLabel}>Address</span>
                                    <span className={styles.infoCardValue}>{detail.address || "—"}</span>
                                </div>
                            </div>
                        </div>

                        {detail.latitude !== 0 && detail.longitude !== 0 && (
                            <div className={styles.mapSection}>
                                <div className={styles.mapHeader}>
                                    <div className={`${styles.infoIcon} ${styles.iconPurple}`} style={{ width: 28, height: 28 }}>
                                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.7"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.7"/></svg>
                                    </div>
                                    <span className={styles.mapTitle}>Location</span>
                                    <span className={styles.mapCoords}>{Number(detail.latitude).toFixed(6)}, {Number(detail.longitude).toFixed(6)}</span>
                                    <a
                                        href={`https://www.openstreetmap.org/?mlat=${detail.latitude}&mlon=${detail.longitude}#map=16/${detail.latitude}/${detail.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.mapLink}
                                    >Open in OSM ↗</a>
                                </div>
                                <iframe
                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(detail.longitude) - 0.008},${Number(detail.latitude) - 0.006},${Number(detail.longitude) + 0.008},${Number(detail.latitude) + 0.006}&layer=mapnik&marker=${detail.latitude},${detail.longitude}`}
                                    title="Agency location"
                                    loading="lazy"
                                    style={{ width: "100%", height: 240, border: "none", display: "block" }}
                                />
                            </div>
                        )}

                        {detail.description && (
                            <div className={styles.descSection}>
                                <p className={styles.descTitle}>About this agency</p>
                                <p className={`${styles.descText} ${!descExpanded ? styles.descClamped : ""}`}>
                                    {detail.description}
                                </p>
                                {detail.description.length > 220 && (
                                    <button
                                        className={styles.readMoreBtn}
                                        onClick={() => setDescExpanded((v) => !v)}
                                    >
                                        {descExpanded ? "Show less ↑" : "Read more ↓"}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AdminRequestsPage() {
    const [tab, setTab] = useState<Tab>("providers");

    const [providers, setProviders] = useState<ProviderDTO[]>([]);
    const [agencies,  setAgencies]  = useState<AgencyDTO[]>([]);
    const [loading,   setLoading]   = useState(true);

    const [approveTarget, setApproveTarget] = useState<ApproveTarget | null>(null);
    const [detailProviderId, setDetailProviderId] = useState<string | null>(null);
    const [detailAgencyId, setDetailAgencyId] = useState<string | null>(null);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [pRes, aRes] = await Promise.all([
                adminService.getProviders(),
                adminService.getAgencies(),
            ]);
            setProviders(pRes.data ?? []);
            setAgencies(aRes.data ?? []);
        } catch {
            setProviders([]);
            setAgencies([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ── Provider columns ──────────────────────────────────────────────────────
    const providerColumns: ColumnDef<ProviderDTO>[] = [
        {
            key: "name",
            label: "Provider",
            sortable: true,
            render: (row) => (
                <NameCell name={row.name} avatarBg="#dbeafe" avatarColor="#1d4ed8" />
            ),
        },
        {
            key: "contactEmail",
            label: "Email",
            sortable: true,
            render: (row) => (
                <a href={`mailto:${row.contactEmail}`} className={styles.emailLink}>
                    {row.contactEmail}
                </a>
            ),
        },
        {
            key: "contactPhone",
            label: "Phone",
            render: (row) => <span>{row.contactPhone || "—"}</span>,
        },
        {
            key: "status",
            label: "Status",
            render: (row) => <StatusBadge status={row.status} />,
        },
        {
            key: "createdAt",
            label: "Submitted",
            sortable: true,
            render: (row) => (
                <span>{new Date(row.createdAt).toLocaleDateString("en-GB")}</span>
            ),
        },
    ];

    const providerActions: ActionDef<ProviderDTO>[] = [
        {
            label: "View",
            variant: "view",
            onClick: (row) => setDetailProviderId(row.id),
        },
        {
            label: "Approve",
            variant: "edit",
            onClick: (row) => setApproveTarget({ id: row.id, name: row.name, kind: "provider" }),
        },
        {
            label: "Reject",
            variant: "delete",
            onClick: async (row) => {
                if (!confirm(`Reject provider "${row.name}"?`)) return;
                try {
                    await adminService.rejectProvider(row.id);
                    setProviders((prev) =>
                        prev.map((p) => (p.id === row.id ? { ...p, status: "Suspended" } : p))
                    );
                } catch {
                    alert("Failed to reject. Please try again.");
                }
            },
        },
    ];

    // ── Agency columns ────────────────────────────────────────────────────────
    const agencyColumns: ColumnDef<AgencyDTO>[] = [
        {
            key: "name",
            label: "Agency",
            sortable: true,
            render: (row) => (
                <NameCell name={row.name} avatarBg="#fef3c7" avatarColor="#92400e" />
            ),
        },
        {
            key: "contactEmail",
            label: "Email",
            sortable: true,
            render: (row) => (
                <a href={`mailto:${row.contactEmail}`} className={styles.emailLink}>
                    {row.contactEmail}
                </a>
            ),
        },
        {
            key: "contactPhone",
            label: "Phone",
            render: (row) => <span>{row.contactPhone || "—"}</span>,
        },
        {
            key: "status",
            label: "Status",
            render: (row) => <StatusBadge status={row.status} />,
        },
        {
            key: "createdAt",
            label: "Submitted",
            sortable: true,
            render: (row) => (
                <span>{new Date(row.createdAt).toLocaleDateString("en-GB")}</span>
            ),
        },
    ];

    const agencyActions: ActionDef<AgencyDTO>[] = [
        {
            label: "View",
            variant: "view",
            onClick: (row) => setDetailAgencyId(row.id),
        },
        {
            label: "Approve",
            variant: "edit",
            onClick: (row) => setApproveTarget({ id: row.id, name: row.name, kind: "agency" }),
        },
        {
            label: "Reject",
            variant: "delete",
            onClick: async (row) => {
                if (!confirm(`Reject agency "${row.name}"?`)) return;
                try {
                    await adminService.rejectAgency(row.id);
                    setAgencies((prev) =>
                        prev.map((a) => (a.id === row.id ? { ...a, status: "Suspended" } : a))
                    );
                } catch {
                    alert("Failed to reject. Please try again.");
                }
            },
        },
    ];

    const handleApproveSuccess = (id: string) => {
        if (approveTarget?.kind === "provider") {
            setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, status: "Active" } : p)));
        } else {
            setAgencies((prev) => prev.map((a) => (a.id === id ? { ...a, status: "Active" } : a)));
        }
    };

    // ── Stats helpers ─────────────────────────────────────────────────────────
    const data = tab === "providers" ? providers : agencies;
    const pending  = data.filter((r) => r.status === "Pending").length;
    const approved = data.filter((r) => r.status === "Active").length;
    const rejected = data.filter((r) => r.status === "Inactive" || r.status === "Suspended").length;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Registration Requests</h1>
                    <p className={styles.subtitle}>
                        Review and approve provider &amp; agency applications
                    </p>
                </div>
            </div>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${tab === "providers" ? styles.tabActive : ""}`}
                    onClick={() => setTab("providers")}
                >
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.7"/>
                        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Providers
                    {providers.filter((p) => p.status === "Pending").length > 0 && (
                        <span className={styles.tabBadge}>
                            {providers.filter((p) => p.status === "Pending").length}
                        </span>
                    )}
                </button>
                <button
                    className={`${styles.tab} ${tab === "agencies" ? styles.tabActive : ""}`}
                    onClick={() => setTab("agencies")}
                >
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M3 21V7l9-4 9 4v14" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                        <path d="M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                    </svg>
                    Agencies
                    {agencies.filter((a) => a.status === "Pending").length > 0 && (
                        <span className={styles.tabBadge}>
                            {agencies.filter((a) => a.status === "Pending").length}
                        </span>
                    )}
                </button>
            </div>

            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{data.length}</span>
                    <span className={styles.statLabel}>Total</span>
                </div>
                <div className={styles.statCard}>
                    <span className={`${styles.statValue} ${styles.orange}`}>{pending}</span>
                    <span className={styles.statLabel}>Pending</span>
                </div>
                <div className={styles.statCard}>
                    <span className={`${styles.statValue} ${styles.green}`}>{approved}</span>
                    <span className={styles.statLabel}>Approved</span>
                </div>
                <div className={styles.statCard}>
                    <span className={`${styles.statValue} ${styles.red}`}>{rejected}</span>
                    <span className={styles.statLabel}>Rejected</span>
                </div>
            </div>

            {tab === "providers" ? (
                <DataTable<ProviderDTO>
                    columns={providerColumns}
                    data={providers}
                    actions={providerActions}
                    searchPlaceholder="Search by name, email..."
                    loading={loading}
                    selectable
                    exportable
                    emptyText="No provider requests found"
                />
            ) : (
                <DataTable<AgencyDTO>
                    columns={agencyColumns}
                    data={agencies}
                    actions={agencyActions}
                    searchPlaceholder="Search by name, email..."
                    loading={loading}
                    selectable
                    exportable
                    emptyText="No agency requests found"
                />
            )}

            {approveTarget && (
                <ApproveModal
                    target={approveTarget}
                    onClose={() => setApproveTarget(null)}
                    onSuccess={handleApproveSuccess}
                />
            )}

            {detailProviderId && (
                <ProviderDetailModal
                    providerId={detailProviderId}
                    onClose={() => setDetailProviderId(null)}
                />
            )}

            {detailAgencyId && (
                <AgencyDetailModal
                    agencyId={detailAgencyId}
                    onClose={() => setDetailAgencyId(null)}
                />
            )}
        </div>
    );
}
