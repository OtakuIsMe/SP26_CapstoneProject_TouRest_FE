"use client";

import { useState } from "react";
import Image from "next/image";
import Header from "@/components/layouts/header/header";
import Button from "@/components/commons/button/button";
import CardTour from "@/components/commons/card-tour/card-tour";
import Footer from "@/components/layouts/footer/footer";
import styles from "./page.module.scss";

const tabs = ["Stays", "Flights", "Cars", "Packages", "Cruises", "Things to do"];

export default function HomePage() {
    const [activeTab, setActiveTab] = useState("Stays");

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
                                className={`${styles.searchTab} ${activeTab === tab ? styles.searchTabActive : ""
                                    }`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className={styles.searchFields}>
                        {/* Location */}
                        <div className={styles.searchField}>
                            <div className={styles.fieldIcon}>
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" fill="currentColor" />
                                </svg>
                            </div>
                            <div className={styles.fieldContent}>
                                <span className={styles.fieldLabel}>
                                    Location
                                    <svg viewBox="0 0 24 24" fill="none" width="10" height="10" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                                <input
                                    type="text"
                                    className={styles.fieldInput}
                                    placeholder="Enter your destination"
                                    readOnly
                                />
                            </div>
                        </div>

                        {/* Date */}
                        <div className={styles.searchField}>
                            <div className={styles.fieldIcon}>
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </div>
                            <div className={styles.fieldContent}>
                                <span className={styles.fieldLabel}>
                                    Date
                                    <svg viewBox="0 0 24 24" fill="none" width="10" height="10" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                                <input
                                    type="text"
                                    className={styles.fieldInput}
                                    placeholder="Choose your dates"
                                    readOnly
                                />
                            </div>
                        </div>

                        {/* Travelers */}
                        <div className={styles.searchField}>
                            <div className={styles.fieldIcon}>
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className={styles.fieldContent}>
                                <span className={styles.fieldLabel}>
                                    Travelers
                                    <svg viewBox="0 0 24 24" fill="none" width="10" height="10" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                                <input
                                    type="text"
                                    className={styles.fieldInput}
                                    placeholder="Enter your destination"
                                    readOnly
                                />
                            </div>
                        </div>

                        {/* Search Button */}
                        <button className={styles.searchBtn}>
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
                            price? TripAxis is thrilled to announce our latest Big Promo, offering you
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
                    <button className={styles.discoverArrow}>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
                <div className={styles.discoverList}>
                    <CardTour
                        image="/images/landing/explore_1.avif"
                        name="Ridquest Orlando Resort"
                        location="Bali"
                        rating={4.7}
                        reviews={1356}
                        price={420}
                        originalPrice={500}
                    />
                    <CardTour
                        image="/images/landing/explore_2.webp"
                        name="Serene Bali Retreat"
                        location="Bali"
                        rating={4.7}
                        reviews={1356}
                        price={420}
                        originalPrice={500}
                    />
                    <CardTour
                        image="/images/landing/explore_3.jpg"
                        name="Horseshoe Las Vegas"
                        location="Las Vegas"
                        rating={4.7}
                        reviews={1356}
                        price={800}
                        originalPrice={900}
                    />
                </div>
            </section>

            <Footer />
        </main>
    );
}
