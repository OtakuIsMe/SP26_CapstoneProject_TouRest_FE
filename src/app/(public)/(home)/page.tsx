"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Header from "@/components/layouts/header/header";
import Button from "@/components/commons/button/button";
import CardTour from "@/components/commons/card-tour/card-tour";
import Footer from "@/components/layouts/footer/footer";
import styles from "./page.module.scss";
import { agencyService } from "@/libs/services/agency.service";
import { ItineraryDTO } from "@/types/itinerary.type";

const tabs = ["Stays", "Flights", "Cars", "Packages", "Cruises", "Things to do"];

const VN_PROVINCES = [
    "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu",
    "Bắc Ninh", "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước",
    "Bình Thuận", "Cà Mau", "Cần Thơ", "Cao Bằng", "Đà Nẵng",
    "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai", "Đồng Tháp",
    "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội", "Hà Tĩnh",
    "Hải Dương", "Hải Phòng", "Hậu Giang", "Hòa Bình", "Hưng Yên",
    "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu", "Lâm Đồng",
    "Lạng Sơn", "Lào Cai", "Long An", "Nam Định", "Nghệ An",
    "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình",
    "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sóc Trăng",
    "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa",
    "Thừa Thiên Huế", "Tiền Giang", "TP. Hồ Chí Minh", "Trà Vinh",
    "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái",
];

const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% + 8px)",
    left: 0,
    zIndex: 999,
    background: "#fff",
    border: "1px solid #e8e8e8",
    borderRadius: 12,
    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
    maxHeight: 240,
    overflowY: "auto",
    minWidth: 220,
};

const dropdownItemStyle: React.CSSProperties = {
    padding: "9px 16px",
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
};

