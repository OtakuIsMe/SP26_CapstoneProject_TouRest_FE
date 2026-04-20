"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layouts/header/header";
import Footer from "@/components/layouts/footer/footer";
import MapPicker from "@/components/commons/map-picker/map-picker";
import { agencyService } from "@/libs/services/agency.service";
import { StorageKeys } from "@/constants/storage";
import styles from "./page.module.scss";

interface ImagePreview {
    file: File;
    preview: string;
}

export default function BecomeAgencyPage() {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem(StorageKeys.ACCESS_TOKEN));
    }, []);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [contactPhone, setContactPhone] = useState("");
    const [address, setAddress] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [images, setImages] = useState<ImagePreview[]>([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? []);
        const previews: ImagePreview[] = files.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));
        setImages((prev) => [...prev, ...previews]);
        e.target.value = "";
    }

    function removeImage(index: number) {
        setImages((prev) => {
            URL.revokeObjectURL(prev[index].preview);
            return prev.filter((_, i) => i !== index);
        });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("Name", name.trim());
            formData.append("Description", description.trim());
            formData.append("ContactEmail", contactEmail.trim());
            formData.append("ContactPhone", contactPhone.trim());
            formData.append("Address", address.trim());
            formData.append("StartTime", startTime);
            formData.append("EndTime", endTime);
            if (latitude)  formData.append("Latitude", latitude);
            if (longitude) formData.append("Longitude", longitude);
            images.forEach((img) => formData.append("Images", img.file));

            await agencyService.register(formData);
            router.push("/");
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                "Registration failed. Please try again.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }

    if (isLoggedIn === null) return null;

    return (
        <main>
            <Header />

            <div className={styles.page}>
                <div className={styles.hero}>
                    <div className={styles.heroBadge}>For Agencies</div>
                    <h1 className={styles.heroTitle}>Become an Agency</h1>
                    <p className={styles.heroSubtitle}>
                        Partner with TouRest to craft unforgettable travel experiences and
                        reach thousands of adventurous travelers across Vietnam.
                    </p>
                </div>

                <div className={styles.container}>
                    {!isLoggedIn ? (
                        <div className={styles.loginGate}>
                            <div className={styles.loginGateIcon}>
                                <svg viewBox="0 0 24 24" fill="none">
                                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                                    <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <h2 className={styles.loginGateTitle}>Sign in to continue</h2>
                            <p className={styles.loginGateDesc}>
                                You need a TouRest customer account to apply as an Agency partner.
                            </p>
                            <div className={styles.loginGateBtns}>
                                <Link href={`/signin?redirect=${encodeURIComponent(pathname ?? "/become-agency")}`} className={styles.loginGateSignIn}>
                                    Sign In
                                </Link>
                                <Link href="/signup" className={styles.loginGateSignUp}>
                                    Create Account
                                </Link>
                            </div>
                            <Link href="/" className={styles.loginGateBack}>← Back to home</Link>
                        </div>
                    ) : (
                    <form className={styles.form} onSubmit={handleSubmit}>
                        {error && <p className={styles.error}>{error}</p>}

                        {/* ── Section: Agency Info ── */}
                        <section className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <div className={styles.sectionIcon}>
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className={styles.sectionTitle}>Agency Information</h2>
                                    <p className={styles.sectionDesc}>Basic details about your travel agency</p>
                                </div>
                            </div>

                            <div className={styles.fields}>
                                <div className={styles.fieldFull}>
                                    <label className={styles.label}>
                                        Agency Name <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        className={styles.input}
                                        type="text"
                                        placeholder="e.g. Horizon Travel Agency"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className={styles.fieldFull}>
                                    <label className={styles.label}>Description</label>
                                    <textarea
                                        className={styles.textarea}
                                        placeholder="Tell travelers about your agency, specialties, and destinations you cover..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={4}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* ── Section: Contact ── */}
                        <section className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <div className={styles.sectionIcon}>
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.63 19.79 19.79 0 01.001 2 2 2 0 012 .001h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className={styles.sectionTitle}>Contact Details</h2>
                                    <p className={styles.sectionDesc}>How travelers and our team can reach you</p>
                                </div>
                            </div>

                            <div className={styles.fields}>
                                <div className={styles.field}>
                                    <label className={styles.label}>
                                        Contact Email <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        className={styles.input}
                                        type="email"
                                        placeholder="contact@youragency.com"
                                        value={contactEmail}
                                        onChange={(e) => setContactEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className={styles.field}>
                                    <label className={styles.label}>
                                        Contact Phone <span className={styles.required}>*</span>
                                    </label>
                                    <div className={styles.phoneRow}>
                                        <span className={styles.phonePrefix}>🇻🇳 +84</span>
                                        <input
                                            className={styles.phoneInput}
                                            type="tel"
                                            placeholder="9x xxx xxxx"
                                            value={contactPhone}
                                            onChange={(e) => setContactPhone(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ── Section: Location ── */}
                        <section className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <div className={styles.sectionIcon}>
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className={styles.sectionTitle}>Office Location</h2>
                                    <p className={styles.sectionDesc}>Where is your agency office located?</p>
                                </div>
                            </div>

                            <div className={styles.fields}>
                                <div className={styles.fieldFull}>
                                    <label className={styles.label}>
                                        Address <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        className={styles.input}
                                        type="text"
                                        placeholder="e.g. 123 Nguyen Hue, District 1, Ho Chi Minh City"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <MapPicker
                                latitude={latitude ? parseFloat(latitude) : undefined}
                                longitude={longitude ? parseFloat(longitude) : undefined}
                                onChange={(lat, lng) => {
                                    setLatitude(String(lat));
                                    setLongitude(String(lng));
                                }}
                            />
                        </section>

                        {/* ── Section: Operating Hours ── */}
                        <section className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <div className={styles.sectionIcon}>
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className={styles.sectionTitle}>Operating Hours</h2>
                                    <p className={styles.sectionDesc}>Your agency's daily opening and closing times</p>
                                </div>
                            </div>

                            <div className={styles.fields}>
                                <div className={styles.field}>
                                    <label className={styles.label}>
                                        Opening Time <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        className={styles.input}
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>
                                        Closing Time <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        className={styles.input}
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </section>

                        {/* ── Section: Images ── */}
                        <section className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <div className={styles.sectionIcon}>
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                                        <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2" />
                                        <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className={styles.sectionTitle}>Agency Images</h2>
                                    <p className={styles.sectionDesc}>Upload photos of your office or team (up to 8 images)</p>
                                </div>
                            </div>

                            <div className={styles.imageGrid}>
                                {images.map((img, i) => (
                                    <div key={i} className={styles.imageThumb}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={img.preview} alt={`preview-${i}`} />
                                        <button
                                            type="button"
                                            className={styles.imageRemove}
                                            onClick={() => removeImage(i)}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none">
                                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}

                                {images.length < 8 && (
                                    <button
                                        type="button"
                                        className={styles.imageAdd}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none">
                                            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                        <span>Add Photo</span>
                                    </button>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                className={styles.fileInputHidden}
                                onChange={handleImageChange}
                            />
                        </section>

                        {/* ── Actions ── */}
                        <div className={styles.actions}>
                            <Link href="/" className={styles.cancelBtn}>
                                Cancel
                            </Link>
                            <button type="submit" className={styles.submitBtn} disabled={loading}>
                                {loading ? "Submitting..." : "Submit Application"}
                            </button>
                        </div>

                        <p className={styles.terms}>
                            By submitting, you agree to our{" "}
                            <Link href="#">Terms of Service</Link> and{" "}
                            <Link href="#">Agency Partnership Guidelines</Link>.
                        </p>
                    </form>
                    )}
                </div>
            </div>

            <Footer />
        </main>
    );
}
