"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/layouts/header/header";
import Footer from "@/components/layouts/footer/footer";
import styles from "./page.module.scss";
import { agencyService } from "@/libs/services/agency.service";
import { ItineraryDTO } from "@/types/itinerary.type";

const steps = ["Travel Details", "Review & Pay"];

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

// ── Traveler info ──────────────────────────────────────────────────────────────
interface TravelerInfo {
    fullName:  string;
    idNumber:  string;  // CCCD / CMND
    phone:     string;
    age:       string;
}

function emptyTraveler(): TravelerInfo {
    return { fullName: "", idNumber: "", phone: "", age: "" };
}

function validateTravelerList(list: TravelerInfo[]): Record<number, Record<string, string>> {
    const errs: Record<number, Record<string, string>> = {};
    list.forEach((t, i) => {
        const e: Record<string, string> = {};
        if (!t.fullName.trim())  e.fullName  = "Please enter full name";
        if (!t.idNumber.trim())  e.idNumber  = "Please enter ID number";
        else if (!/^\d{9}$|^\d{12}$/.test(t.idNumber))
                                 e.idNumber  = "ID number must be 9 or 12 digits";
        if (!t.phone.trim())     e.phone     = "Please enter phone number";
        else if (!/^0\d{9}$/.test(t.phone.replace(/\s/g, "")))
                                 e.phone     = "Invalid phone number (e.g. 0912345678)";
        const ageNum = parseInt(t.age, 10);
        if (!t.age)              e.age       = "Please enter age";
        else if (isNaN(ageNum) || ageNum < 1 || ageNum > 120)
                                 e.age       = "Age must be between 1 and 120";
        if (Object.keys(e).length) errs[i] = e;
    });
    return errs;
}

