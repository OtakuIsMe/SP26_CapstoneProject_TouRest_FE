"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/layouts/header/header";
import Footer from "@/components/layouts/footer/footer";
import { authService } from "@/libs/services/auth.service";
import { userService } from "@/libs/services/user.service";
import { wishlistService, WishlistItemType } from "@/libs/services/wishlist.service";
import { agencyService } from "@/libs/services/agency.service";
import { feedbackService, MyFeedbackDTO } from "@/libs/services/feedback.service";
import { bookingService, BookingDTO } from "@/libs/services/booking.service";
import { bookingItineraryService, BookingItineraryDTO } from "@/libs/services/booking-itinerary.service";
import { UserDTO } from "@/types/user.type";
import { ItineraryDTO } from "@/types/itinerary.type";
import { PROVINCES } from "@/data/vietnam-provinces";
import styles from "./page.module.scss";

const BOOKING_BADGE: Record<string, { bg: string; color: string }> = {
    Pending:   { bg: "#fef9c3", color: "#854d0e" },
    Confirmed: { bg: "#dbeafe", color: "#1d4ed8" },
    Completed: { bg: "#dcfce7", color: "#15803d" },
    Cancelled: { bg: "#fee2e2", color: "#b91c1c" },
};

type BookingWithItinerary = BookingDTO & {
    itinerary: BookingItineraryDTO | null;
};

const TABS = ["Bookings", "Favorites", "Reviews"] as const;
type Tab = typeof TABS[number];

type EditForm = {
    username: string; fullName: string; phone: string;
    dateOfBirth: string; cityId: string; districtId: string; addressDetail: string;
};

const BG_STORAGE_KEY = (id: string) => `profile_bg_${id}`;

