"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layouts/header/header";
import Footer from "@/components/layouts/footer/footer";
import styles from "./page.module.scss";

// ── mock data ──────────────────────────────────────────────────────────────
const tour = {
    title: "Santorini Tour: Unforgettable Journey",
    meta: {
        days: 3,
        nights: 4,
        country: "Greece",
        city: "Santorini",
        date: "16.04.2023",
        tags: ["Culture", "Island", "Beach"],
    },
    gallery: [
        "/images/landing/explore_1.avif",
        "/images/landing/explore_2.webp",
        "/images/landing/explore_3.jpg",
        "/images/landing/explore_4.avif",
        "/images/landing/banner.jpg",
    ],
    description: `Santorini is one of the most beautiful islands in the world, famous for its dramatic volcanic landscape, white-washed buildings with blue-domed churches, and stunning sunsets over the Aegean Sea.

This tour takes you through the most iconic spots of the island, from the charming village of Oia with its narrow cobblestone streets to the ancient ruins of Akrotiri, a Minoan Bronze Age settlement preserved under volcanic ash.

You will sail around the caldera, swim in the hot springs, explore the black sand beaches of Perissa and Kamari, and indulge in local Greek cuisine paired with the island's renowned wines.`,
    included: [
        { icon: "✓", label: "Airport transfers (round-trip)" },
        { icon: "✓", label: "4-night accommodation in boutique hotel" },
        { icon: "✓", label: "Daily breakfast included" },
        { icon: "✓", label: "Expert English-speaking tour guide" },
        { icon: "✓", label: "Caldera boat cruise with snorkeling" },
        { icon: "✓", label: "Wine tasting at local vineyard" },
        { icon: "✗", label: "International flights" },
        { icon: "✗", label: "Travel insurance" },
        { icon: "✗", label: "Personal expenses" },
    ],
    itinerary: [
        {
            day: 1,
            title: "Arrival & Oia Sunset",
            desc: "Arrive at Santorini Airport, transfer to hotel. Evening walk through Oia and watch the famous sunset.",
        },
        {
            day: 2,
            title: "Caldera Cruise & Hot Springs",
            desc: "Full-day boat cruise around the volcanic caldera. Visit the active volcano, swim in hot springs, and explore Thirassia island.",
        },
        {
            day: 3,
            title: "Akrotiri & Black Sand Beaches",
            desc: "Morning visit to the archaeological site of Akrotiri. Afternoon at Perissa black sand beach.",
        },
        {
            day: 4,
            title: "Fira & Wine Tasting",
            desc: "Explore the capital Fira, visit local museums and enjoy a wine tasting session at a renowned Santorinian winery.",
        },
    ],
    places: [
        {
            name: "The Castle of St. Nicholas",
            type: "Landmark",
            rating: 4.8,
            image: "/images/landing/explore_1.avif",
        },
        {
            name: "Hiking Trail Fira – Oia",
            type: "Outdoor Activity",
            rating: 4.9,
            image: "/images/landing/explore_2.webp",
        },
        {
            name: "Santorini Sailing",
            type: "Water Activity",
            rating: 4.7,
            image: "/images/landing/explore_3.jpg",
        },
    ],
};

const booking = {
    name: "Santorini – Group Tour (Guided)",
    rating: 4.69,
    reviews: 179,
    checkIn: "16.04.2023",
    checkOut: "20.04.2023",
    nights: 4,
    days: 3,
    price: 950,
    originalPrice: 1100,
    tripCode: "G3S1P8",
    features: [
        { icon: "👤", label: "Tour Guides" },
        { icon: "⭐", label: "Basic Level Service" },
        { icon: "👥", label: "Small Group" },
        { icon: "🥾", label: "Light Physical Rating" },
    ],
};

const tabs = ["Overview", "What's Included", "Tour Details", "Customization"] as const;
type Tab = (typeof tabs)[number];

const placeSidebar = [
    "Top Attractions",
    "Local Restaurants",
    "Hotels",
    "Expeditions",
    "Trekking Routes",
];
// ──────────────────────────────────────────────────────────────────────────

