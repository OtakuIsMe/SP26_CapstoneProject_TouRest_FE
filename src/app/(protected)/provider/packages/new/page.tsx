"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { providerService } from "@/libs/services/provider.service";
import { ServiceDTO } from "@/types/service.type";
import styles from "./page.module.scss";

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateCode(name: string): string {
    return name
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, "")
        .split(/\s+/)
        .filter(Boolean)
        .join("-")
        .slice(0, 32);
}

function formatVND(n: number) {
    return n.toLocaleString("vi-VN") + " ₫";
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function NewPackagePage() {
    const router = useRouter();

    // ── Form state ────────────────────────────────────────────────────────────
    const [name, setName]           = useState("");
    const [code, setCode]           = useState("");
    const [codeManual, setCodeManual] = useState(false);
    const [basePrice, setBasePrice] = useState("");

    // ── Services ──────────────────────────────────────────────────────────────
    const [services, setServices]   = useState<ServiceDTO[]>([]);
    const [selected, setSelected]   = useState<Set<string>>(new Set());
    const [svcLoading, setSvcLoading] = useState(true);
    const [search, setSearch]       = useState("");

    // ── UI state ──────────────────────────────────────────────────────────────
    const [errors, setErrors]       = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    // ── Fetch services ────────────────────────────────────────────────────────
    const fetchServices = useCallback(async () => {
        setSvcLoading(true);
        try {
            const res = await providerService.getServices({ pageSize: 100, status: "Active" });
            setServices(res.data.items ?? []);
        } catch {
            setServices([]);
        } finally {
            setSvcLoading(false);
        }
    }, []);

    useEffect(() => { fetchServices(); }, [fetchServices]);

    // ── Auto-generate code from name ──────────────────────────────────────────
    useEffect(() => {
        if (!codeManual) setCode(generateCode(name));
    }, [name, codeManual]);

    // ── Derived values ────────────────────────────────────────────────────────
    const selectedServices = services.filter((s) => selected.has(s.id));
    const servicesTotal    = selectedServices.reduce((sum, s) => sum + s.price, 0);
    const basePriceNum     = parseFloat(basePrice) || 0;
    const discount         = servicesTotal > 0 && basePriceNum > 0
        ? Math.round((1 - basePriceNum / servicesTotal) * 100)
        : 0;

    const filteredServices = services.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
    );

    // ── Toggle service selection ──────────────────────────────────────────────
    function toggleService(id: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    // ── Validate & submit ─────────────────────────────────────────────────────
    function validate(): boolean {
        const errs: Record<string, string> = {};
        if (!name.trim())   errs.name = "Package name is required.";
        if (!code.trim())   errs.code = "Package code is required.";
        if (!basePrice || isNaN(basePriceNum) || basePriceNum <= 0)
            errs.basePrice = "Enter a valid price.";
        if (selected.size === 0)
            errs.services = "Select at least one service.";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;
        setSubmitting(true);
        try {
            // TODO: call createPackage API when backend is ready
            await new Promise((r) => setTimeout(r, 600)); // mock delay
            router.push("/provider/packages");
        } catch {
            setErrors((prev) => ({ ...prev, submit: "Failed to create package. Please try again." }));
        } finally {
            setSubmitting(false);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
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
                <div className={styles.topActions}>
                    <Link href="/provider/packages" className={styles.btnCancel}>Cancel</Link>
                    <button
                        type="submit"
                        form="pkg-form"
                        className={styles.btnCreate}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <><span className={styles.spinner} /> Creating...</>
                        ) : (
                            <>
                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                                Create Package
                            </>
                        )}
                    </button>
                </div>
            </div>

            <form id="pkg-form" onSubmit={handleSubmit} noValidate>
                <div className={styles.layout}>

                    {/* ── Left column: details ── */}
                    <div className={styles.left}>

                        {/* Basic info */}
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>
                                <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                                    <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                </svg>
                                Package Details
                            </h2>

                            {/* Name */}
                            <div className={styles.field}>
                                <label className={styles.label}>
                                    Package Name <span className={styles.req}>*</span>
                                </label>
                                <input
                                    className={`${styles.input} ${errors.name ? styles.inputErr : ""}`}
                                    type="text"
                                    placeholder="e.g. Luxury Wellness Bundle"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                                {errors.name && <span className={styles.errMsg}>{errors.name}</span>}
                            </div>

                            {/* Code */}
                            <div className={styles.field}>
                                <div className={styles.codeLabelRow}>
                                    <label className={styles.label}>
                                        Package Code <span className={styles.req}>*</span>
                                    </label>
                                    {codeManual && (
                                        <button
                                            type="button"
                                            className={styles.resetCode}
                                            onClick={() => { setCodeManual(false); setCode(generateCode(name)); }}
                                        >
                                            ↺ Auto-generate
                                        </button>
                                    )}
                                </div>
                                <div className={styles.codeWrap}>
                                    <span className={styles.codePrefix}>#</span>
                                    <input
                                        className={`${styles.input} ${styles.codeInput} ${errors.code ? styles.inputErr : ""}`}
                                        type="text"
                                        placeholder="LUXURY-WELLNESS-BUNDLE"
                                        value={code}
                                        onChange={(e) => {
                                            setCodeManual(true);
                                            setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-_]/g, ""));
                                        }}
                                    />
                                </div>
                                {!errors.code && (
                                    <span className={styles.hint}>
                                        Auto-generated from name · only A–Z, 0–9, - allowed
                                    </span>
                                )}
                                {errors.code && <span className={styles.errMsg}>{errors.code}</span>}
                            </div>

                        </div>

                        {/* Pricing card */}
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>
                                <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Pricing
                            </h2>

                            {/* Comparison bar */}
                            <div className={styles.pricingCompare}>
                                <div className={styles.priceCol}>
                                    <span className={styles.priceColLabel}>Services Total</span>
                                    <span className={styles.priceColValue}>
                                        {selected.size === 0 ? "—" : formatVND(servicesTotal)}
                                    </span>
                                    <span className={styles.priceColSub}>
                                        {selected.size} service{selected.size !== 1 ? "s" : ""} selected
                                    </span>
                                </div>

                                <div className={styles.priceDivider}>
                                    {discount > 0 ? (
                                        <div className={styles.discountBadge}>
                                            <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                                                <path d="M20 12l-8 8-8-8M12 4v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            {discount}% off
                                        </div>
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16" style={{ color: "#d1d5db" }}>
                                            <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                        </svg>
                                    )}
                                </div>

                                <div className={styles.priceCol}>
                                    <span className={styles.priceColLabel}>Package Price</span>
                                    <span className={`${styles.priceColValue} ${styles.priceGreen}`}>
                                        {basePriceNum > 0 ? formatVND(basePriceNum) : "—"}
                                    </span>
                                    <span className={styles.priceColSub}>set below</span>
                                </div>
                            </div>

                            {/* Base price input */}
                            <div className={styles.field}>
                                <label className={styles.label}>
                                    Package Price (₫) <span className={styles.req}>*</span>
                                </label>
                                <div className={styles.priceInputWrap}>
                                    <input
                                        className={`${styles.input} ${errors.basePrice ? styles.inputErr : ""}`}
                                        type="number"
                                        min="0"
                                        step="1000"
                                        placeholder="e.g. 1500000"
                                        value={basePrice}
                                        onChange={(e) => setBasePrice(e.target.value)}
                                    />
                                    <span className={styles.priceSuffix}>₫</span>
                                </div>
                                {basePriceNum > 0 && (
                                    <span className={styles.pricePreview}>{formatVND(basePriceNum)}</span>
                                )}
                                {errors.basePrice && <span className={styles.errMsg}>{errors.basePrice}</span>}
                            </div>
                        </div>

                        {errors.submit && (
                            <div className={styles.submitErr}>
                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                                    <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                </svg>
                                {errors.submit}
                            </div>
                        )}
                    </div>

                    {/* ── Right column: service selector ── */}
                    <div className={styles.right}>
                        <div className={styles.card}>
                            <div className={styles.svcHeader}>
                                <div>
                                    <h2 className={styles.cardTitle}>
                                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
                                            <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M2 12h2M20 12h2M17.66 17.66l-1.41-1.41M6.34 17.66l1.41-1.41" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                        </svg>
                                        Select Services
                                    </h2>
                                    <p className={styles.svcSubtitle}>
                                        Choose services to include in this package
                                    </p>
                                </div>
                                <div className={styles.svcSelectedCount}>
                                    <span className={styles.svcCountNum}>{selected.size}</span>
                                    <span className={styles.svcCountLabel}>selected</span>
                                </div>
                            </div>

                            {errors.services && (
                                <div className={styles.svcError}>{errors.services}</div>
                            )}

                            {/* Search */}
                            <div className={styles.svcSearch}>
                                <svg viewBox="0 0 24 24" fill="none" width="15" height="15" className={styles.svcSearchIcon}>
                                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/>
                                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                </svg>
                                <input
                                    className={styles.svcSearchInput}
                                    type="text"
                                    placeholder="Search services..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            {/* Service list */}
                            <div className={styles.svcList}>
                                {svcLoading ? (
                                    <div className={styles.svcLoading}>
                                        <span className={styles.svcSpinner} />
                                        Loading services...
                                    </div>
                                ) : filteredServices.length === 0 ? (
                                    <div className={styles.svcEmpty}>No services found</div>
                                ) : (
                                    filteredServices.map((svc) => {
                                        const isSelected = selected.has(svc.id);
                                        return (
                                            <label
                                                key={svc.id}
                                                className={`${styles.svcItem} ${isSelected ? styles.svcItemSelected : ""}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className={styles.svcCheckbox}
                                                    checked={isSelected}
                                                    onChange={() => toggleService(svc.id)}
                                                />
                                                <div className={styles.svcCheckMark}>
                                                    {isSelected && (
                                                        <svg viewBox="0 0 24 24" fill="none" width="11" height="11">
                                                            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className={styles.svcInfo}>
                                                    <span className={styles.svcName}>{svc.name}</span>
                                                    {svc.description && (
                                                        <span className={styles.svcDesc}>{svc.description}</span>
                                                    )}
                                                    <div className={styles.svcMeta}>
                                                        <span className={styles.svcDuration}>
                                                            <svg viewBox="0 0 24 24" fill="none" width="11" height="11">
                                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                                                                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                                            </svg>
                                                            {svc.durationMinutes} min
                                                        </span>
                                                        <span className={`${styles.svcStatus} ${svc.status === "Active" ? styles.svcStatusActive : styles.svcStatusOff}`}>
                                                            {svc.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className={styles.svcPrice}>
                                                    <span className={styles.svcPriceMain}>{formatVND(svc.price)}</span>
                                                    {svc.basePrice > svc.price && (
                                                        <span className={styles.svcPriceOld}>{formatVND(svc.basePrice)}</span>
                                                    )}
                                                </div>
                                            </label>
                                        );
                                    })
                                )}
                            </div>

                            {/* Selected summary footer */}
                            {selected.size > 0 && (
                                <div className={styles.svcSummary}>
                                    <div className={styles.svcSummaryLeft}>
                                        <span>{selected.size} service{selected.size !== 1 ? "s" : ""}</span>
                                        <span className={styles.svcSummaryDot}>·</span>
                                        <span>
                                            {selectedServices.reduce((s, v) => s + v.durationMinutes, 0)} min total
                                        </span>
                                    </div>
                                    <span className={styles.svcSummaryTotal}>{formatVND(servicesTotal)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