export default function ProfilePage() {
    const [activeTab, setActiveTab]     = useState<Tab>("Bookings");
    const [user, setUser]               = useState<UserDTO | null>(null);
    const [loading, setLoading]         = useState(true);
    const [wishlist, setWishlist]         = useState<ItineraryDTO[]>([]);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [wishlistLoaded, setWishlistLoaded]   = useState(false);

    const [bookings, setBookings]               = useState<BookingWithItinerary[]>([]);
    const [bookingsLoading, setBookingsLoading] = useState(false);
    const [bookingsLoaded, setBookingsLoaded]   = useState(false);

    const [myReviews, setMyReviews]           = useState<MyFeedbackDTO[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsLoaded, setReviewsLoaded]   = useState(false);
    const [editOpen, setEditOpen]       = useState(false);
    const [saving, setSaving]           = useState(false);
    const [saveError, setSaveError]     = useState<string | null>(null);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [bgUploading, setBgUploading] = useState(false);
    const [bgImage, setBgImage]         = useState<string | null>(null);
    const [form, setForm] = useState<EditForm>({
        username: "", fullName: "", phone: "",
        dateOfBirth: "", cityId: "", districtId: "", addressDetail: "",
    });

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bgInputRef     = useRef<HTMLInputElement>(null);

    const loadUser = async (userId: string) => {
        const res = await userService.getById(userId);
        const u = res.data;
        setUser(u);
        setForm({
            username:      u.username ?? "",
            fullName:      u.fullName ?? "",
            phone:         u.phone ?? "",
            dateOfBirth:   u.dateOfBirth ? u.dateOfBirth.substring(0, 10) : "",
            cityId:        u.cityId ?? "",
            districtId:    u.districtId ?? "",
            addressDetail: u.addressDetail ?? "",
        });
        const savedBg = localStorage.getItem(BG_STORAGE_KEY(userId));
        if (savedBg) setBgImage(savedBg);
    };

    useEffect(() => {
        authService.getMe()
            .then(res => loadUser(res.data.id))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (activeTab !== "Bookings" || bookingsLoaded) return;
        setBookingsLoading(true);
        bookingService.getMyBookings()
            .then(async res => {
                if (!res?.data) return;
                const withItineraries = await Promise.all(
                    res.data.map(async b => {
                        const itin = await bookingItineraryService.getByBookingId(b.id)
                            .then(r => r?.data?.[0] ?? null)
                            .catch(() => null);
                        return { ...b, itinerary: itin };
                    }),
                );
                setBookings(withItineraries);
            })
            .catch(() => {})
            .finally(() => { setBookingsLoading(false); setBookingsLoaded(true); });
    }, [activeTab, bookingsLoaded]);

    useEffect(() => {
        if (activeTab !== "Reviews" || reviewsLoaded) return;
        setReviewsLoading(true);
        feedbackService.getMyFeedbacks()
            .then(res => { if (res?.data) setMyReviews(res.data); })
            .catch(() => {})
            .finally(() => { setReviewsLoading(false); setReviewsLoaded(true); });
    }, [activeTab, reviewsLoaded]);

    useEffect(() => {
        if (activeTab !== "Favorites" || wishlistLoaded) return;
        setWishlistLoading(true);
        wishlistService.getMyWishlist()
            .then(async res => {
                if (!res?.data) return;
                const itineraryIds = res.data
                    .filter(w => w.itemType === WishlistItemType.Itinerary)
                    .map(w => w.itemId);
                const results = await Promise.all(
                    itineraryIds.map(itemId =>
                        agencyService.getItineraryById(itemId)
                            .then(r => r?.data ?? null)
                            .catch(() => null),
                    ),
                );
                setWishlist(results.filter((r): r is ItineraryDTO => r !== null));
            })
            .catch(() => {})
            .finally(() => { setWishlistLoading(false); setWishlistLoaded(true); });
    }, [activeTab, wishlistLoaded]);

    function removeFromWishlist(itineraryId: string) {
        setWishlist(prev => prev.filter(i => i.id !== itineraryId));
        wishlistService.remove(itineraryId).catch(() => {
            setWishlistLoaded(false);
        });
    }

    const handleSave = async () => {
        if (!user) return;
        setSaving(true); setSaveError(null);
        try {
            await userService.updateProfile({
                username:      form.username || undefined,
                fullName:      form.fullName || undefined,
                phone:         form.phone || undefined,
                dateOfBirth:   form.dateOfBirth || undefined,
                cityId:        form.cityId || undefined,
                districtId:    form.districtId || undefined,
                addressDetail: form.addressDetail || undefined,
            });
            await loadUser(user.id);
            setEditOpen(false);
        } catch (err: any) {
            setSaveError(err?.response?.data?.message ?? "Failed to save. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        setAvatarUploading(true);
        try {
            const uploadRes = await userService.uploadImage(file);
            const url = uploadRes.data.url;
            await userService.updateProfile({ imageUrl: url });
            await loadUser(user.id);
        } catch {
            // silently ignore; user can retry
        } finally {
            setAvatarUploading(false);
            if (avatarInputRef.current) avatarInputRef.current.value = "";
        }
    };

    const handleBgChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        setBgUploading(true);
        try {
            const uploadRes = await userService.uploadImage(file);
            const url = uploadRes.data.url;
            setBgImage(url);
            localStorage.setItem(BG_STORAGE_KEY(user.id), url);
        } catch {
            // silently ignore
        } finally {
            setBgUploading(false);
            if (bgInputRef.current) bgInputRef.current.value = "";
        }
    };

    const removeBg = () => {
        if (!user) return;
        setBgImage(null);
        localStorage.removeItem(BG_STORAGE_KEY(user.id));
    };

    const districts = PROVINCES.find(p => p.id === form.cityId)?.districts ?? [];

    const formatDob = (iso?: string) => {
        if (!iso) return null;
        return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    };

    const initials = user?.fullName
        ? user.fullName.split(" ").map(w => w[0]).slice(-2).join("").toUpperCase()
        : user?.username?.[0]?.toUpperCase() ?? "?";

    const displayName = user?.fullName || user?.username || "—";

    if (loading) return (
        <div className={styles.page}>
            <Header variant="solid" />
            <div className={styles.loadingWrap}><div className={styles.spinner} /></div>
        </div>
    );

    const editFields: { key: keyof EditForm; label: string; type: string; placeholder: string }[] = [
        { key: "username",      label: "Username",       type: "text", placeholder: "Your username" },
        { key: "fullName",      label: "Full name",      type: "text", placeholder: "Your full name" },
        { key: "phone",         label: "Phone",          type: "text", placeholder: "+84 000 000 000" },
        { key: "dateOfBirth",   label: "Date of birth",  type: "date", placeholder: "" },
        { key: "addressDetail", label: "Address detail", type: "text", placeholder: "Street, house number…" },
    ];

    return (
        <div className={styles.page}>
            <Header variant="solid" />

            {/* Hidden file inputs */}
            <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarChange}
            />
            <input
                ref={bgInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleBgChange}
            />

            {/* Profile header */}
            <div
                className={styles.profileSection}
                style={bgImage ? { backgroundImage: `url(${bgImage})` } : undefined}
            >
                {/* Gradient orbs (hidden when custom bg is set) */}
                {!bgImage && (
                    <>
                        <div className={styles.orb} />
                        <div className={styles.orbSecondary} />
                    </>
                )}
                {/* Overlay when custom bg */}
                {bgImage && <div className={styles.bgOverlay} />}

                {/* Background edit button */}
                <div className={styles.bgControls}>
                    <button
                        className={styles.bgEditBtn}
                        onClick={() => bgInputRef.current?.click()}
                        disabled={bgUploading}
                        title="Change background"
                    >
                        {bgUploading ? (
                            <div className={styles.miniSpinner} />
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.8"/>
                            </svg>
                        )}
                        {bgUploading ? "Uploading…" : "Change background"}
                    </button>
                    {bgImage && (
                        <button className={styles.bgRemoveBtn} onClick={removeBg} title="Remove background">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            Remove
                        </button>
                    )}
                </div>

                <div className={styles.profileInner}>
                    {/* Clickable avatar */}
                    <div
                        className={styles.avatarWrap}
                        onClick={() => !avatarUploading && avatarInputRef.current?.click()}
                        title="Change avatar"
                    >
                        {user?.imageUrl ? (
                            <div className={styles.avatarImg}>
                                <Image
                                    src={user.imageUrl}
                                    alt={displayName}
                                    fill
                                    sizes="130px"
                                    style={{ objectFit: "cover", borderRadius: "28px" }}
                                />
                            </div>
                        ) : (
                            <div className={styles.avatar}>{initials}</div>
                        )}
                        <div className={styles.avatarOverlay}>
                            {avatarUploading ? (
                                <div className={styles.miniSpinnerWhite} />
                            ) : (
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                                    <circle cx="12" cy="13" r="4" stroke="white" strokeWidth="1.8"/>
                                </svg>
                            )}
                        </div>
                    </div>

                    {/* Name / bio / actions */}
                    <div className={`${styles.profileInfo} ${bgImage ? styles.profileInfoOnBg : ""}`}>
                        <div className={styles.nameRow}>
                            <h1 className={styles.name}>{displayName}</h1>
                            <span className={styles.memberBadge}>MEMBER</span>
                        </div>
                        {user?.email && <p className={styles.bio}>{user.email}</p>}
                        {formatDob(user?.dateOfBirth) && (
                            <p className={styles.bioSub}>Born {formatDob(user?.dateOfBirth)}</p>
                        )}
                        <div className={styles.actions}>
                            <button className={`${styles.btnEdit} ${bgImage ? styles.btnEditOnBg : ""}`} onClick={() => { setEditOpen(true); setSaveError(null); }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                                Edit Profile
                            </button>
                            <Link href="/tours" className={styles.btnExplore}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                                Explore Tours
                            </Link>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className={`${styles.statsGroup} ${bgImage ? styles.statsGroupOnBg : ""}`}>
                        <div className={styles.statItem}>
                            <span className={styles.statNum}>{bookingsLoaded ? bookings.length : "—"}</span>
                            <span className={styles.statLbl}>Total Trips</span>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.statItem}>
                            <span className={styles.statNum}>
                                {bookingsLoaded ? bookings.filter(b => b.status === "Confirmed" || b.status === "Pending").length : "—"}
                            </span>
                            <span className={styles.statLbl}>Upcoming</span>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.statItem}>
                            <span className={styles.statNum}>{reviewsLoaded ? myReviews.length : "—"}</span>
                            <span className={styles.statLbl}>Reviews</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabsBar}>
                <div className={styles.tabsInner}>
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
            </div>

            {/* Content */}
            <div className={styles.content}>
                {activeTab === "Bookings" && (
                    bookingsLoading ? (
                        <div className={styles.wishlistLoading}><div className={styles.spinner} /></div>
                    ) : bookings.length === 0 ? (
                        <div className={styles.emptyWrap}>
                            <div className={styles.emptyIcon}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                    <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                                </svg>
                            </div>
                            <h3 className={styles.emptyTitle}>No bookings yet</h3>
                            <p className={styles.emptyDesc}>
                                Once you complete payment for a tour, your booking will appear here.
                            </p>
                            <Link href="/tours" className={styles.btnExploreEmpty}>Explore Tours</Link>
                        </div>
                    ) : (
                        <div className={styles.bookingsList}>
                            {bookings.map(b => {
                                const badge    = BOOKING_BADGE[b.status] ?? { bg: "#f3f4f6", color: "#6b7280" };
                                const itin     = b.itinerary;
                                const startFmt = itin?.scheduleStartTime
                                    ? new Date(itin.scheduleStartTime).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                                    : null;
                                const endFmt   = itin?.scheduleEndTime
                                    ? new Date(itin.scheduleEndTime).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                                    : null;
                                return (
                                    <div key={b.id} className={styles.bookingCard}>
                                        <div className={styles.bookingCardImagePlaceholder}>
                                            <svg viewBox="0 0 24 24" fill="none" width="32" height="32" style={{ color: "#cbd5e1" }}>
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5"/>
                                                <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
                                            </svg>
                                        </div>
                                        <div className={styles.bookingCardBody}>
                                            <div className={styles.bookingCardTop}>
                                                <span className={styles.bookingCardBadge} style={{ background: badge.bg, color: badge.color }}>
                                                    {b.status}
                                                </span>
                                                <span className={styles.bookingCardCode}>{b.code}</span>
                                            </div>
                                            <h4 className={styles.bookingCardName}>{itin?.itineraryName ?? "Tour Package"}</h4>
                                            {startFmt && (
                                                <div className={styles.bookingCardMeta}>
                                                    <span>
                                                        <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                                                        {startFmt}{endFmt ? ` – ${endFmt}` : ""}
                                                    </span>
                                                    {itin && (
                                                        <span>
                                                            <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                                                            {itin.numberOfGuests} traveler{itin.numberOfGuests > 1 ? "s" : ""}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.bookingCardRight}>
                                            <span className={styles.bookingCardPrice}>{(itin?.finalPrice ?? b.totalAmount).toLocaleString("vi-VN")}đ</span>
                                            <Link href={`/profile/bookings/${b.id}`} className={styles.bookingCardBtn}>
                                                View Details
                                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}

                {activeTab === "Favorites" && (
                    wishlistLoading ? (
                        <div className={styles.wishlistLoading}>
                            <div className={styles.spinner} />
                        </div>
                    ) : wishlist.length === 0 ? (
                        <div className={styles.emptyWrap}>
                            <div className={styles.emptyIcon}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <h3 className={styles.emptyTitle}>No saved tours yet</h3>
                            <p className={styles.emptyDesc}>
                                Tap the heart icon on any tour to save it here.<br/>
                                Your wishlist is waiting!
                            </p>
                            <Link href="/tours" className={styles.btnExploreEmpty}>Explore Tours</Link>
                        </div>
                    ) : (
                        <div className={styles.favGrid}>
                            {wishlist.map(item => {
                                const thumb = item.images?.[0]?.url ?? null;
                                return (
                                    <div key={item.id} className={styles.favCard}>
                                        <Link href={`/tours/${item.id}`} className={styles.favCardLink}>
                                            <div className={styles.favCardImg}>
                                                {thumb ? (
                                                    <Image src={thumb} alt={item.name} fill sizes="320px" style={{ objectFit: "cover" }} />
                                                ) : (
                                                    <div className={styles.favCardImgPlaceholder} />
                                                )}
                                            </div>
                                            <div className={styles.favCardBody}>
                                                <p className={styles.favCardType}>Tour Package</p>
                                                <h4 className={styles.favCardName}>{item.name}</h4>
                                                {item.agencyName && (
                                                    <p className={styles.favCardAgency}>{item.agencyName}</p>
                                                )}
                                                <div className={styles.favCardTags}>
                                                    {item.durationDays > 0 && (
                                                        <span className={styles.favCardTag}>
                                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                                                                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                                            </svg>
                                                            {item.durationDays} {item.durationDays === 1 ? "day" : "days"}
                                                        </span>
                                                    )}
                                                    {item.stopCount > 0 && (
                                                        <span className={styles.favCardTag}>
                                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                                                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" fill="currentColor"/>
                                                            </svg>
                                                            {item.stopCount} {item.stopCount === 1 ? "stop" : "stops"}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={styles.favCardPrice}>
                                                    {item.price.toLocaleString("vi-VN")}đ
                                                    <span className={styles.favCardPriceUnit}>/tour</span>
                                                </p>
                                            </div>
                                        </Link>
                                        <button
                                            className={styles.favCardRemove}
                                            onClick={() => removeFromWishlist(item.id)}
                                            aria-label="Remove from wishlist"
                                            title="Remove from wishlist"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                                            </svg>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}

                {activeTab === "Reviews" && (
                    reviewsLoading ? (
                        <div className={styles.wishlistLoading}>
                            <div className={styles.spinner} />
                        </div>
                    ) : myReviews.length === 0 ? (
                        <div className={styles.emptyWrap}>
                            <div className={styles.emptyIcon}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <h3 className={styles.emptyTitle}>No reviews yet</h3>
                            <p className={styles.emptyDesc}>
                                Complete a tour and share your experience.<br/>
                                Your review helps other travelers decide!
                            </p>
                            <Link href="/tours" className={styles.btnExploreEmpty}>Explore Tours</Link>
                        </div>
                    ) : (
                        <div className={styles.reviewsList}>
                            {myReviews.map(r => (
                                <div key={r.bookingItineraryId} className={styles.reviewCard}>
                                    <div className={styles.reviewCardHeader}>
                                        <div className={styles.reviewCardLeft}>
                                            {r.itineraryName && (
                                                <Link href={`/tours/${r.itineraryId}`} className={styles.reviewCardTourName}>
                                                    {r.itineraryName}
                                                </Link>
                                            )}
                                            <div className={styles.reviewCardStars}>
                                                {[1,2,3,4,5].map(s => (
                                                    <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill={s <= r.rating ? "#f59e0b" : "none"} stroke={s <= r.rating ? "#f59e0b" : "#d1d5db"} strokeWidth="1.5">
                                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                                    </svg>
                                                ))}
                                                <span className={styles.reviewCardRatingNum}>{r.rating}/5</span>
                                            </div>
                                        </div>
                                        <div className={styles.reviewCardMeta}>
                                            {r.isAnonymous && (
                                                <span className={styles.reviewCardAnon}>Anonymous</span>
                                            )}
                                            <span className={styles.reviewCardDate}>
                                                {new Date(r.createAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                            </span>
                                        </div>
                                    </div>
                                    <h4 className={styles.reviewCardTitle}>{r.title}</h4>
                                    {r.comment && (
                                        <p className={styles.reviewCardComment}>{r.comment}</p>
                                    )}
                                    {r.agencyReply && (
                                        <div className={styles.reviewCardReply}>
                                            <div className={styles.reviewCardReplyLabel}>
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                                                    <path d="M9 10h.01M15 10h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                                </svg>
                                                Agency reply
                                                {r.repliedAt && (
                                                    <span className={styles.reviewCardReplyDate}>
                                                        · {new Date(r.repliedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                                    </span>
                                                )}
                                            </div>
                                            <p className={styles.reviewCardReplyText}>{r.agencyReply}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* Edit modal */}
            {editOpen && (
                <div className={styles.modalOverlay} onClick={() => setEditOpen(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHead}>
                            <h2 className={styles.modalTitle}>Edit Profile</h2>
                            <button className={styles.modalClose} onClick={() => setEditOpen(false)}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            {editFields.map(f => (
                                <div key={f.key} className={styles.field}>
                                    <label>{f.label}</label>
                                    <input
                                        type={f.type}
                                        value={form[f.key]}
                                        placeholder={f.placeholder}
                                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                                    />
                                </div>
                            ))}
                            <div className={styles.field}>
                                <label>City / Province</label>
                                <select value={form.cityId} onChange={e => setForm(p => ({ ...p, cityId: e.target.value, districtId: "" }))}>
                                    <option value="">— Select city —</option>
                                    {PROVINCES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className={styles.field}>
                                <label>District</label>
                                <select value={form.districtId} disabled={!form.cityId} onChange={e => setForm(p => ({ ...p, districtId: e.target.value }))}>
                                    <option value="">— Select district —</option>
                                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            {saveError && <p className={styles.saveError}>{saveError}</p>}
                        </div>
                        <div className={styles.modalFoot}>
                            <button className={styles.cancelBtn} onClick={() => setEditOpen(false)}>Cancel</button>
                            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                                {saving ? "Saving…" : "Save changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
