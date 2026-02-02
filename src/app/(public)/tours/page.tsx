"use client";

import Image from "next/image";
import Header from "@/components/layouts/header/header";
import Footer from "@/components/layouts/footer/footer";
import FilterDropdown from "@/components/commons/filter-dropdown/filter-dropdown";
import BudgetSlider from "@/components/commons/budget-slider/budget-slider";
import PropertyCard from "@/components/commons/property-card/property-card";
import styles from "./page.module.scss";

const dealsFilter = [
    { name: "All Deals", count: 10 },
];

const mostUsedFilters = [
    { name: "Free Cancellation", count: 36 },
    { name: "4 Stars", count: 7 },
    { name: "Breakfast Included", count: 29 },
    { name: "Apartments", count: 22 },
    { name: "Double Bed", count: 52 },
    { name: "Golf Club", count: 3 },
];

const facilitiesFilter = [
    { name: "Parking", count: 36 },
    { name: "Theatre", count: 7 },
    { name: "Room Service", count: 29 },
    { name: "Pool", count: 22 },
    { name: "Spa", count: 18 },
    { name: "Gym", count: 14 },
    { name: "Restaurant", count: 45 },
    { name: "Bar", count: 31 },
    { name: "Laundry", count: 12 },
    { name: "Kids Club", count: 8 },
    { name: "Conference Room", count: 5 },
    { name: "Shuttle Service", count: 9 },
    { name: "Pet Friendly", count: 6 },
];

const reviewScoreFilter = [
    { name: "Wonderful: 9+", count: 15 },
    { name: "Very Good: 8+", count: 28 },
    { name: "Good: 7+", count: 42 },
    { name: "Pleasant: 6+", count: 52 },
];

const propertyRatingFilter = [
    { name: "5 Stars", count: 8 },
    { name: "4 Stars", count: 18 },
    { name: "3 Stars", count: 22 },
    { name: "2 Stars", count: 4 },
    { name: "Unrated", count: 3 },
];

const properties = [
    {
        image: "/images/landing/explore_1.avif",
        type: "Entire home in Warsaw",
        name: "Warsaw Valley",
        guests: 6,
        homeType: "Entire Home",
        beds: 5,
        baths: 3,
        amenities: ["Wifi", "Kitchen", "Free Parking"],
        rating: 5.0,
        reviews: 7,
        price: 325,
    },
    {
        image: "/images/landing/explore_2.webp",
        type: "Entire home in Warsaw",
        name: "Warsaw Valley",
        guests: 6,
        homeType: "Entire Home",
        beds: 5,
        baths: 3,
        amenities: ["Wifi", "Kitchen", "Free Parking"],
        rating: 5.0,
        reviews: 7,
        price: 325,
    },
    {
        image: "/images/landing/explore_3.jpg",
        type: "Entire home in Warsaw",
        name: "Warsaw Valley",
        guests: 6,
        homeType: "Entire Home",
        beds: 5,
        baths: 3,
        amenities: ["Wifi", "Kitchen", "Free Parking"],
        rating: 5.0,
        reviews: 7,
        price: 325,
    },
    {
        image: "/images/landing/explore_4.avif",
        type: "Entire home in Warsaw",
        name: "Warsaw Valley",
        guests: 6,
        homeType: "Entire Home",
        beds: 5,
        baths: 3,
        amenities: ["Wifi", "Kitchen", "Free Parking"],
        rating: 5.0,
        reviews: 7,
        price: 325,
    },
];

export default function ToursPage() {
    return (
        <main>
            <Header variant="solid" />

            <div className={styles.container}>
                {/* Exclusive Deals Banner */}
                <section className={styles.dealsSection}>
                    <h2 className={styles.dealsHeading}>Exclusive Deals Just For You!</h2>
                    <div className={styles.dealsBanner}>
                        <div className={styles.bannerContent}>
                            <div className={styles.bannerIcon}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" fill="#f59e0b" />
                                    <circle cx="12" cy="12" r="4" fill="#fff" />
                                </svg>
                            </div>
                            <p className={styles.bannerLabel}>
                                Exclusive Flight Deals<br />Just For You!
                            </p>
                            <p className={styles.bannerDiscount}>50%</p>
                            <p className={styles.bannerTerms}>*with terms and conditions</p>
                        </div>
                        <div className={styles.bannerBrand}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 17l6-6 4 4 8-8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            TripAxis
                        </div>
                        <div className={styles.bannerImage}>
                            <Image src="/images/landing/banner.jpg" alt="Flight deals" fill sizes="100vw" style={{ objectFit: "cover" }} />
                        </div>
                    </div>
                </section>

                {/* Results Header */}
                <section className={styles.resultsHeader}>
                    <div className={styles.resultsLeft}>
                        <h1 className={styles.resultsTitle}>Warsaw, France: 52 Properties Found</h1>
                        <div className={styles.resultsActions}>
                            <button className={styles.actionBtn}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Share
                            </button>
                            <button className={styles.actionBtn}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Save
                            </button>
                        </div>
                    </div>
                    <button className={styles.sortBtn}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 6h18M3 12h12M3 18h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        Sort by Top Pick
                    </button>
                </section>

                {/* Main Content */}
                <div className={styles.main}>
                    {/* Filter Sidebar */}
                    <aside className={styles.sidebar}>
                        <p className={styles.filtersLabel}>Filters By:</p>

                        <div className={styles.filterSection}>
                            <div className={styles.filterHeader}>
                                <span className={styles.filterTitle}>Your Budget (Per Night)</span>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <BudgetSlider />
                        </div>

                        <FilterDropdown category="Deals" items={dealsFilter} />
                        <FilterDropdown category="Most Used Filters in Warsaw" items={mostUsedFilters} />
                        <FilterDropdown category="Facilities" items={facilitiesFilter} />
                        <FilterDropdown category="Review Score" items={reviewScoreFilter} />
                        <FilterDropdown category="Property Rating" items={propertyRatingFilter} />
                    </aside>

                    {/* Property Listings */}
                    <div className={styles.listings}>
                        {properties.map((prop, i) => (
                            <PropertyCard key={i} {...prop} />
                        ))}
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