export default function BookingPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const tourId = params.id as string;
    const scheduleId = searchParams.get("scheduleId");

    const [itinerary, setItinerary] = useState<ItineraryDTO | null>(null);
    const [authChecked, setAuthChecked] = useState(false);

    // Client-side auth guard — middleware handles the common case, this is a
    // fallback for when the role cookie is missing but localStorage still has a token.
    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            const current = window.location.pathname + window.location.search;
            router.replace(`/signin?redirect=${encodeURIComponent(current)}`);
            return;
        }
        setAuthChecked(true);
    }, [router]);

    useEffect(() => {
        if (!authChecked || !tourId) return;
        agencyService.getItineraryById(tourId).then((res) => {
            if (res.data) setItinerary(res.data);
        });
    }, [authChecked, tourId]);

    // Never silently fall back to a random schedule — require an explicit match.
    // Fall back to schedules[0] only when no scheduleId was provided at all.
    const selectedSchedule = scheduleId
        ? (itinerary?.schedules.find((s) => s.id === scheduleId) ?? null)
        : (itinerary?.schedules[0] ?? null);

    const tourName     = itinerary?.name ?? "Tour";
    const tourImage    = itinerary?.images?.[0]?.url ?? "/images/landing/explore_1.avif";
    const tourPrice    = itinerary?.price ?? 0;
    const tourDuration = itinerary?.durationDays ?? 0;
    const checkIn  = selectedSchedule ? formatDate(selectedSchedule.startTime) : "—";
    const checkOut = selectedSchedule ? formatDate(selectedSchedule.endTime)   : "—";

    // ── Schedule validity ──────────────────────────────────────────────────────
    type ScheduleProblem = "loading" | "not_found" | "expired" | "sold_out" | null;

    function getScheduleProblem(): ScheduleProblem {
        if (!itinerary) return "loading";
        if (!selectedSchedule) return "not_found";
        if (selectedSchedule.spotLeft <= 0) return "sold_out";
        if (new Date(selectedSchedule.startTime) < new Date()) return "expired";
        return null;
    }

    const scheduleProblem = getScheduleProblem();
    const canBook = scheduleProblem === null;

    const [step, setStep] = useState(0);

    const [form, setForm] = useState({
        travelers: 1,
        specialRequests: "",
        agreeTerms: false,
        agreeNewsletter: false,
    });

    const [travelerInfos, setTravelerInfos] = useState<TravelerInfo[]>([emptyTraveler()]);
    const [travelerErrors, setTravelerErrors] = useState<Record<number, Record<string, string>>>({});

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const set = (field: string, value: string | number | boolean) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    // Keep travelerInfos in sync when count changes
    function setTravelerCount(n: number) {
        const count = Math.max(1, n);
        set("travelers", count);
        setTravelerInfos(prev => {
            if (prev.length === count) return prev;
            if (prev.length < count)
                return [...prev, ...Array.from({ length: count - prev.length }, emptyTraveler)];
            return prev.slice(0, count);
        });
    }

    function updateTraveler(idx: number, field: keyof TravelerInfo, value: string) {
        setTravelerInfos(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
        // Clear error for this field on change
        setTravelerErrors(prev => {
            if (!prev[idx]?.[field]) return prev;
            const next = { ...prev };
            const iErrs = { ...next[idx] };
            delete iErrs[field];
            if (Object.keys(iErrs).length === 0) delete next[idx];
            else next[idx] = iErrs;
            return next;
        });
    }

    const handleNext = () => {
        if (step === 0) {
            const tErrs = validateTravelerList(travelerInfos);
            setTravelerErrors(tErrs);
            if (Object.keys(tErrs).length > 0) return;
        }
        setErrors({});
        setStep((s) => s + 1);
    };

    const handleSubmit = async () => {
        if (!form.agreeTerms) {
            setErrors({ agreeTerms: "You must agree to the terms" });
            return;
        }
        if (!scheduleId) {
            setErrors({ general: "Departure schedule not found. Please go back and try again." });
            return;
        }
        setErrors({});
        setSubmitting(true);
        try {
            const res = await agencyService.createBooking({
                scheduleId,
                numberOfGuests: form.travelers,
                customerNote: form.specialRequests || undefined,
                passengers: travelerInfos.map(t => ({
                    fullName: t.fullName.trim(),
                    idNumber: t.idNumber.trim(),
                    phone:    t.phone.trim(),
                    age:      parseInt(t.age, 10),
                })),
            });
            const bookingId = res.data.bookingId;
            const query = new URLSearchParams();
            query.set("bookingId", bookingId);
            query.set("scheduleId", scheduleId);
            query.set("travelers", String(form.travelers));
            router.push(`/tours/${tourId}/booking/payment?${query.toString()}`);
        } catch (err: unknown) {
            const apiMsg =
                (err as { response?: { data?: { message?: string } } })
                    ?.response?.data?.message;
            const msg = apiMsg ?? "Failed to create booking. Please try again.";
            setToast(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (!authChecked) return null;

    return (
        <>
            <Header variant="solid" />
            <main className={styles.page}>
                <div className={styles.container}>

                    {/* Breadcrumb */}
                    <nav className={styles.breadcrumb}>
                        <Link href="/">Home</Link>
                        <span>/</span>
                        <Link href="/tours">Tours</Link>
                        <span>/</span>
                        <Link href={`/tours/${tourId}`}>{tourName}</Link>
                        <span>/</span>
                        <span>Booking</span>
                    </nav>

                    <h1 className={styles.pageTitle}>Complete Your Booking</h1>

                    {/* Step indicator */}
                    <div className={styles.stepper}>
                        {steps.map((label, i) => (
                            <div key={label} className={styles.stepWrapper}>
                                <div className={`${styles.stepCircle} ${i <= step ? styles.stepActive : ""} ${i < step ? styles.stepDone : ""}`}>
                                    {i < step ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M5 12l5 5L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    ) : i + 1}
                                </div>
                                <span className={`${styles.stepLabel} ${i <= step ? styles.stepLabelActive : ""}`}>{label}</span>
                                {i < steps.length - 1 && <div className={`${styles.stepLine} ${i < step ? styles.stepLineDone : ""}`} />}
                            </div>
                        ))}
                    </div>

                    {/* ── Schedule problem: loading / not found / expired / sold out ── */}
                    {!canBook && (
                        <div className={styles.scheduleAlert}>
                            {scheduleProblem === "loading" ? (
                                <div className={styles.alertLoading}>
                                    <div className={styles.alertSpinner} />
                                    <p>Loading departure schedule…</p>
                                </div>
                            ) : (
                                <>
                                    <div className={styles.alertIconWrap}>
                                        {scheduleProblem === "sold_out" ? (
                                            <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.7"/>
                                                <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                                            </svg>
                                        ) : (
                                            <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
                                                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                                                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                                                <path d="M8 15l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
                                                <path d="M9 14l6 0M12 14v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.3"/>
                                            </svg>
                                        )}
                                    </div>
                                    <h2 className={styles.alertTitle}>
                                        {scheduleProblem === "sold_out"  && "Departure Schedule Fully Booked"}
                                        {scheduleProblem === "expired"   && "Departure Schedule Has Passed"}
                                        {scheduleProblem === "not_found" && "Schedule Not Found"}
                                    </h2>
                                    <p className={styles.alertSub}>
                                        {scheduleProblem === "sold_out"  && "All spots on this schedule have been booked. Please choose a different departure."}
                                        {scheduleProblem === "expired"   && "The departure date for this schedule has passed. Please choose an upcoming departure."}
                                        {scheduleProblem === "not_found" && "The selected departure schedule no longer exists or has been removed."}
                                    </p>
                                    <button
                                        className={styles.alertBtn}
                                        onClick={() => router.push(`/tours/${tourId}`)}
                                    >
                                        ← View Other Departures
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {canBook && <div className={styles.layout}>
                        {/* ── LEFT: Form ── */}
                        <div className={styles.formSide}>

                            {/* Step 0 — Travel Details */}
                            {step === 0 && (
                                <div className={styles.card}>
                                    <h2 className={styles.cardTitle}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                                        Passenger Information
                                    </h2>

                                    {/* Counter */}
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Number of Passengers <span>*</span></label>
                                        <div className={styles.counterRow}>
                                            <div className={styles.counter}>
                                                <button type="button" className={styles.counterBtn} onClick={() => setTravelerCount(form.travelers - 1)}>−</button>
                                                <span className={styles.counterVal}>{form.travelers}</span>
                                                <button type="button" className={styles.counterBtn} onClick={() => setTravelerCount(form.travelers + 1)}>+</button>
                                            </div>
                                            <span className={styles.counterHint}>Up to {selectedSchedule?.spotLeft ?? "—"} spots available</span>
                                        </div>
                                    </div>

                                    {/* Per-traveler forms */}
                                    <div className={styles.travelerList}>
                                        {travelerInfos.map((t, idx) => {
                                            const tErr = travelerErrors[idx] ?? {};
                                            const hasErr = Object.keys(tErr).length > 0;
                                            return (
                                                <div key={idx} className={`${styles.travelerCard} ${hasErr ? styles.travelerCardErr : ""}`}>
                                                    <div className={styles.travelerCardHead}>
                                                        <div className={styles.travelerBadge}>{idx + 1}</div>
                                                        <span className={styles.travelerCardTitle}>
                                                            {t.fullName.trim() || `Passenger ${idx + 1}`}
                                                        </span>
                                                        {hasErr && (
                                                            <span className={styles.travelerErrBadge}>
                                                                <svg viewBox="0 0 24 24" fill="none" width="11" height="11"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                                                Missing info
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className={styles.travelerFields}>
                                                        {/* Row 1: Full Name + Age */}
                                                        <div className={styles.travelerFieldGroup}>
                                                            <label className={styles.label}>Full Name <span>*</span></label>
                                                            <input
                                                                className={`${styles.input} ${tErr.fullName ? styles.inputError : ""}`}
                                                                type="text"
                                                                placeholder="John Doe"
                                                                value={t.fullName}
                                                                onChange={e => updateTraveler(idx, "fullName", e.target.value)}
                                                            />
                                                            {tErr.fullName && <span className={styles.errorMsg}>{tErr.fullName}</span>}
                                                        </div>

                                                        <div className={styles.travelerFieldGroup}>
                                                            <label className={styles.label}>Age <span>*</span></label>
                                                            <input
                                                                className={`${styles.input} ${tErr.age ? styles.inputError : ""}`}
                                                                type="number"
                                                                placeholder="25"
                                                                min={1}
                                                                max={120}
                                                                value={t.age}
                                                                onChange={e => updateTraveler(idx, "age", e.target.value)}
                                                            />
                                                            {tErr.age && <span className={styles.errorMsg}>{tErr.age}</span>}
                                                        </div>

                                                        {/* Row 2: ID + Phone */}
                                                        <div className={styles.travelerFieldGroup}>
                                                            <label className={styles.label}>ID Number <span>*</span></label>
                                                            <input
                                                                className={`${styles.input} ${tErr.idNumber ? styles.inputError : ""}`}
                                                                type="text"
                                                                placeholder="001234567890"
                                                                inputMode="numeric"
                                                                maxLength={12}
                                                                value={t.idNumber}
                                                                onChange={e => updateTraveler(idx, "idNumber", e.target.value.replace(/\D/g, ""))}
                                                            />
                                                            {tErr.idNumber && <span className={styles.errorMsg}>{tErr.idNumber}</span>}
                                                        </div>

                                                        <div className={styles.travelerFieldGroup}>
                                                            <label className={styles.label}>Phone Number <span>*</span></label>
                                                            <input
                                                                className={`${styles.input} ${tErr.phone ? styles.inputError : ""}`}
                                                                type="tel"
                                                                placeholder="0912 345 678"
                                                                inputMode="tel"
                                                                value={t.phone}
                                                                onChange={e => updateTraveler(idx, "phone", e.target.value)}
                                                            />
                                                            {tErr.phone && <span className={styles.errorMsg}>{tErr.phone}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Special requests */}
                                    <div className={styles.formGroup} style={{ marginTop: 20 }}>
                                        <label className={styles.label}>Special Requests / Health Notes</label>
                                        <textarea
                                            className={styles.textarea}
                                            rows={3}
                                            placeholder="Food allergies, medical conditions, room preferences or support needs…"
                                            value={form.specialRequests}
                                            onChange={(e) => set("specialRequests", e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Step 1 — Review */}
                            {step === 1 && (
                                <div className={styles.card}>
                                    <h2 className={styles.cardTitle}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                        Review Your Booking
                                    </h2>

                                    <div className={styles.reviewSection}>
                                        <h3 className={styles.reviewHeading}>Trip Details</h3>
                                        <div className={styles.reviewGrid}>
                                            <div className={styles.reviewItem}><span>Passengers</span><strong>{form.travelers}</strong></div>
                                            <div className={styles.reviewItem}><span>Departure</span><strong>{checkIn}</strong></div>
                                            <div className={styles.reviewItem}><span>Return</span><strong>{checkOut}</strong></div>
                                        </div>
                                        {form.specialRequests && (
                                            <div className={styles.reviewNote}>
                                                <span>Requests:</span> {form.specialRequests}
                                            </div>
                                        )}
                                    </div>

                                    {/* Traveler table */}
                                    <div className={styles.reviewSection}>
                                        <h3 className={styles.reviewHeading}>Passenger List</h3>
                                        <div className={styles.travelerTable}>
                                            <div className={styles.travelerTableHead}>
                                                <span>#</span>
                                                <span>Full Name</span>
                                                <span>Age</span>
                                                <span>ID Number</span>
                                                <span>Phone</span>
                                            </div>
                                            {travelerInfos.map((t, i) => (
                                                <div key={i} className={styles.travelerTableRow}>
                                                    <span className={styles.travelerTableNum}>{i + 1}</span>
                                                    <span className={styles.travelerTableName}>{t.fullName}</span>
                                                    <span>{t.age} yrs</span>
                                                    <span className={styles.travelerTableMono}>{t.idNumber}</span>
                                                    <span className={styles.travelerTableMono}>{t.phone}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={styles.divider} />

                                    <div className={styles.checkboxGroup}>
                                        <label className={`${styles.checkboxLabel} ${errors.agreeTerms ? styles.checkboxLabelError : ""}`}>
                                            <input
                                                type="checkbox"
                                                checked={form.agreeTerms}
                                                onChange={(e) => set("agreeTerms", e.target.checked)}
                                                className={styles.checkbox}
                                            />
                                            <span>I agree to the <Link href="#" className={styles.link}>Terms & Conditions</Link> and <Link href="#" className={styles.link}>Privacy Policy</Link> <span className={styles.required}>*</span></span>
                                        </label>
                                        {errors.agreeTerms && <span className={styles.errorMsg}>{errors.agreeTerms}</span>}

                                        <label className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={form.agreeNewsletter}
                                                onChange={(e) => set("agreeNewsletter", e.target.checked)}
                                                className={styles.checkbox}
                                            />
                                            <span>Subscribe to exclusive travel deals and health travel tips</span>
                                        </label>
                                    </div>
                                    {errors.general && <span className={styles.errorMsg}>{errors.general}</span>}
                                </div>
                            )}

                            {/* Navigation buttons */}
                            <div className={styles.navBtns}>
                                {step > 0 && (
                                    <button className={styles.backBtn} onClick={() => { setErrors({}); setStep((s) => s - 1); }}>
                                        ← Back
                                    </button>
                                )}
                                {step < steps.length - 1 ? (
                                    <button className={styles.nextBtn} onClick={handleNext}>
                                        Continue →
                                    </button>
                                ) : (
                                    <button className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
                                        {submitting ? "Processing..." : (
                                            <>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                Confirm Booking
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* ── RIGHT: Trip Summary ── */}
                        <aside className={styles.summarySide}>
                            <div className={styles.summaryCard}>
                                <h3 className={styles.summaryTitle}>Trip Summary</h3>

                                <div className={styles.summaryImage}>
                                    <Image src={tourImage} alt={tourName} fill sizes="320px" style={{ objectFit: "cover" }} />
                                </div>

                                <p className={styles.summaryTourName}>{tourName}</p>

                                <div className={styles.summaryDates}>
                                    <div className={styles.summaryDateBox}>
                                        <span className={styles.summaryDateLabel}>Check-in</span>
                                        <span className={styles.summaryDateVal}>{checkIn}</span>
                                    </div>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    <div className={styles.summaryDateBox}>
                                        <span className={styles.summaryDateLabel}>Check-out</span>
                                        <span className={styles.summaryDateVal}>{checkOut}</span>
                                    </div>
                                </div>

                                <div className={styles.summaryMeta}>
                                    <span>{tourDuration} days</span>
                                    <span>·</span>
                                    <span>{form.travelers} traveler{form.travelers > 1 ? "s" : ""}</span>
                                </div>

                                <div className={styles.summaryDivider} />

                                {form.travelers > 1 && (
                                    <div className={styles.summaryPriceRow}>
                                        <span>× {form.travelers} travelers</span>
                                        <span>{(tourPrice * form.travelers).toLocaleString("vi-VN")}đ</span>
                                    </div>
                                )}
                                <div className={styles.summaryDivider} />
                                <div className={`${styles.summaryPriceRow} ${styles.summaryTotal}`}>
                                    <strong>Total</strong>
                                    <strong className={styles.summaryTotalPrice}>{(tourPrice * form.travelers).toLocaleString("vi-VN")}đ</strong>
                                </div>

                                <div className={styles.summaryTrust}>
                                    <div className={styles.trustItem}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#e6f7f5" stroke="#2a9d8f" strokeWidth="1.5" /></svg>
                                        <span>Secure booking</span>
                                    </div>
                                    <div className={styles.trustItem}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 10h18M7 15h1M12 15h1" stroke="#2a9d8f" strokeWidth="1.5" strokeLinecap="round" /><rect x="2" y="5" width="20" height="14" rx="2" stroke="#2a9d8f" strokeWidth="1.5" /></svg>
                                        <span>No hidden fees</span>
                                    </div>
                                    <div className={styles.trustItem}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="#2a9d8f" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                        <span>Free cancellation 48h</span>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>}
                </div>
            </main>
            <Footer />

            {/* ── Toast notification ── */}
            {toast && (
                <div className={styles.toast}>
                    <div className={styles.toastIcon}>
                        <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                            <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                        </svg>
                    </div>
                    <p className={styles.toastMsg}>{toast}</p>
                    <button className={styles.toastClose} onClick={() => setToast(null)} aria-label="Close">
                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>
            )}
        </>
    );
}
