"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/layouts/header/header";
import Footer from "@/components/layouts/footer/footer";
import { authService } from "@/libs/services/auth.service";
import { userService } from "@/libs/services/user.service";
import { UserDTO } from "@/types/user.type";
import { PROVINCES } from "@/data/vietnam-provinces";
import styles from "./page.module.scss";

const TABS = ["Bookings", "Reviews"] as const;
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
                            <span className={styles.statNum}>0</span>
                            <span className={styles.statLbl}>Total Trips</span>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.statItem}>
                            <span className={styles.statNum}>0</span>
                            <span className={styles.statLbl}>Upcoming</span>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.statItem}>
                            <span className={styles.statNum}>0</span>
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
                    <div className={styles.emptyWrap}>
                        <div className={styles.emptyIcon}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                                <path d="M8 14h5M8 17h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <h3 className={styles.emptyTitle}>No bookings yet</h3>
                        <p className={styles.emptyDesc}>
                            You haven&apos;t booked any tours yet.<br/>
                            Start exploring and plan your next adventure!
                        </p>
                        <Link href="/tours" className={styles.emptyBtn}>Browse Tours</Link>
                    </div>
                )}

                {activeTab === "Reviews" && (
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
                    </div>
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
