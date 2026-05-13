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

export default function BookingPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const tourId = params.id as string;
    const scheduleId = searchParams.get("scheduleId");

    const [itinerary, setItinerary] = useState<ItineraryDTO | null>(null);

    useEffect(() => {
        if (!tourId) return;
        agencyService.getItineraryById(tourId).then((res) => {
            if (res.data) setItinerary(res.data);
        });
    }, [tourId]);

    const selectedSchedule = itinerary?.schedules.find((s) => s.id === scheduleId) ?? itinerary?.schedules[0] ?? null;

    const tourName = itinerary?.name ?? "Tour";
    const tourImage = itinerary?.images?.[0]?.url ?? "/images/landing/explore_1.avif";
    const tourPrice = itinerary?.price ?? 0;
    const tourDuration = itinerary?.durationDays ?? 0;
    const checkIn = selectedSchedule ? formatDate(selectedSchedule.startTime) : "—";
    const checkOut = selectedSchedule ? formatDate(selectedSchedule.endTime) : "—";

    const [step, setStep] = useState(0);

    const [form, setForm] = useState({
        travelers: 1,
        specialRequests: "",
        agreeTerms: false,
        agreeNewsletter: false,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const set = (field: string, value: string | number | boolean) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const validateStep0 = () => {
        const e: Record<string, string> = {};
        if (form.travelers < 1) e.travelers = "At least 1 traveler required";
        return e;
    };

    const handleNext = () => {
        let e: Record<string, string> = {};
        if (step === 0) e = validateStep0();
        if (Object.keys(e).length > 0) { setErrors(e); return; }
        setErrors({});
        setStep((s) => s + 1);
    };

    const handleSubmit = async () => {
        if (!form.agreeTerms) {
            setErrors({ agreeTerms: "You must agree to the terms" });
            return;
        }
        if (!scheduleId) {
            setErrors({ general: "Không tìm thấy lịch khởi hành. Vui lòng quay lại chọn lại." });
            return;
        }
        setErrors({});
        setSubmitting(true);
        try {
            const res = await agencyService.createBooking({
                scheduleId,
                numberOfGuests: form.travelers,
                customerNote: form.specialRequests || undefined,
            });
            const bookingId = res.data.bookingId;
            const query = new URLSearchParams();
            query.set("bookingId", bookingId);
            query.set("scheduleId", scheduleId);
            query.set("travelers", String(form.travelers));
            router.push(`/tours/${tourId}/booking/payment?${query.toString()}`);
        } catch {
            setErrors({ general: "Không thể tạo đặt chỗ. Vui lòng thử lại." });
        } finally {
            setSubmitting(false);
        }
    };


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

                    <div className={styles.layout}>
                        {/* ── LEFT: Form ── */}
                        <div className={styles.formSide}>

                            {/* Step 0 — Travel Details */}
                            {step === 0 && (
                                <div className={styles.card}>
                                    <h2 className={styles.cardTitle}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 17l6-6 4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M21 3h-6M21 3v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                        Travel Details
                                    </h2>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Number of Travelers <span>*</span></label>
                                        <div className={styles.counter}>
                                            <button type="button" className={styles.counterBtn} onClick={() => set("travelers", Math.max(1, form.travelers - 1))}>−</button>
                                            <span className={styles.counterVal}>{form.travelers}</span>
                                            <button type="button" className={styles.counterBtn} onClick={() => set("travelers", form.travelers + 1)}>+</button>
                                        </div>
                                        {errors.travelers && <span className={styles.errorMsg}>{errors.travelers}</span>}
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Special Requests / Medical Notes</label>
                                        <textarea
                                            className={styles.textarea}
                                            rows={4}
                                            placeholder="Any dietary restrictions, mobility needs, medical conditions, or special requests..."
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
                                        <h3 className={styles.reviewHeading}>Travel Details</h3>
                                        <div className={styles.reviewGrid}>
                                            <div className={styles.reviewItem}><span>Travelers</span><strong>{form.travelers} person{form.travelers > 1 ? "s" : ""}</strong></div>
                                            <div className={styles.reviewItem}><span>Check-in</span><strong>{checkIn}</strong></div>
                                            <div className={styles.reviewItem}><span>Check-out</span><strong>{checkOut}</strong></div>
                                        </div>
                                        {form.specialRequests && (
                                            <div className={styles.reviewNote}>
                                                <span>Special Requests:</span> {form.specialRequests}
                                            </div>
                                        )}
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
                                        {submitting ? "Đang xử lý..." : (
                                            <>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                Xác nhận đặt tour
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
                                    <span>{tourDuration} ngày</span>
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
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
