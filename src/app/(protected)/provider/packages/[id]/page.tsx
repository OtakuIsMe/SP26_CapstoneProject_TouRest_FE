"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { providerService } from "@/libs/services/provider.service";
import { PackageWithServicesDTO, PackageServiceItem } from "@/types/package.type";
import styles from "./page.module.scss";

function formatVND(n: number) {
    return n.toLocaleString("vi-VN") + "đ";
}

function fmtDuration(min: number) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return [h > 0 ? `${h}h` : "", m > 0 ? `${m}m` : ""].filter(Boolean).join(" ");
}

const STATUS_CLS: Record<string, string> = {
    Active:   styles.statusActive,
    Inactive: styles.statusInactive,
    Archived: styles.statusArchived,
};

const SVC_STATUS_CLS: Record<string, string> = {
    Active:       styles.svcStatusActive,
    Inactive:     styles.svcStatusOff,
    Discontinued: styles.svcStatusOff,
};

export default function PackageDetailPage() {
    const params   = useParams();
    const router   = useRouter();
    const id       = params.id as string;

    const [pkg, setPkg]       = useState<PackageWithServicesDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]   = useState("");

    useEffect(() => {
        providerService.getPackageDetail(id)
            .then(res => {
                if (res.data) setPkg(res.data);
                else setError("Package not found.");
            })
            .catch(() => setError("Failed to load package."))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className={styles.center}>
                <span className={styles.spinner} />
            </div>
        );
    }

    if (error || !pkg) {
        return (
            <div className={styles.center}>
                <p className={styles.errorText}>{error || "Package not found."}</p>
                <Link href="/provider/packages" className={styles.backLink}>← Back to Packages</Link>
            </div>
        );
    }

    const totalDuration = pkg.services.reduce((s, v) => s + v.serviceDurationMinutes, 0);
    const servicesTotal = pkg.services.reduce((s, v) => s + v.servicePrice, 0);
    const discount      = servicesTotal > 0
        ? Math.round((1 - pkg.basePrice / servicesTotal) * 100)
        : 0;

    return (
        <div className={styles.page}>
            {/* ── Top bar ── */}
            <div className={styles.topBar}>
                <Link href="/provider/packages" className={styles.backBtn}>
                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                        <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Back to Packages
                </Link>
                <button
                    className={styles.btnEdit}
                    onClick={() => router.push(`/provider/packages/${id}/edit`)}
                >
                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Edit Package
                </button>
            </div>

            <div className={styles.layout}>
                {/* ── Left: package info ── */}
                <div className={styles.left}>

                    {/* Hero card */}
                    <div className={styles.heroCard}>
                        <div className={styles.heroIcon}>
                            <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
                                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
                                    stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                                <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <div className={styles.heroMeta}>
                            <div className={styles.heroRow}>
                                <h1 className={styles.heroName}>{pkg.name}</h1>
                                <span className={`${styles.statusBadge} ${STATUS_CLS[pkg.status] ?? styles.statusInactive}`}>
                                    {pkg.status}
                                </span>
                            </div>
                            <span className={styles.heroCode}>#{pkg.code}</span>
                        </div>
                    </div>

                    {/* Stats grid */}
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <span className={styles.statIcon}>
                                <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#dbeafe"/>
                                    <path d="M12 6v6l4 2" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round"/>
                                </svg>
                            </span>
                            <span className={styles.statLabel}>Package Price</span>
                            <span className={styles.statValue}>{formatVND(pkg.basePrice)}</span>
                            {discount > 0 && (
                                <span className={styles.discountTag}>Save {discount}%</span>
                            )}
                        </div>

                        <div className={styles.statCard}>
                            <span className={styles.statIcon}>
                                <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                    <circle cx="12" cy="12" r="10" fill="#dcfce7"/>
                                    <path d="M9 11l3 3 5-5" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </span>
                            <span className={styles.statLabel}>Services</span>
                            <span className={styles.statValue}>{pkg.services.length}</span>
                        </div>

                        <div className={styles.statCard}>
                            <span className={styles.statIcon}>
                                <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                    <circle cx="12" cy="12" r="10" fill="#fef3c7"/>
                                    <path d="M12 7v5l3 3" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round"/>
                                </svg>
                            </span>
                            <span className={styles.statLabel}>Total Duration</span>
                            <span className={styles.statValue}>{fmtDuration(totalDuration)}</span>
                        </div>

                        <div className={styles.statCard}>
                            <span className={styles.statIcon}>
                                <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                    <rect x="3" y="4" width="18" height="18" rx="2" fill="#ede9fe"/>
                                    <path d="M16 2v4M8 2v4M3 10h18" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round"/>
                                </svg>
                            </span>
                            <span className={styles.statLabel}>Created</span>
                            <span className={styles.statValue}>
                                {new Date(pkg.createdAt).toLocaleDateString("en-GB")}
                            </span>
                        </div>
                    </div>

                    {/* Pricing breakdown */}
                    {servicesTotal > 0 && (
                        <div className={styles.pricingCard}>
                            <h3 className={styles.sectionTitle}>Pricing Breakdown</h3>
                            <div className={styles.pricingRow}>
                                <span className={styles.pricingLabel}>Individual services total</span>
                                <span className={styles.pricingValue}>{formatVND(servicesTotal)}</span>
                            </div>
                            <div className={styles.pricingRow}>
                                <span className={styles.pricingLabel}>Package price</span>
                                <span className={`${styles.pricingValue} ${styles.priceGreen}`}>{formatVND(pkg.basePrice)}</span>
                            </div>
                            {discount > 0 && (
                                <div className={`${styles.pricingRow} ${styles.savingsRow}`}>
                                    <span className={styles.pricingLabel}>Customer saves</span>
                                    <span className={styles.savingsValue}>
                                        {formatVND(servicesTotal - pkg.basePrice)} ({discount}% off)
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Right: services list ── */}
                <div className={styles.right}>
                    <div className={styles.servicesCard}>
                        <div className={styles.servicesHeader}>
                            <h3 className={styles.sectionTitle}>
                                <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
                                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
                                    <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M2 12h2M20 12h2M17.66 17.66l-1.41-1.41M6.34 17.66l1.41-1.41" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                </svg>
                                Included Services
                            </h3>
                            <span className={styles.serviceCount}>{pkg.services.length}</span>
                        </div>

                        {pkg.services.length === 0 ? (
                            <div className={styles.empty}>No services in this package</div>
                        ) : (
                            <div className={styles.serviceList}>
                                {pkg.services.map((svc: PackageServiceItem, idx: number) => {
                                    const hasDiscount = svc.serviceBasePrice > svc.servicePrice;
                                    return (
                                        <div key={svc.serviceId} className={styles.serviceItem}>
                                            <div className={styles.svcIndex}>{idx + 1}</div>
                                            <div className={styles.svcBody}>
                                                <div className={styles.svcTop}>
                                                    <span className={styles.svcName}>{svc.serviceName}</span>
                                                    <span className={`${styles.svcStatusBadge} ${SVC_STATUS_CLS[svc.serviceStatus ?? ""] ?? styles.svcStatusOff}`}>
                                                        {svc.serviceStatus}
                                                    </span>
                                                </div>
                                                {svc.serviceDescription && (
                                                    <p className={styles.svcDesc}>{svc.serviceDescription}</p>
                                                )}
                                                <div className={styles.svcMeta}>
                                                    <span className={styles.svcMetaItem}>
                                                        <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                                                            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                                        </svg>
                                                        {fmtDuration(svc.serviceDurationMinutes)}
                                                    </span>
                                                    <span className={styles.svcMetaDot}>·</span>
                                                    <span className={styles.svcMetaItem}>
                                                        {formatVND(svc.servicePrice)}
                                                        {hasDiscount && (
                                                            <span className={styles.svcOldPrice}>{formatVND(svc.serviceBasePrice)}</span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Summary footer */}
                        {pkg.services.length > 0 && (
                            <div className={styles.serviceFooter}>
                                <div className={styles.footerRow}>
                                    <span>{pkg.services.length} service{pkg.services.length !== 1 ? "s" : ""}</span>
                                    <span className={styles.footerDot}>·</span>
                                    <span>{fmtDuration(totalDuration)} total</span>
                                </div>
                                <span className={styles.footerTotal}>{formatVND(servicesTotal)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
