"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layouts/header/header";
import Footer from "@/components/layouts/footer/footer";
import PropertyCard from "@/components/commons/property-card/property-card";
import { agencyService } from "@/libs/services/agency.service";
import { useWishlist } from "@/hooks/useWishlist";
import { WishlistItemType } from "@/libs/services/wishlist.service";
import type { AgencyDetailDTO } from "@/types/agency.type";
import type { ItineraryDTO } from "@/types/itinerary.type";
import styles from "./page.module.scss";

const TABS = [
    { key: "about", label: "Giới thiệu" },
    { key: "tours", label: "Tours" },
    { key: "gallery", label: "Hình ảnh" },
];

export default function AgencyDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [agency, setAgency] = useState<AgencyDetailDTO | null>(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("about");
    const [tours, setTours] = useState<ItineraryDTO[]>([]);
    const [toursLoading, setToursLoading] = useState(false);
    const [toursLoaded, setToursLoaded] = useState(false);
    const { liked: wishlisted, loading: wishlistLoading, toggle: toggleWishlist } = useWishlist(
        agency?.id, WishlistItemType.Agency, { checkOnMount: true },
    );

    useEffect(() => {
        if (!id) return;
        agencyService.getById(id)
            .then(res => { if (res?.data) setAgency(res.data); })
            .catch(() => {})
            .finally(() => setPageLoading(false));
    }, [id]);

    useEffect(() => {
        if (activeTab !== "tours" || toursLoaded || !id) return;
        setToursLoading(true);
        agencyService.getItinerariesByAgency(id)
            .then(res => { if (res?.data) setTours(res.data); })
            .catch(() => {})
            .finally(() => { setToursLoading(false); setToursLoaded(true); });
    }, [activeTab, toursLoaded, id]);

    if (pageLoading) {
        return (
            <>
                <Header variant="solid" />
                <div className={styles.pageLoading}><div className={styles.spinner} /></div>
                <Footer />
            </>
        );
    }

    if (!agency) {
        return (
            <>
                <Header variant="solid" />
                <div className={styles.notFound}>Không tìm thấy đại lý du lịch.</div>
                <Footer />
            </>
        );
    }

    const coverImg = agency.images?.[0];

    return (
        <>
            <Header variant="solid" />
            <main className={styles.main}>
                {/* ── Hero ── */}
                <div className={styles.hero}>
                    {coverImg ? (
                        <Image src={coverImg} alt={agency.name} fill sizes="100vw" style={{ objectFit: "cover" }} priority />
                    ) : (
                        <div className={styles.heroFallback} />
                    )}
                    <div className={styles.heroOverlay} />
                    <div className={styles.heroInner}>
                        <nav className={styles.breadcrumbs} aria-label="breadcrumb">
                            <Link href="/">Trang chủ</Link>
                            <span className={styles.breadSep}>/</span>
                            <Link href="/agencies">Đại lý</Link>
                            <span className={styles.breadSep}>/</span>
                            <span>{agency.name}</span>
                        </nav>
                        <span className={styles.heroBadge}>Đại lý du lịch</span>
                        <div className={styles.heroTitleRow}>
                            <h1 className={styles.heroName}>{agency.name}</h1>
                            <button
                                className={`${styles.wishlistBtn} ${wishlisted ? styles.wishlistBtnActive : ""}`}
                                onClick={toggleWishlist}
                                disabled={wishlistLoading}
                                aria-label={wishlisted ? "Xóa khỏi danh sách yêu thích" : "Thêm vào danh sách yêu thích"}
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                        <div className={styles.heroMeta}>
                            {agency.address && (
                                <span className={styles.heroMetaItem}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" fill="currentColor"/></svg>
                                    {agency.address}
                                </span>
                            )}
                            {agency.contactPhone && (
                                <span className={styles.heroMetaItem}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11.5 19.79 19.79 0 01.1 2.82 2 2 0 012.1 1h3a2 2 0 012 1.72 13 13 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 13 13 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    {agency.contactPhone}
                                </span>
                            )}
                            {agency.contactEmail && (
                                <span className={styles.heroMetaItem}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    {agency.contactEmail}
                                </span>
                            )}
                            {agency.startTime && agency.endTime && (
                                <span className={styles.heroMetaItem}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                    {agency.startTime} – {agency.endTime}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className={styles.body}>
                    <div className={styles.layout}>
                        {/* ── Main content ── */}
                        <div className={styles.content}>
                            <div className={styles.tabNav}>
                                {TABS.map(t => (
                                    <button
                                        key={t.key}
                                        className={`${styles.tabBtn} ${activeTab === t.key ? styles.tabBtnActive : ""}`}
                                        onClick={() => setActiveTab(t.key)}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            {/* About */}
                            {activeTab === "about" && (
                                <div className={styles.tabPane}>
                                    <h2 className={styles.sectionTitle}>Về {agency.name}</h2>
                                    {agency.description ? (
                                        <p className={styles.description}>{agency.description}</p>
                                    ) : (
                                        <p className={styles.emptyText}>Chưa có thông tin giới thiệu.</p>
                                    )}
                                    <div className={styles.infoGrid}>
                                        {agency.address && (
                                            <div className={styles.infoChip}>
                                                <span className={styles.infoChipIcon}>📍</span>
                                                <div>
                                                    <p className={styles.infoChipLabel}>Địa chỉ</p>
                                                    <p className={styles.infoChipValue}>{agency.address}</p>
                                                </div>
                                            </div>
                                        )}
                                        {agency.contactPhone && (
                                            <div className={styles.infoChip}>
                                                <span className={styles.infoChipIcon}>📞</span>
                                                <div>
                                                    <p className={styles.infoChipLabel}>Điện thoại</p>
                                                    <a href={`tel:${agency.contactPhone}`} className={styles.infoChipValue}>{agency.contactPhone}</a>
                                                </div>
                                            </div>
                                        )}
                                        {agency.contactEmail && (
                                            <div className={styles.infoChip}>
                                                <span className={styles.infoChipIcon}>✉️</span>
                                                <div>
                                                    <p className={styles.infoChipLabel}>Email</p>
                                                    <a href={`mailto:${agency.contactEmail}`} className={styles.infoChipValue}>{agency.contactEmail}</a>
                                                </div>
                                            </div>
                                        )}
                                        {agency.startTime && agency.endTime && (
                                            <div className={styles.infoChip}>
                                                <span className={styles.infoChipIcon}>🕐</span>
                                                <div>
                                                    <p className={styles.infoChipLabel}>Giờ làm việc</p>
                                                    <p className={styles.infoChipValue}>{agency.startTime} – {agency.endTime}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Tours */}
                            {activeTab === "tours" && (
                                <div className={styles.tabPane}>
                                    <h2 className={styles.sectionTitle}>Tours của {agency.name}</h2>
                                    {toursLoading ? (
                                        <div className={styles.loadingCenter}><div className={styles.spinner} /></div>
                                    ) : tours.length === 0 ? (
                                        <div className={styles.emptyState}>
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                            <p>Đại lý chưa có tour nào.</p>
                                        </div>
                                    ) : (
                                        <div className={styles.toursGrid}>
                                            {tours.map(t => (
                                                <PropertyCard
                                                    key={t.id}
                                                    id={t.id}
                                                    image={t.images?.[0]?.url}
                                                    name={t.name}
                                                    duration={t.durationDays}
                                                    stopCount={t.stopCount}
                                                    price={t.price}
                                                    description={t.description}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Gallery */}
                            {activeTab === "gallery" && (
                                <div className={styles.tabPane}>
                                    <h2 className={styles.sectionTitle}>Hình ảnh</h2>
                                    {agency.images?.length > 0 ? (
                                        <div className={styles.gallery}>
                                            {agency.images.map((img, i) => (
                                                <div key={i} className={styles.galleryItem}>
                                                    <Image src={img} alt={`${agency.name} ${i + 1}`} fill sizes="300px" style={{ objectFit: "cover" }} />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className={styles.emptyState}>
                                            <p>Chưa có hình ảnh.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ── Sidebar ── */}
                        <aside className={styles.sidebar}>
                            <div className={styles.sideCard}>
                                <div className={styles.sideAvatarWrap}>
                                    {coverImg ? (
                                        <Image src={coverImg} alt={agency.name} fill sizes="80px" style={{ objectFit: "cover" }} />
                                    ) : (
                                        <div className={styles.sideAvatarFallback}>
                                            {agency.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <p className={styles.sideName}>{agency.name}</p>
                                <span className={styles.sideBadge}>Đại lý du lịch</span>
                                <div className={styles.sideInfoList}>
                                    {agency.address && (
                                        <div className={styles.sideInfoRow}>
                                            <span>📍</span><span>{agency.address}</span>
                                        </div>
                                    )}
                                    {agency.contactPhone && (
                                        <div className={styles.sideInfoRow}>
                                            <span>📞</span>
                                            <a href={`tel:${agency.contactPhone}`}>{agency.contactPhone}</a>
                                        </div>
                                    )}
                                    {agency.contactEmail && (
                                        <div className={styles.sideInfoRow}>
                                            <span>✉️</span>
                                            <a href={`mailto:${agency.contactEmail}`}>{agency.contactEmail}</a>
                                        </div>
                                    )}
                                    {agency.startTime && agency.endTime && (
                                        <div className={styles.sideInfoRow}>
                                            <span>🕐</span><span>{agency.startTime} – {agency.endTime}</span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    className={styles.sidePrimaryBtn}
                                    onClick={() => setActiveTab("tours")}
                                >
                                    Xem tất cả tours
                                </button>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
