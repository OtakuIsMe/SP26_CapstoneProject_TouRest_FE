"use client";

import { useState } from "react";
import Header from "@/components/layouts/header/header";
import styles from "./page.module.scss";

const BOOKINGS = [
    {
        id: 1,
        name: "Cardiology Consultation – Vinmec International",
        location: "Hanoi, Vietnam",
        date: "Mar 10, 2026",
        duration: "2 days",
        price: "$320",
        status: "completed",
        icon: "🫀",
    },
    {
        id: 2,
        name: "Dental Implant Package – Bangkok Hospital",
        location: "Bangkok, Thailand",
        date: "Apr 18, 2026",
        duration: "5 days",
        price: "$1,250",
        status: "upcoming",
        icon: "🦷",
    },
    {
        id: 3,
        name: "Orthopaedic Surgery Recovery Tour",
        location: "Singapore",
        date: "Jan 5, 2026",
        duration: "7 days",
        price: "$2,800",
        status: "cancelled",
        icon: "🦴",
    },
];

const WISHLIST = [
    { id: 1, name: "Eye Laser Surgery – LASIK Tour", price: "$890", icon: "👁️" },
    { id: 2, name: "Full Body Health Check Package", price: "$420", icon: "🏥" },
    { id: 3, name: "Cosmetic Surgery – Korea Tour", price: "$3,500", icon: "✨" },
    { id: 4, name: "Stem Cell Therapy Package", price: "$5,200", icon: "🧬" },
    { id: 5, name: "IVF Treatment – Thailand", price: "$4,100", icon: "🌸" },
    { id: 6, name: "Cancer Screening Tour – Japan", price: "$1,800", icon: "🔬" },
];

const HEALTH_CONDITIONS = ["Hypertension", "Diabetes Type 2", "Knee Osteoarthritis"];

const STATUS_CLASS: Record<string, string> = {
    completed: styles.statusCompleted,
    upcoming: styles.statusUpcoming,
    cancelled: styles.statusCancelled,
};