export default function HomePage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("Stays");

    // ── Location ─────────────────────────────────────────────────────────────
    const [destination, setDestination] = useState("");
    const [locOpen, setLocOpen] = useState(false);
    const [locQuery, setLocQuery] = useState("");
    const locRef = useRef<HTMLDivElement>(null);

    // ── Date ─────────────────────────────────────────────────────────────────
    const [date, setDate] = useState("");
    const dateInputRef = useRef<HTMLInputElement>(null);

    // ── Tour Name ─────────────────────────────────────────────────────────────
    const [keyword, setKeyword] = useState("");
    const [tourOpen, setTourOpen] = useState(false);
    const [tourQuery, setTourQuery] = useState("");
    const [tourNames, setTourNames] = useState<string[]>([]);
    const tourRef = useRef<HTMLDivElement>(null);

    // ── Featured tours ────────────────────────────────────────────────────────
    const [featuredTours, setFeaturedTours] = useState<ItineraryDTO[]>([]);

    // Close dropdowns on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (locRef.current && !locRef.current.contains(e.target as Node)) setLocOpen(false);
            if (tourRef.current && !tourRef.current.contains(e.target as Node)) setTourOpen(false);
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Fetch active tour names for dropdown
    useEffect(() => {
        agencyService.getItineraries({ pageSize: 100, status: "Active" }).then((res) => {
            if (res.data) {
                const names = (res.data.items ?? []).map((t) => t.name).filter(Boolean);
                setTourNames(names);
            }
        });
    }, []);

    // Fetch featured tours for the discover section
    useEffect(() => {
        agencyService.getItineraries({ pageSize: 6, status: "Active" }).then((res) => {
            if (res.data) setFeaturedTours(res.data.items ?? []);
        });
    }, []);

    function handleSearch() {
        const params = new URLSearchParams();
        if (destination.trim()) params.set("destination", destination.trim());
        if (keyword.trim()) params.set("name", keyword.trim());
        if (date) params.set("date", date);
        const qs = params.toString();
        router.push(`/tours${qs ? `?${qs}` : ""}`);
    }

    const filteredProvinces = VN_PROVINCES.filter((p) =>
        p.toLowerCase().includes(locQuery.toLowerCase())
    );

    const filteredTours = tourNames.filter((n) =>
        n.toLowerCase().includes(tourQuery.toLowerCase())
    );

    return (
        <main>
            <section className={styles.hero}>
                <div className={styles.heroOverlay}>
                    <Header />

                    <div className={styles.heroContent}>
                        <h1 className={styles.heroTitle}>
                            Find Your Next
                            <br />
                            Destination Today
                        </h1>
                        <p className={styles.heroSubtitle}>
                            Rediscover the beauty in life&apos;s simplest pleasures, and let every
                            moment here remind you of the joy of true relaxation.
                        </p>
                    </div>
                </div>

                <div className={styles.searchBox}>
                    <div className={styles.searchTabs}>
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                className={`${styles.searchTab} ${activeTab === tab ? styles.searchTabActive : ""}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className={styles.searchFields}>
                        {/* ── Location ── */}
                        <div className={styles.searchField} ref={locRef} style={{ position: "relative" }}>
                            <div className={styles.fieldIcon}>
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" fill="currentColor" />
                                </svg>
                            </div>
                            <div className={styles.fieldContent}>
                                <span className={styles.fieldLabel}>
                                    Location
                                    <svg viewBox="0 0 24 24" fill="none" width="10" height="10">
                                        <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                                <input
                                    type="text"
                                    className={styles.fieldInput}
                                    placeholder="Select province"
                                    value={locOpen ? locQuery : destination}
                                    onChange={(e) => {
                                        setLocQuery(e.target.value);
                                        setLocOpen(true);
                                    }}
                                    onFocus={() => {
                                        setLocQuery("");
                                        setLocOpen(true);
                                    }}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    readOnly={false}
                                />
                            </div>
                            {locOpen && (
                                <div style={dropdownStyle}>
                                    {filteredProvinces.length === 0 ? (
                                        <div style={{ ...dropdownItemStyle, color: "#999" }}>No results</div>
                                    ) : (
                                        filteredProvinces.map((p) => (
                                            <div
                                                key={p}
                                                style={{
                                                    ...dropdownItemStyle,
                                                    background: destination === p ? "#f0f0ff" : undefined,
                                                    color: destination === p ? "#4f46e5" : "#1a1a2e",
                                                }}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setDestination(p);
                                                    setLocQuery("");
                                                    setLocOpen(false);
                                                }}
                                                onMouseEnter={(e) => {
                                                    (e.currentTarget as HTMLDivElement).style.background = "#f5f5ff";
                                                }}
                                                onMouseLeave={(e) => {
                                                    (e.currentTarget as HTMLDivElement).style.background =
                                                        destination === p ? "#f0f0ff" : "";
                                                }}
                                            >
                                                {p}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ── Date ── */}
                        <div
                            className={styles.searchField}
                            style={{ cursor: "pointer" }}
                            onClick={() => dateInputRef.current?.showPicker?.()}
                        >
                            <div className={styles.fieldIcon}>
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </div>
                            <div className={styles.fieldContent}>
                                <span className={styles.fieldLabel}>Date</span>
                                <input
                                    ref={dateInputRef}
                                    type="date"
                                    className={styles.fieldInput}
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    style={{ colorScheme: "light" }}
                                />
                            </div>
                        </div>

                        {/* ── Tour Name ── */}
                        <div className={styles.searchField} ref={tourRef} style={{ position: "relative" }}>
                            <div className={styles.fieldIcon}>
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className={styles.fieldContent}>
                                <span className={styles.fieldLabel}>
                                    Tour Name
                                    <svg viewBox="0 0 24 24" fill="none" width="10" height="10">
                                        <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                                <input
                                    type="text"
                                    className={styles.fieldInput}
                                    placeholder="Search tour name"
                                    value={tourOpen ? tourQuery : keyword}
                                    onChange={(e) => {
                                        setTourQuery(e.target.value);
                                        setTourOpen(true);
                                    }}
                                    onFocus={() => {
                                        setTourQuery("");
                                        setTourOpen(true);
                                    }}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                />
                            </div>
                            {tourOpen && (
                                <div style={dropdownStyle}>
                                    {filteredTours.length === 0 ? (
                                        <div style={{ ...dropdownItemStyle, color: "#999" }}>
                                            {tourNames.length === 0 ? "Loading tours..." : "No results"}
                                        </div>
                                    ) : (
                                        filteredTours.map((name) => (
                                            <div
                                                key={name}
                                                style={{
                                                    ...dropdownItemStyle,
                                                    background: keyword === name ? "#f0f0ff" : undefined,
                                                    color: keyword === name ? "#4f46e5" : "#1a1a2e",
                                                }}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setKeyword(name);
                                                    setTourQuery("");
                                                    setTourOpen(false);
                                                }}
                                                onMouseEnter={(e) => {
                                                    (e.currentTarget as HTMLDivElement).style.background = "#f5f5ff";
                                                }}
                                                onMouseLeave={(e) => {
                                                    (e.currentTarget as HTMLDivElement).style.background =
                                                        keyword === name ? "#f0f0ff" : "";
                                                }}
                                            >
                                                {name}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ── Search Button ── */}
                        <button className={styles.searchBtn} onClick={handleSearch}>
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            Find My Trip
                        </button>
                    </div>
                </div>
            </section>

            {/* Promo Section */}
            <section className={styles.promo}>
                <div className={styles.promoHeader}>
                    <h2 className={styles.promoTitle}>
                        Limited Time Offer Book
                        <br />
                        Now and Save Big!
                    </h2>
                    <div className={styles.promoInfo}>
                        <p className={styles.promoDesc}>
                            Big Promo Alert! Are you ready for the ultimate adventure at an unbeatable
                            price? TouRest is thrilled to announce our latest Big Promo, offering you
                            incredible deals on your dream vacations!
                        </p>
                        <Button
                            icon={
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            }
                            iconPosition="right"
                        >
                            Book Now
                        </Button>
                    </div>
                </div>

                <div className={styles.promoGrid}>
                    <div className={styles.promoImg1}>
                        <Image src="/images/landing/explore_1.avif" alt="Explore 1" fill sizes="33vw" style={{ objectFit: "cover" }} />
                    </div>
                    <div className={styles.promoImg2}>
                        <Image src="/images/landing/explore_2.webp" alt="Explore 2" fill sizes="33vw" style={{ objectFit: "cover" }} />
                    </div>
                    <div className={styles.promoImg3}>
                        <Image src="/images/landing/explore_3.jpg" alt="Explore 3" fill sizes="33vw" style={{ objectFit: "cover" }} />
                    </div>
                    <div className={styles.promoImg4}>
                        <Image src="/images/landing/explore_4.avif" alt="Explore 4" fill sizes="33vw" style={{ objectFit: "cover" }} />
                    </div>
                </div>
            </section>

            {/* Discover Section */}
            <section className={styles.discover}>
                <div className={styles.discoverHeader}>
                    <h2 className={styles.discoverTitle}>Discover Your New Favorite Stay</h2>
                    <button className={styles.discoverArrow} onClick={() => router.push("/tours")}>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
                <div className={styles.discoverList}>
                    {featuredTours.length > 0
                        ? featuredTours.map((tour) => (
                            <CardTour
                                key={tour.id}
                                id={tour.id}
                                image={tour.images?.[0]?.url ?? "/images/landing/explore_1.avif"}
                                name={tour.name}
                                location={tour.agencyName ?? "Vietnam"}
                                rating={0}
                                reviews={0}
                                price={tour.price}
                            />
                        ))
                        : [1, 2, 3].map((i) => (
                            <div key={i} className={styles.cardSkeleton} />
                        ))
                    }
                </div>
            </section>

            <Footer />
        </main>
    );
}
