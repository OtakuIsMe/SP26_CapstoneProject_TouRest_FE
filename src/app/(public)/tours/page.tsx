"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Header from "@/components/layouts/header/header";
import Footer from "@/components/layouts/footer/footer";
import FilterDropdown from "@/components/commons/filter-dropdown/filter-dropdown";
import BudgetSlider from "@/components/commons/budget-slider/budget-slider";
import PropertyCard from "@/components/commons/property-card/property-card";
import styles from "./page.module.scss";
import { agencyService } from "@/libs/services/agency.service";
import { ItineraryDTO } from "@/types/itinerary.type";

const PAGE_SIZE = 5;
const MAX_PRICE = 50_000_000;

const dealsFilter = [{ name: "All Deals", count: 10 }];
const mostUsedFilters = [
    { name: "Free Cancellation", count: 36 },
    { name: "4 Stars", count: 7 },
    { name: "Breakfast Included", count: 29 },
    { name: "Apartments", count: 22 },
    { name: "Double Bed", count: 52 },
    { name: "Golf Club", count: 3 },
];

function PropertyCardSkeleton() {
    return (
        <div className={styles.cardSkeleton}>
            <div className={styles.cardSkeletonImage} />
            <div className={styles.cardSkeletonContent}>
                <div className={styles.skeletonLine} style={{ width: "40%", height: 12 }} />
                <div className={styles.skeletonLine} style={{ width: "70%", height: 20 }} />
                <div className={styles.skeletonLine} style={{ width: "55%", height: 12 }} />
                <div className={styles.skeletonBottom}>
                    <div className={styles.skeletonLine} style={{ width: "30%", height: 12 }} />
                    <div className={styles.skeletonLine} style={{ width: "25%", height: 20 }} />
                </div>
            </div>
        </div>
    );
}

export default function ToursPage() {
    const [tours, setTours] = useState<ItineraryDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [lowPrice, setLowPrice] = useState(0);
    const [highPrice, setHighPrice] = useState(MAX_PRICE);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    const fetchTours = useCallback(async (p: number, lo: number, hi: number) => {
        setLoading(true);
        try {
            const res = await agencyService.getItineraries({
                page: p,
                pageSize: PAGE_SIZE,
                lowPrice: lo > 0 ? lo : undefined,
                highPrice: hi < MAX_PRICE ? hi : undefined,
            });
            if (res.data) {
                setTours(res.data.items ?? []);
                setTotal(res.data.total);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTours(1, 0, MAX_PRICE); }, []);

    const handleRangeChange = useCallback((lo: number, hi: number) => {
        setLowPrice(lo);
        setHighPrice(hi);
        setPage(1);
        fetchTours(1, lo, hi);
    }, [fetchTours]);

    const goToPage = (p: number) => {
        setPage(p);
        fetchTours(p, lowPrice, highPrice);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

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
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" fill="#f59e0b" />
                                    <circle cx="12" cy="12" r="4" fill="#fff" />
                                </svg>
                            </div>
                            <p className={styles.bannerLabel}>Exclusive Flight Deals<br />Just For You!</p>
                            <p className={styles.bannerDiscount}>50%</p>
                            <p className={styles.bannerTerms}>*with terms and conditions</p>
                        </div>
                        <div className={styles.bannerBrand}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M3 17l6-6 4 4 8-8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            TouRest
                        </div>
                        <div className={styles.bannerImage}>
                            <Image src="/images/landing/banner.jpg" alt="Flight deals" fill sizes="100vw" style={{ objectFit: "cover" }} />
                        </div>
                    </div>
                </section>

                {/* Results Header */}
                <section className={styles.resultsHeader}>
                    <div className={styles.resultsLeft}>
                        <h1 className={styles.resultsTitle}>
                            {loading ? "Loading..." : `${total} Tour${total !== 1 ? "s" : ""} Found`}
                        </h1>
                        <div className={styles.resultsActions}>
                            <button className={styles.actionBtn}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Share
                            </button>
                            <button className={styles.actionBtn}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Save
                            </button>
                        </div>
                    </div>
                    <button className={styles.sortBtn}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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
                                <span className={styles.filterTitle}>Price Range</span>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <BudgetSlider
                                min={0}
                                max={MAX_PRICE}
                                defaultMin={0}
                                defaultMax={MAX_PRICE}
                                onRangeChange={handleRangeChange}
                            />
                        </div>
                        <FilterDropdown category="Deals" items={dealsFilter} />
                        <FilterDropdown category="Most Used Filters" items={mostUsedFilters} />
                    </aside>

                    {/* Listings + Pagination */}
                    <div className={styles.listingsWrapper}>
                        <div className={styles.listings}>
                            {loading
                                ? Array.from({ length: PAGE_SIZE }).map((_, i) => <PropertyCardSkeleton key={i} />)
                                : tours.length > 0
                                    ? tours.map((tour) => (
                                        <PropertyCard
                                            key={tour.id}
                                            id={tour.id}
                                            image={tour.images?.[0]?.url}
                                            name={tour.name}
                                            description={tour.description}
                                            duration={tour.durationDays}
                                            stopCount={tour.stopCount}
                                            price={tour.price}
                                        />
                                    ))
                                    : (
                                        <div className={styles.emptyState}>
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                                <circle cx="11" cy="11" r="8" stroke="#9ca3af" strokeWidth="1.5" />
                                                <path d="M21 21l-4.35-4.35" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                            <p>No tours found in this price range.</p>
                                        </div>
                                    )
                            }
                        </div>

                        {/* Pagination */}
                        {!loading && totalPages > 1 && (
                            <div className={styles.pagination}>
                                <button
                                    className={styles.pageBtn}
                                    onClick={() => goToPage(page - 1)}
                                    disabled={page === 1}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                                    const isNear = Math.abs(p - page) <= 1 || p === 1 || p === totalPages;
                                    if (!isNear) {
                                        if (p === page - 2 || p === page + 2) return <span key={p} className={styles.pageDots}>…</span>;
                                        return null;
                                    }
                                    return (
                                        <button
                                            key={p}
                                            className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ""}`}
                                            onClick={() => goToPage(p)}
                                        >
                                            {p}
                                        </button>
                                    );
                                })}

                                <button
                                    className={styles.pageBtn}
                                    onClick={() => goToPage(page + 1)}
                                    disabled={page === totalPages}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