const TABS = ["Bookings", "Wishlist", "Medical Records", "Reviews"];

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState("Bookings");

    return (
        <div className={styles.page}>
            <Header variant="solid" />
            {/* Banner */}
            <div className={styles.banner} />

            {/* Profile Header */}
            <div className={styles.profileHeader}>
                <div className={styles.avatarRow}>
                    <div className={styles.avatar}>N</div>
                    <div className={styles.avatarActions}>
                        <button className={styles.btnOutline}>Edit Profile</button>
                        <button className={styles.btnPrimary}>Book Now</button>
                    </div>
                </div>

                <div className={styles.nameRow}>
                    <span className={styles.name}>Nguyen Van A</span>
                    <span className={styles.badge}>MEMBER</span>
                </div>
                <p className={styles.bio}>Medical tourist · Based in Ho Chi Minh City, Vietnam</p>

                <div className={styles.stats}>
                    <div className={styles.stat}>
                        <div className={styles.statValue}>8</div>
                        <div className={styles.statLabel}>Total Trips</div>
                    </div>
                    <div className={styles.stat}>
                        <div className={styles.statValue}>3</div>
                        <div className={styles.statLabel}>Upcoming</div>
                    </div>
                    <div className={styles.stat}>
                        <div className={styles.statValue}>12</div>
                        <div className={styles.statLabel}>Wishlist</div>
                    </div>
                    <div className={styles.stat}>
                        <div className={styles.statValue}>5</div>
                        <div className={styles.statLabel}>Reviews</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                {TABS.map(tab => (
                    <button
                        key={tab}
                        className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className={styles.content}>
                {/* Sidebar */}
                <aside className={styles.sidebar}>
                    <div className={styles.card}>
                        <div className={styles.cardTitle}>Personal Info</div>
                        <div className={styles.infoRow}>
                            <svg viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.7"/></svg>
                            <span className={styles.infoLabel}>Full name</span>
                            <span>Nguyen Van A</span>
                        </div>
                        <div className={styles.infoRow}>
                            <svg viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                            <span className={styles.infoLabel}>Phone</span>
                            <span>+84 912 345 678</span>
                        </div>
                        <div className={styles.infoRow}>
                            <svg viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                            <span className={styles.infoLabel}>Email</span>
                            <span>nguyenvana@gmail.com</span>
                        </div>
                        <div className={styles.infoRow}>
                            <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                            <span className={styles.infoLabel}>DOB</span>
                            <span>Jan 15, 1990</span>
                        </div>
                        <div className={styles.infoRow}>
                            <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.7"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                            <span className={styles.infoLabel}>Nationality</span>
                            <span>Vietnamese</span>
                        </div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardTitle}>Health Profile</div>
                        <div className={styles.infoRow}>
                            <svg viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                            <span className={styles.infoLabel}>Blood type</span>
                            <span>A+</span>
                        </div>
                        <div className={styles.infoRow}>
                            <svg viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                            <span className={styles.infoLabel}>Height / Weight</span>
                            <span>170cm / 65kg</span>
                        </div>
                        <div className={styles.infoRow} style={{ flexWrap: "wrap", gap: 4 }}>
                            <svg viewBox="0 0 24 24" fill="none"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2z" stroke="currentColor" strokeWidth="1.7"/><path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                            <span className={styles.infoLabel}>Conditions</span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", marginTop: 6 }}>
                            {HEALTH_CONDITIONS.map(c => (
                                <span key={c} className={styles.healthTag}>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                    {c}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardTitle}>Preferred Destinations</div>
                        {["Thailand", "South Korea", "Singapore", "Japan"].map(d => (
                            <div key={d} className={styles.infoRow}>
                                <svg viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.7"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.7"/></svg>
                                <span>{d}</span>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Main */}
                <main className={styles.main}>
                    {activeTab === "Bookings" && (
                        <div>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionTitle}>
                                    My Bookings
                                    <span className={styles.sectionCount}>{BOOKINGS.length}</span>
                                </span>
                                <button className={styles.seeAll}>See all</button>
                            </div>
                            {BOOKINGS.map(b => (
                                <div key={b.id} className={styles.bookingCard}>
                                    <div className={styles.bookingImg}>{b.icon}</div>
                                    <div className={styles.bookingInfo}>
                                        <div className={styles.bookingName}>{b.name}</div>
                                        <div className={styles.bookingMeta}>
                                            <span className={styles.bookingMetaItem}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2"/></svg>
                                                {b.location}
                                            </span>
                                            <span className={styles.bookingMetaItem}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2"/></svg>
                                                {b.date}
                                            </span>
                                            <span className={styles.bookingMetaItem}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                                {b.duration}
                                            </span>
                                        </div>
                                        <div className={styles.bookingFooter}>
                                            <span className={`${styles.statusBadge} ${STATUS_CLASS[b.status]}`}>
                                                {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                                            </span>
                                            <span className={styles.bookingPrice}>{b.price}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === "Wishlist" && (
                        <div>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionTitle}>
                                    Wishlist
                                    <span className={styles.sectionCount}>{WISHLIST.length}</span>
                                </span>
                                <button className={styles.seeAll}>See all</button>
                            </div>
                            <div className={styles.wishGrid}>
                                {WISHLIST.map(w => (
                                    <div key={w.id} className={styles.wishCard}>
                                        <div className={styles.wishThumb}>{w.icon}</div>
                                        <div className={styles.wishBody}>
                                            <div className={styles.wishName}>{w.name}</div>
                                            <div className={styles.wishPrice}>{w.price}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "Medical Records" && (
                        <div className={styles.card}>
                            <div className={styles.cardTitle}>Medical Records</div>
                            {["Blood Test Results – Mar 2026", "MRI Knee Scan – Jan 2026", "Cardiology Report – Dec 2025"].map(r => (
                                <div key={r} className={styles.infoRow}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>
                                    <span>{r}</span>
                                    <button className={styles.seeAll} style={{ marginLeft: "auto" }}>Download</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === "Reviews" && (
                        <div className={styles.card}>
                            <div className={styles.cardTitle}>My Reviews</div>
                            <p style={{ fontSize: 14, color: "#6b7280" }}>No reviews yet.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