export default function TourDetailPage() {
    const [activeTab, setActiveTab] = useState<Tab>("Overview");
    const [expanded, setExpanded] = useState(false);
    const [activePlaceCat, setActivePlaceCat] = useState("Top Attractions");
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryIndex, setGalleryIndex] = useState(0);

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
                        <span>{tour.title}</span>
                    </nav>

                    <div className={styles.layout}>
                        {/* ── LEFT ── */}
                        <div className={styles.left}>

                            {/* Title + meta */}
                            <h1 className={styles.title}>{tour.title}</h1>
                            <div className={styles.metaRow}>
                                <span className={styles.metaItem}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm1 14.93V17a1 1 0 00-2 0v-.07A8.001 8.001 0 014.07 11H5a1 1 0 000-2h-.93A8.001 8.001 0 0111 4.07V5a1 1 0 002 0v-.93A8.001 8.001 0 0119.93 11H19a1 1 0 000 2h.93A8.001 8.001 0 0113 16.93z" fill="currentColor" /></svg>
                                    {tour.meta.days} days, {tour.meta.nights} nights
                                </span>
                                <span className={styles.metaDot}>·</span>
                                <span className={styles.metaItem}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" fill="currentColor" /></svg>
                                    {tour.meta.country}, {tour.meta.city}
                                </span>
                                <span className={styles.metaDot}>·</span>
                                <span className={styles.metaItem}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 4h-1V2h-2v2H8V2H6v2H5C3.89 4 3 4.9 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" fill="currentColor" /></svg>
                                    {tour.meta.date}
                                </span>
                                <span className={styles.metaDot}>·</span>
                                {tour.meta.tags.map((tag) => (
                                    <span key={tag} className={styles.tag}>{tag}</span>
                                ))}
                            </div>

                            {/* Gallery */}
                            <div className={styles.gallery}>
                                <div
                                    className={styles.galleryMain}
                                    onClick={() => { setGalleryIndex(0); setGalleryOpen(true); }}
                                >
                                    <Image
                                        src={tour.gallery[0]}
                                        alt="Main"
                                        fill
                                        sizes="560px"
                                        style={{ objectFit: "cover" }}
                                    />
                                </div>
                                <div className={styles.galleryGrid}>
                                    {tour.gallery.slice(1, 5).map((src, i) => (
                                        <div
                                            key={i}
                                            className={styles.galleryThumb}
                                            onClick={() => { setGalleryIndex(i + 1); setGalleryOpen(true); }}
                                        >
                                            <Image src={src} alt={`Photo ${i + 2}`} fill sizes="260px" style={{ objectFit: "cover" }} />
                                            {i === 3 && (
                                                <div className={styles.galleryMore}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z" fill="currentColor" /></svg>
                                                    Show gallery
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className={styles.tabs}>
                                {tabs.map((tab) => (
                                    <button
                                        key={tab}
                                        className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ""}`}
                                        onClick={() => setActiveTab(tab)}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* ── Overview ── */}
                            {activeTab === "Overview" && (
                                <div className={styles.tabContent}>
                                    <h2 className={styles.sectionTitle}>About This Tour</h2>
                                    <p className={`${styles.description} ${expanded ? styles.descriptionExpanded : ""}`}>
                                        {tour.description}
                                    </p>
                                    <button className={styles.readMore} onClick={() => setExpanded(!expanded)}>
                                        {expanded ? "Show less" : "Read More"}
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d={expanded ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>

                                    {/* Unmissable Places */}
                                    <div className={styles.places}>
                                        <h2 className={styles.sectionTitle}>The Unmissable Places</h2>
                                        <div className={styles.placesLayout}>
                                            <ul className={styles.placesSidebar}>
                                                {placeSidebar.map((cat) => (
                                                    <li key={cat}>
                                                        <button
                                                            className={`${styles.placesCat} ${activePlaceCat === cat ? styles.placesCatActive : ""}`}
                                                            onClick={() => setActivePlaceCat(cat)}
                                                        >
                                                            {cat}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className={styles.placesCards}>
                                                {tour.places.map((place) => (
                                                    <div key={place.name} className={styles.placeCard}>
                                                        <div className={styles.placeCardImg}>
                                                            <Image src={place.image} alt={place.name} fill sizes="200px" style={{ objectFit: "cover" }} />
                                                        </div>
                                                        <div className={styles.placeCardBody}>
                                                            <span className={styles.placeType}>{place.type}</span>
                                                            <p className={styles.placeName}>{place.name}</p>
                                                            <div className={styles.placeRating}>
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="#f5a623"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#f5a623" /></svg>
                                                                {place.rating}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── What's Included ── */}
                            {activeTab === "What's Included" && (
                                <div className={styles.tabContent}>
                                    <h2 className={styles.sectionTitle}>What&apos;s Included</h2>
                                    <div className={styles.includedGrid}>
                                        {tour.included.map((item, i) => (
                                            <div key={i} className={`${styles.includedItem} ${item.icon === "✗" ? styles.includedItemNo : ""}`}>
                                                <span className={styles.includedIcon}>{item.icon}</span>
                                                {item.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Tour Details ── */}
                            {activeTab === "Tour Details" && (
                                <div className={styles.tabContent}>
                                    <h2 className={styles.sectionTitle}>Day-by-Day Itinerary</h2>
                                    <div className={styles.itinerary}>
                                        {tour.itinerary.map((day) => (
                                            <div key={day.day} className={styles.dayCard}>
                                                <div className={styles.dayBadge}>Day {day.day}</div>
                                                <div className={styles.dayInfo}>
                                                    <h3 className={styles.dayTitle}>{day.title}</h3>
                                                    <p className={styles.dayDesc}>{day.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Customization ── */}
                            {activeTab === "Customization" && (
                                <div className={styles.tabContent}>
                                    <h2 className={styles.sectionTitle}>Customize Your Trip</h2>
                                    <p className={styles.customNote}>
                                        Want to tailor this tour to your preferences? Contact our travel experts to create a personalized itinerary just for you — private guide, preferred hotels, custom activities, and flexible dates.
                                    </p>
                                    <button className={styles.contactBtn}>Contact a Travel Expert</button>
                                </div>
                            )}
                        </div>

                        {/* ── RIGHT — Booking card ── */}
                        <aside className={styles.sidebar}>
                            <div className={styles.bookingCard}>
                                <div className={styles.discountBadge}>DISCOUNT</div>
                                <h3 className={styles.bookingName}>{booking.name}</h3>

                                <div className={styles.bookingRating}>
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <svg key={s} width="14" height="14" viewBox="0 0 24 24">
                                            <path
                                                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                                fill={s <= Math.round(booking.rating) ? "#f5a623" : "#e5e7eb"}
                                            />
                                        </svg>
                                    ))}
                                    <span className={styles.ratingValue}>{booking.rating}</span>
                                    <span className={styles.ratingCount}>{booking.reviews} reviews</span>
                                </div>

                                <div className={styles.bookingDates}>
                                    <div className={styles.dateBox}>
                                        <span className={styles.dateLabel}>Check-in</span>
                                        <span className={styles.dateValue}>{booking.checkIn}</span>
                                    </div>
                                    <div className={styles.dateArrow}>→</div>
                                    <div className={styles.dateBox}>
                                        <span className={styles.dateLabel}>Check-out</span>
                                        <span className={styles.dateValue}>{booking.checkOut}</span>
                                    </div>
                                </div>

                                <div className={styles.bookingLength}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm1 11h-4v-2h4V9l4 4-4 4v-4z" fill="currentColor" /></svg>
                                    Total Length: <strong>{booking.nights} nights, {booking.days} days</strong>
                                </div>

                                <div className={styles.bookingPrice}>
                                    <span className={styles.priceNew}>${booking.price.toLocaleString()}.00</span>
                                    <span className={styles.priceOld}>${booking.originalPrice.toLocaleString()}.00</span>
                                </div>

                                <div className={styles.tripCode}>
                                    Trip Code: <strong>{booking.tripCode}</strong>
                                </div>

                                <button className={styles.bookBtn}>Book Your Trip Now!</button>

                                <div className={styles.bookingFeatures}>
                                    {booking.features.map((f) => (
                                        <div key={f.label} className={styles.featureItem}>
                                            <span>{f.icon}</span>
                                            <span>{f.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>

            {/* Lightbox */}
            {galleryOpen && (
                <div className={styles.lightbox} onClick={() => setGalleryOpen(false)}>
                    <button className={styles.lightboxClose} onClick={() => setGalleryOpen(false)}>✕</button>
                    <button
                        className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                        onClick={(e) => { e.stopPropagation(); setGalleryIndex((galleryIndex - 1 + tour.gallery.length) % tour.gallery.length); }}
                    >‹</button>
                    <div className={styles.lightboxImg} onClick={(e) => e.stopPropagation()}>
                        <Image src={tour.gallery[galleryIndex]} alt="Gallery" fill sizes="90vw" style={{ objectFit: "contain" }} />
                    </div>
                    <button
                        className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                        onClick={(e) => { e.stopPropagation(); setGalleryIndex((galleryIndex + 1) % tour.gallery.length); }}
                    >›</button>
                </div>
            )}

            <Footer />
        </>
    );
}
