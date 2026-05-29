"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layouts/header/header";
import Footer from "@/components/layouts/footer/footer";
import { providerService } from "@/libs/services/provider.service";
import { useWishlist } from "@/hooks/useWishlist";
import { WishlistItemType } from "@/libs/services/wishlist.service";
import type { ProviderDetailDTO } from "@/types/provider.type";
import type { ServiceDTO } from "@/types/service.type";
import styles from "./page.module.scss";

const TABS = [
    { key: "about", label: "Giới thiệu" },
    { key: "services", label: "Dịch vụ" },
    { key: "gallery", label: "Hình ảnh" },
];

function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} phút`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`;
}

export default function ProviderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [provider, setProvider] = useState<ProviderDetailDTO | null>(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("about");
    const [services, setServices] = useState<ServiceDTO[]>([]);
    const [servicesLoading, setServicesLoading] = useState(false);
    const [servicesLoaded, setServicesLoaded] = useState(false);
    const { liked: wishlisted, loading: wishlistLoading, toggle: toggleWishlist } = useWishlist(
        provider?.id, WishlistItemType.Provider, { checkOnMount: true },
    );

    useEffect(() => {
        if (!id) return;
        providerService.getById(id)
            .then(res => { if (res?.data) setProvider(res.data); })
            .catch(() => {})
            .finally(() => setPageLoading(false));
    }, [id]);

    useEffect(() => {
        if (activeTab !== "services" || servicesLoaded || !id) return;
        setServicesLoading(true);
        providerService.getServicesByProvider(id)
            .then(res => { if (res?.data) setServices(res.data); })
            .catch(() => {})
            .finally(() => { setServicesLoading(false); setServicesLoaded(true); });
    }, [activeTab, servicesLoaded, id]);

    if (pageLoading) {
        return (
            <>
                <Header variant="solid" />
                <div className={styles.pageLoading}><div className={styles.spinner} /></div>
                <Footer />
            </>
        );
    }

    if (!provider) {
        return (
            <>
                <Header variant="solid" />
                <div className={styles.notFound}>Không tìm thấy nhà cung cấp dịch vụ.</div>
                <Footer />
            </>
        );
    }

    const coverImg = provider.images?.[0];

    return (
        <>
            <Header variant="solid" />
            <main className={styles.main}>
                {/* ── Hero ── */}
                <div className={styles.hero}>
                    {coverImg ? (
                        <Image src={coverImg} alt={provider.name} fill sizes="100vw" style={{ objectFit: "cover" }} priority />
                    ) : (
                        <div className={styles.heroFallback} />
                    )}
                    <div className={styles.heroOverlay} />
                    <div className={styles.heroInner}>
                        <nav className={styles.breadcrumbs} aria-label="breadcrumb">
                            <Link href="/">Trang chủ</Link>
                            <span className={styles.breadSep}>/</span>
                            <Link href="/providers">Nhà cung cấp</Link>
                            <span className={styles.breadSep}>/</span>
                            <span>{provider.name}</span>
                        </nav>
                        <span className={styles.heroBadge}>Nhà cung cấp dịch vụ</span>
                        <div className={styles.heroTitleRow}>
                            <h1 className={styles.heroName}>{provider.name}</h1>
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
                            {provider.address && (
                                <span className={styles.heroMetaItem}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" fill="currentColor"/></svg>
                                    {provider.address}
                                </span>
                            )}
                            {provider.contactPhone && (
                                <span className={styles.heroMetaItem}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11.5 19.79 19.79 0 01.1 2.82 2 2 0 012.1 1h3a2 2 0 012 1.72 13 13 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 13 13 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    {provider.contactPhone}
                                </span>
                            )}
                            {provider.contactEmail && (
                                <span className={styles.heroMetaItem}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    {provider.contactEmail}
                                </span>
                            )}
                            {provider.startTime && provider.endTime && (
                                <span className={styles.heroMetaItem}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                    {provider.startTime} – {provider.endTime}
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
                                    <h2 className={styles.sectionTitle}>Về {provider.name}</h2>
                                    {provider.description ? (
                                        <p className={styles.description}>{provider.description}</p>
                                    ) : (
                                        <p className={styles.emptyText}>Chưa có thông tin giới thiệu.</p>
                                    )}
                                    <div className={styles.infoGrid}>
                                        {provider.address && (
                                            <div className={styles.infoChip}>
                                                <span className={styles.infoChipIcon}>📍</span>
                                                <div>
                                                    <p className={styles.infoChipLabel}>Địa chỉ</p>
                                                    <p className={styles.infoChipValue}>{provider.address}</p>
                                                </div>
                                            </div>
                                        )}
                                        {provider.contactPhone && (
                                            <div className={styles.infoChip}>
                                                <span className={styles.infoChipIcon}>📞</span>
                                                <div>
                                                    <p className={styles.infoChipLabel}>Điện thoại</p>
                                                    <a href={`tel:${provider.contactPhone}`} className={styles.infoChipValue}>{provider.contactPhone}</a>
                                                </div>
                                            </div>
                                        )}
                                        {provider.contactEmail && (
                                            <div className={styles.infoChip}>
                                                <span className={styles.infoChipIcon}>✉️</span>
                                                <div>
                                                    <p className={styles.infoChipLabel}>Email</p>
                                                    <a href={`mailto:${provider.contactEmail}`} className={styles.infoChipValue}>{provider.contactEmail}</a>
                                                </div>
                                            </div>
                                        )}
                                        {provider.startTime && provider.endTime && (
                                            <div className={styles.infoChip}>
                                                <span className={styles.infoChipIcon}>🕐</span>
                                                <div>
                                                    <p className={styles.infoChipLabel}>Giờ làm việc</p>
                                                    <p className={styles.infoChipValue}>{provider.startTime} – {provider.endTime}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Services */}
                            {activeTab === "services" && (
                                <div className={styles.tabPane}>
                                    <h2 className={styles.sectionTitle}>Dịch vụ của {provider.name}</h2>
                                    {servicesLoading ? (
                                        <div className={styles.loadingCenter}><div className={styles.spinner} /></div>
                                    ) : services.length === 0 ? (
                                        <div className={styles.emptyState}>
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                            <p>Nhà cung cấp chưa có dịch vụ nào.</p>
                                        </div>
                                    ) : (
                                        <div className={styles.servicesList}>
                                            {services.map(svc => (
                                                <div key={svc.id} className={styles.serviceCard}>
                                                    <div className={styles.serviceCardBody}>
                                                        <div className={styles.serviceCardTop}>
                                                            <h3 className={styles.serviceName}>{svc.name}</h3>
                                                            <span className={`${styles.statusBadge} ${svc.status === "Active" ? styles.statusActive : styles.statusInactive}`}>
                                                                {svc.status === "Active" ? "Đang hoạt động" : svc.status === "Discontinued" ? "Ngừng hoạt động" : "Tạm dừng"}
                                                            </span>
                                                        </div>
                                                        {svc.description && (
                                                            <p className={styles.serviceDesc}>{svc.description}</p>
                                                        )}
                                                        <div className={styles.serviceMeta}>
                                                            <span className={styles.serviceMetaItem}>
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                                                {formatDuration(svc.durationMinutes)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className={styles.serviceCardPrice}>
                                                        <span className={styles.priceLabel}>Giá từ</span>
                                                        <span className={styles.priceValue}>{svc.price.toLocaleString("vi-VN")}đ</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Gallery */}
                            {activeTab === "gallery" && (
                                <div className={styles.tabPane}>
                                    <h2 className={styles.sectionTitle}>Hình ảnh</h2>
                                    {provider.images?.length > 0 ? (
                                        <div className={styles.gallery}>
                                            {provider.images.map((img, i) => (
                                                <div key={i} className={styles.galleryItem}>
                                                    <Image src={img} alt={`${provider.name} ${i + 1}`} fill sizes="300px" style={{ objectFit: "cover" }} />
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
                                        <Image src={coverImg} alt={provider.name} fill sizes="80px" style={{ objectFit: "cover" }} />
                                    ) : (
                                        <div className={styles.sideAvatarFallback}>
                                            {provider.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <p className={styles.sideName}>{provider.name}</p>
                                <span className={styles.sideBadge}>Nhà cung cấp dịch vụ</span>
                                <div className={styles.sideInfoList}>
                                    {provider.address && (
                                        <div className={styles.sideInfoRow}>
                                            <span>📍</span><span>{provider.address}</span>
                                        </div>
                                    )}
                                    {provider.contactPhone && (
                                        <div className={styles.sideInfoRow}>
                                            <span>📞</span>
                                            <a href={`tel:${provider.contactPhone}`}>{provider.contactPhone}</a>
                                        </div>
                                    )}
                                    {provider.contactEmail && (
                                        <div className={styles.sideInfoRow}>
                                            <span>✉️</span>
                                            <a href={`mailto:${provider.contactEmail}`}>{provider.contactEmail}</a>
                                        </div>
                                    )}
                                    {provider.startTime && provider.endTime && (
                                        <div className={styles.sideInfoRow}>
                                            <span>🕐</span><span>{provider.startTime} – {provider.endTime}</span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    className={styles.sidePrimaryBtn}
                                    onClick={() => setActiveTab("services")}
                                >
                                    Xem tất cả dịch vụ
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
