"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import Header from "@/components/layouts/header/header";
import Footer from "@/components/layouts/footer/footer";
import styles from "./page.module.scss";

const tourSummary = {
    title: "Santorini Tour: Unforgettable Journey",
    image: "/images/landing/explore_1.avif",
    checkIn: "16.04.2023",
    checkOut: "20.04.2023",
    nights: 4,
    days: 3,
    price: 950,
    originalPrice: 1100,
    tripCode: "G3S1P8",
};

const steps = ["Your Info", "Travel Details", "Review & Pay"];

export default function BookingPage() {
    const params = useParams();
    const tourId = params.id;

    const [step, setStep] = useState(0);
    const [submitted, setSubmitted] = useState(false);

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        nationality: "",
        dob: "",
        gender: "",
        passportNumber: "",
        travelers: 1,
        specialRequests: "",
        roomType: "standard",
        contactMethod: "email",
        agreeTerms: false,
        agreeNewsletter: false,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const set = (field: string, value: string | number | boolean) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const validateStep0 = () => {
        const e: Record<string, string> = {};
        if (!form.firstName.trim()) e.firstName = "First name is required";
        if (!form.lastName.trim()) e.lastName = "Last name is required";
        if (!form.email.trim()) e.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
        if (!form.phone.trim()) e.phone = "Phone number is required";
        if (!form.nationality.trim()) e.nationality = "Nationality is required";
        if (!form.dob) e.dob = "Date of birth is required";
        if (!form.gender) e.gender = "Gender is required";
        return e;
    };

    const validateStep1 = () => {
        const e: Record<string, string> = {};
        if (form.travelers < 1) e.travelers = "At least 1 traveler required";
        return e;
    };

    const handleNext = () => {
        let e: Record<string, string> = {};
        if (step === 0) e = validateStep0();
        if (step === 1) e = validateStep1();
        if (Object.keys(e).length > 0) { setErrors(e); return; }
        setErrors({});
        setStep((s) => s + 1);
    };

    const handleSubmit = () => {
        if (!form.agreeTerms) {
            setErrors({ agreeTerms: "You must agree to the terms" });
            return;
        }
        setErrors({});
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <>
                <Header variant="solid" />
                <main className={styles.successPage}>
                    <div className={styles.successCard}>
                        <div className={styles.successIcon}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="11" fill="#2a9d8f" />
                                <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h1 className={styles.successTitle}>Booking Request Sent!</h1>
                        <p className={styles.successDesc}>
                            Thank you, <strong>{form.firstName} {form.lastName}</strong>! We have received your booking request for <strong>{tourSummary.title}</strong>.
                            Our team will contact you at <strong>{form.email}</strong> within 24 hours to confirm your trip.
                        </p>
                        <div className={styles.successRef}>
                            <span>Reference Code</span>
                            <strong>{tourSummary.tripCode}</strong>
                        </div>
                        <div className={styles.successActions}>
                            <Link href="/tours" className={styles.successBtnPrimary}>Browse More Tours</Link>
                            <Link href="/" className={styles.successBtnOutline}>Back to Home</Link>
                        </div>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

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
                        <Link href={`/tours/${tourId}`}>{tourSummary.title}</Link>
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

                            {/* Step 0 — Personal Info */}
                            {step === 0 && (
                                <div className={styles.card}>
                                    <h2 className={styles.cardTitle}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" /></svg>
                                        Personal Information
                                    </h2>

                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>First Name <span>*</span></label>
                                            <input
                                                className={`${styles.input} ${errors.firstName ? styles.inputError : ""}`}
                                                placeholder="e.g. John"
                                                value={form.firstName}
                                                onChange={(e) => set("firstName", e.target.value)}
                                            />
                                            {errors.firstName && <span className={styles.errorMsg}>{errors.firstName}</span>}
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Last Name <span>*</span></label>
                                            <input
                                                className={`${styles.input} ${errors.lastName ? styles.inputError : ""}`}
                                                placeholder="e.g. Doe"
                                                value={form.lastName}
                                                onChange={(e) => set("lastName", e.target.value)}
                                            />
                                            {errors.lastName && <span className={styles.errorMsg}>{errors.lastName}</span>}
                                        </div>
                                    </div>

                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Email Address <span>*</span></label>
                                            <input
                                                className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                                                type="email"
                                                placeholder="john@email.com"
                                                value={form.email}
                                                onChange={(e) => set("email", e.target.value)}
                                            />
                                            {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Phone Number <span>*</span></label>
                                            <input
                                                className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
                                                placeholder="+1 234 567 8900"
                                                value={form.phone}
                                                onChange={(e) => set("phone", e.target.value)}
                                            />
                                            {errors.phone && <span className={styles.errorMsg}>{errors.phone}</span>}
                                        </div>
                                    </div>

                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Date of Birth <span>*</span></label>
                                            <input
                                                className={`${styles.input} ${errors.dob ? styles.inputError : ""}`}
                                                type="date"
                                                value={form.dob}
                                                onChange={(e) => set("dob", e.target.value)}
                                            />
                                            {errors.dob && <span className={styles.errorMsg}>{errors.dob}</span>}
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Gender <span>*</span></label>
                                            <select
                                                className={`${styles.input} ${errors.gender ? styles.inputError : ""}`}
                                                value={form.gender}
                                                onChange={(e) => set("gender", e.target.value)}
                                            >
                                                <option value="">Select gender</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                                <option value="prefer_not">Prefer not to say</option>
                                            </select>
                                            {errors.gender && <span className={styles.errorMsg}>{errors.gender}</span>}
                                        </div>
                                    </div>

                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Nationality <span>*</span></label>
                                            <input
                                                className={`${styles.input} ${errors.nationality ? styles.inputError : ""}`}
                                                placeholder="e.g. American"
                                                value={form.nationality}
                                                onChange={(e) => set("nationality", e.target.value)}
                                            />
                                            {errors.nationality && <span className={styles.errorMsg}>{errors.nationality}</span>}
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Passport / ID Number</label>
                                            <input
                                                className={styles.input}
                                                placeholder="Optional"
                                                value={form.passportNumber}
                                                onChange={(e) => set("passportNumber", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 1 — Travel Details */}
                            {step === 1 && (
                                <div className={styles.card}>
                                    <h2 className={styles.cardTitle}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 17l6-6 4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M21 3h-6M21 3v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                        Travel Details
                                    </h2>

                                    <div className={styles.formRow}>
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
                                            <label className={styles.label}>Room Preference</label>
                                            <div className={styles.radioGroup}>
                                                {["standard", "deluxe", "suite"].map((r) => (
                                                    <label key={r} className={`${styles.radioCard} ${form.roomType === r ? styles.radioCardActive : ""}`}>
                                                        <input type="radio" name="roomType" value={r} checked={form.roomType === r} onChange={() => set("roomType", r)} hidden />
                                                        <span className={styles.radioLabel}>{r.charAt(0).toUpperCase() + r.slice(1)}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
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

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Preferred Contact Method</label>
                                        <div className={styles.contactMethodGroup}>
                                            {[
                                                { value: "email", label: "Email", icon: "✉" },
                                                { value: "phone", label: "Phone", icon: "📞" },
                                                { value: "whatsapp", label: "WhatsApp", icon: "💬" },
                                            ].map((m) => (
                                                <label key={m.value} className={`${styles.contactMethodCard} ${form.contactMethod === m.value ? styles.contactMethodActive : ""}`}>
                                                    <input type="radio" name="contactMethod" value={m.value} checked={form.contactMethod === m.value} onChange={() => set("contactMethod", m.value)} hidden />
                                                    <span className={styles.contactMethodIcon}>{m.icon}</span>
                                                    <span>{m.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2 — Review */}
                            {step === 2 && (
                                <div className={styles.card}>
                                    <h2 className={styles.cardTitle}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                        Review Your Information
                                    </h2>

                                    <div className={styles.reviewSection}>
                                        <h3 className={styles.reviewHeading}>Personal Details</h3>
                                        <div className={styles.reviewGrid}>
                                            <div className={styles.reviewItem}><span>Full Name</span><strong>{form.firstName} {form.lastName}</strong></div>
                                            <div className={styles.reviewItem}><span>Email</span><strong>{form.email}</strong></div>
                                            <div className={styles.reviewItem}><span>Phone</span><strong>{form.phone}</strong></div>
                                            <div className={styles.reviewItem}><span>Nationality</span><strong>{form.nationality}</strong></div>
                                            <div className={styles.reviewItem}><span>Date of Birth</span><strong>{form.dob}</strong></div>
                                            <div className={styles.reviewItem}><span>Gender</span><strong>{form.gender}</strong></div>
                                            {form.passportNumber && <div className={styles.reviewItem}><span>Passport / ID</span><strong>{form.passportNumber}</strong></div>}
                                        </div>
                                    </div>

                                    <div className={styles.reviewSection}>
                                        <h3 className={styles.reviewHeading}>Travel Details</h3>
                                        <div className={styles.reviewGrid}>
                                            <div className={styles.reviewItem}><span>Travelers</span><strong>{form.travelers} person{form.travelers > 1 ? "s" : ""}</strong></div>
                                            <div className={styles.reviewItem}><span>Room Type</span><strong>{form.roomType.charAt(0).toUpperCase() + form.roomType.slice(1)}</strong></div>
                                            <div className={styles.reviewItem}><span>Contact via</span><strong>{form.contactMethod.charAt(0).toUpperCase() + form.contactMethod.slice(1)}</strong></div>
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
                                    <button className={styles.submitBtn} onClick={handleSubmit}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        Confirm Booking
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* ── RIGHT: Trip Summary ── */}
                        <aside className={styles.summarySide}>
                            <div className={styles.summaryCard}>
                                <h3 className={styles.summaryTitle}>Trip Summary</h3>

                                <div className={styles.summaryImage}>
                                    <Image src={tourSummary.image} alt={tourSummary.title} fill sizes="320px" style={{ objectFit: "cover" }} />
                                </div>

                                <p className={styles.summaryTourName}>{tourSummary.title}</p>

                                <div className={styles.summaryDates}>
                                    <div className={styles.summaryDateBox}>
                                        <span className={styles.summaryDateLabel}>Check-in</span>
                                        <span className={styles.summaryDateVal}>{tourSummary.checkIn}</span>
                                    </div>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    <div className={styles.summaryDateBox}>
                                        <span className={styles.summaryDateLabel}>Check-out</span>
                                        <span className={styles.summaryDateVal}>{tourSummary.checkOut}</span>
                                    </div>
                                </div>

                                <div className={styles.summaryMeta}>
                                    <span>{tourSummary.nights} nights</span>
                                    <span>·</span>
                                    <span>{tourSummary.days} days</span>
                                    <span>·</span>
                                    <span>{form.travelers} traveler{form.travelers > 1 ? "s" : ""}</span>
                                </div>

                                <div className={styles.summaryDivider} />

                                <div className={styles.summaryPriceRow}>
                                    <span>Base price</span>
                                    <span className={styles.summaryPriceOld}>${tourSummary.originalPrice}</span>
                                </div>
                                <div className={styles.summaryPriceRow}>
                                    <span>Discount</span>
                                    <span className={styles.summaryDiscount}>−${tourSummary.originalPrice - tourSummary.price}</span>
                                </div>
                                {form.travelers > 1 && (
                                    <div className={styles.summaryPriceRow}>
                                        <span>× {form.travelers} travelers</span>
                                        <span>${(tourSummary.price * form.travelers).toLocaleString()}</span>
                                    </div>
                                )}
                                <div className={styles.summaryDivider} />
                                <div className={`${styles.summaryPriceRow} ${styles.summaryTotal}`}>
                                    <strong>Total</strong>
                                    <strong className={styles.summaryTotalPrice}>${(tourSummary.price * form.travelers).toLocaleString()}.00</strong>
                                </div>

                                <div className={styles.summaryCode}>
                                    Trip Code: <strong>{tourSummary.tripCode}</strong>
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
