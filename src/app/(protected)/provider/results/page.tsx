"use client";

import { useState, useRef } from "react";
import styles from "./page.module.scss";

// ── Types ─────────────────────────────────────────────────────────────────────
type Gender      = "Nam" | "Nữ";
type GroupStatus = "complete" | "partial" | "pending";

interface Patient {
    id: string;
    name: string;
    dob: string;
    gender: Gender;
    bookingId: string;
    phone: string;
    resultSent: boolean;
    sentAt?: string;
}

interface TourGroup {
    id: string;
    tourName: string;
    date: string;
    agency: string;
    agencyColor: string;
    service: string;
    patients: Patient[];
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const INIT_GROUPS: TourGroup[] = [
    {
        id: "g1",
        tourName: "Hà Long Bay Medical & Wellness",
        date: "12/05/2026",
        agency: "Sunrise Travel",
        agencyColor: "#f59e0b",
        service: "Khám sức khỏe tổng quát",
        patients: [
            { id: "p1", name: "Nguyễn Văn An",    dob: "15/03/1985", gender: "Nam", bookingId: "BK-2026051201", phone: "0912 345 678", resultSent: true,  sentAt: "13/05/2026" },
            { id: "p2", name: "Trần Thị Bình",     dob: "22/07/1990", gender: "Nữ",  bookingId: "BK-2026051202", phone: "0987 654 321", resultSent: true,  sentAt: "13/05/2026" },
            { id: "p3", name: "Lê Minh Cường",     dob: "08/11/1978", gender: "Nam", bookingId: "BK-2026051203", phone: "0901 234 567", resultSent: true,  sentAt: "13/05/2026" },
            { id: "p4", name: "Phạm Thị Dung",     dob: "30/01/1995", gender: "Nữ",  bookingId: "BK-2026051204", phone: "0934 567 890", resultSent: true,  sentAt: "14/05/2026" },
            { id: "p5", name: "Hoàng Văn Em",      dob: "05/06/1982", gender: "Nam", bookingId: "BK-2026051205", phone: "0971 234 567", resultSent: true,  sentAt: "14/05/2026" },
            { id: "p6", name: "Vũ Thị Phương",     dob: "18/09/1988", gender: "Nữ",  bookingId: "BK-2026051206", phone: "0918 765 432", resultSent: true,  sentAt: "14/05/2026" },
            { id: "p7", name: "Đặng Quốc Hùng",    dob: "12/04/1975", gender: "Nam", bookingId: "BK-2026051207", phone: "0903 456 789", resultSent: false },
            { id: "p8", name: "Bùi Thị Lan",       dob: "25/12/1992", gender: "Nữ",  bookingId: "BK-2026051208", phone: "0945 678 901", resultSent: false },
        ],
    },
    {
        id: "g2",
        tourName: "Sapa Wellness Retreat",
        date: "15/05/2026",
        agency: "VietGlobe Travel",
        agencyColor: "#8b5cf6",
        service: "Khám và tư vấn sức khỏe",
        patients: [
            { id: "p9",  name: "Ngô Văn Khoa",    dob: "10/02/1980", gender: "Nam", bookingId: "BK-2026051501", phone: "0912 111 222", resultSent: false },
            { id: "p10", name: "Đinh Thị Mai",     dob: "03/08/1993", gender: "Nữ",  bookingId: "BK-2026051502", phone: "0987 222 333", resultSent: false },
            { id: "p11", name: "Phan Văn Nam",     dob: "28/05/1970", gender: "Nam", bookingId: "BK-2026051503", phone: "0901 333 444", resultSent: false },
            { id: "p12", name: "Lý Thị Oanh",     dob: "14/11/1998", gender: "Nữ",  bookingId: "BK-2026051504", phone: "0934 444 555", resultSent: false },
            { id: "p13", name: "Trương Minh Phú",  dob: "07/03/1987", gender: "Nam", bookingId: "BK-2026051505", phone: "0971 555 666", resultSent: false },
            { id: "p14", name: "Hồ Thị Quỳnh",    dob: "20/07/1991", gender: "Nữ",  bookingId: "BK-2026051506", phone: "0918 666 777", resultSent: false },
            { id: "p15", name: "Lâm Văn Rồng",    dob: "15/10/1976", gender: "Nam", bookingId: "BK-2026051507", phone: "0903 777 888", resultSent: false },
            { id: "p16", name: "Mạc Thị Sen",     dob: "08/04/1984", gender: "Nữ",  bookingId: "BK-2026051508", phone: "0945 888 999", resultSent: false },
            { id: "p17", name: "Cao Văn Thắng",   dob: "22/01/1989", gender: "Nam", bookingId: "BK-2026051509", phone: "0912 999 000", resultSent: false },
            { id: "p18", name: "Đỗ Thị Uyên",     dob: "17/06/1996", gender: "Nữ",  bookingId: "BK-2026051510", phone: "0987 000 111", resultSent: false },
            { id: "p19", name: "Từ Văn Vinh",     dob: "05/09/1983", gender: "Nam", bookingId: "BK-2026051511", phone: "0901 111 222", resultSent: false },
            { id: "p20", name: "Chu Thị Xuân",    dob: "30/12/1994", gender: "Nữ",  bookingId: "BK-2026051512", phone: "0934 222 333", resultSent: false },
        ],
    },
    {
        id: "g3",
        tourName: "Hội An Healing Journey",
        date: "10/05/2026",
        agency: "HoiAn Tours",
        agencyColor: "#22c55e",
        service: "Massage trị liệu & thư giãn",
        patients: [
            { id: "p21", name: "Nguyễn Thị Yến", dob: "11/03/1986", gender: "Nữ",  bookingId: "BK-2026051001", phone: "0912 333 444", resultSent: true, sentAt: "11/05/2026" },
            { id: "p22", name: "Trần Văn Dũng",  dob: "24/07/1979", gender: "Nam", bookingId: "BK-2026051002", phone: "0987 444 555", resultSent: true, sentAt: "11/05/2026" },
            { id: "p23", name: "Lê Thị Ánh",     dob: "09/11/1991", gender: "Nữ",  bookingId: "BK-2026051003", phone: "0901 555 666", resultSent: true, sentAt: "11/05/2026" },
            { id: "p24", name: "Phạm Văn Bắc",   dob: "01/01/1975", gender: "Nam", bookingId: "BK-2026051004", phone: "0934 666 777", resultSent: true, sentAt: "12/05/2026" },
            { id: "p25", name: "Hoàng Thị Cẩm",  dob: "16/06/1988", gender: "Nữ",  bookingId: "BK-2026051005", phone: "0971 777 888", resultSent: true, sentAt: "12/05/2026" },
            { id: "p26", name: "Vũ Văn Dương",   dob: "03/09/1982", gender: "Nam", bookingId: "BK-2026051006", phone: "0918 888 999", resultSent: true, sentAt: "12/05/2026" },
        ],
    },
    {
        id: "g4",
        tourName: "Đà Lạt Health Check Tour",
        date: "18/05/2026",
        agency: "DaLat Adventure",
        agencyColor: "#ef4444",
        service: "Kiểm tra sức khỏe định kỳ",
        patients: [
            { id: "p27", name: "Đặng Thị Hà",    dob: "19/04/1990", gender: "Nữ",  bookingId: "BK-2026051801", phone: "0912 444 555", resultSent: true,  sentAt: "19/05/2026" },
            { id: "p28", name: "Bùi Văn Hải",    dob: "07/10/1977", gender: "Nam", bookingId: "BK-2026051802", phone: "0987 555 666", resultSent: true,  sentAt: "19/05/2026" },
            { id: "p29", name: "Ngô Thị Hiền",   dob: "25/02/1995", gender: "Nữ",  bookingId: "BK-2026051803", phone: "0901 666 777", resultSent: true,  sentAt: "19/05/2026" },
            { id: "p30", name: "Đinh Văn Hùng",  dob: "13/08/1981", gender: "Nam", bookingId: "BK-2026051804", phone: "0934 777 888", resultSent: false },
            { id: "p31", name: "Phan Thị Hương",  dob: "30/05/1993", gender: "Nữ",  bookingId: "BK-2026051805", phone: "0971 888 999", resultSent: false },
            { id: "p32", name: "Lý Văn Khánh",   dob: "08/12/1986", gender: "Nam", bookingId: "BK-2026051806", phone: "0918 999 000", resultSent: false },
            { id: "p33", name: "Trương Thị Kim",  dob: "21/07/1997", gender: "Nữ",  bookingId: "BK-2026051807", phone: "0903 000 111", resultSent: false },
            { id: "p34", name: "Hồ Văn Long",    dob: "04/03/1974", gender: "Nam", bookingId: "BK-2026051808", phone: "0945 111 222", resultSent: false },
            { id: "p35", name: "Lâm Thị Linh",   dob: "17/11/1988", gender: "Nữ",  bookingId: "BK-2026051809", phone: "0912 222 333", resultSent: false },
            { id: "p36", name: "Mạc Văn Lộc",    dob: "09/06/1979", gender: "Nam", bookingId: "BK-2026051810", phone: "0987 333 444", resultSent: false },
        ],
    },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function initials(name: string) {
    return name.trim().split(" ").slice(-2).map(w => w[0]).join("").toUpperCase();
}

const AVATAR_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6", "#14b8a6", "#f97316"];
function avatarColor(i: number) { return AVATAR_COLORS[i % AVATAR_COLORS.length]; }

function groupStatus(g: TourGroup): GroupStatus {
    const sent = g.patients.filter(p => p.resultSent).length;
    if (sent === g.patients.length) return "complete";
    if (sent === 0) return "pending";
    return "partial";
}

const STATUS_LABEL: Record<GroupStatus, string> = {
    complete: "Hoàn tất",
    partial:  "Một phần",
    pending:  "Chưa gửi",
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ResultsPage() {
    const [groups, setGroups]             = useState<TourGroup[]>(INIT_GROUPS);
    const [selectedId, setSelectedId]     = useState<string>(INIT_GROUPS[0].id);
    const [sendTarget, setSendTarget]     = useState<Patient | null>(null);
    const [images, setImages]             = useState<File[]>([]);
    const [previews, setPreviews]         = useState<string[]>([]);
    const [notes, setNotes]               = useState("");
    const [sending, setSending]           = useState(false);
    const [sendSuccess, setSendSuccess]   = useState(false);
    const [search, setSearch]             = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    const currentGroup = groups.find(g => g.id === selectedId) ?? groups[0];
    const filtered     = currentGroup.patients.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.bookingId.toLowerCase().includes(search.toLowerCase())
    );
    const sentCount  = currentGroup.patients.filter(p => p.resultSent).length;
    const totalCount = currentGroup.patients.length;

    function openModal(p: Patient) {
        setSendTarget(p);
        setImages([]);
        setPreviews([]);
        setNotes("");
        setSendSuccess(false);
    }

    function closeModal() {
        previews.forEach(u => URL.revokeObjectURL(u));
        setSendTarget(null);
        setImages([]);
        setPreviews([]);
        setNotes("");
        setSendSuccess(false);
    }

    function addFiles(files: FileList | null) {
        if (!files) return;
        const next = Array.from(files).filter(f => f.type.startsWith("image/") || f.type === "application/pdf");
        const urls = next.map(f => URL.createObjectURL(f));
        setImages(p => [...p, ...next]);
        setPreviews(p => [...p, ...urls]);
    }

    function removePreview(idx: number) {
        URL.revokeObjectURL(previews[idx]);
        setImages(p => p.filter((_, i) => i !== idx));
        setPreviews(p => p.filter((_, i) => i !== idx));
    }

    async function handleSend() {
        if (!sendTarget) return;
        setSending(true);
        await new Promise(r => setTimeout(r, 1800));
        const today = new Date().toLocaleDateString("vi-VN");
        setGroups(prev => prev.map(g => ({
            ...g,
            patients: g.patients.map(p =>
                p.id === sendTarget.id ? { ...p, resultSent: true, sentAt: today } : p
            ),
        })));
        setSending(false);
        setSendSuccess(true);
    }

    function goNextPatient() {
        const remaining = currentGroup.patients.filter(p => !p.resultSent && p.id !== sendTarget?.id);
        if (remaining.length > 0) openModal(remaining[0]);
        else closeModal();
    }

    const targetIdx = sendTarget ? currentGroup.patients.findIndex(p => p.id === sendTarget.id) : 0;

    return (
        <div className={styles.page}>

            {/* ── Left sidebar: group list ── */}
            <aside className={styles.groupSidebar}>
                <div className={styles.sidebarHead}>
                    <div className={styles.sidebarHeadIcon}>
                        <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                            <path d="M14 2v6h6M12 12v4M10 14h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                        </svg>
                    </div>
                    <div>
                        <h2 className={styles.sidebarTitle}>Đoàn khám bệnh</h2>
                        <p className={styles.sidebarSub}>{groups.length} đoàn hoàn thành</p>
                    </div>
                </div>

                <div className={styles.groupList}>
                    {groups.map(g => {
                        const st   = groupStatus(g);
                        const sent = g.patients.filter(p => p.resultSent).length;
                        const pct  = Math.round((sent / g.patients.length) * 100);
                        return (
                            <button
                                key={g.id}
                                className={`${styles.groupCard} ${selectedId === g.id ? styles.groupCardActive : ""}`}
                                onClick={() => { setSelectedId(g.id); setSearch(""); }}
                            >
                                <div className={styles.groupCardRow}>
                                    <span className={styles.groupAgencyDot} style={{ background: g.agencyColor }}/>
                                    <span className={styles.groupAgency}>{g.agency}</span>
                                    <span className={`${styles.groupStatusBadge}
                                        ${st === "complete" ? styles.statusComplete :
                                          st === "partial"  ? styles.statusPartial  :
                                                             styles.statusPending}`}
                                    >
                                        {STATUS_LABEL[st]}
                                    </span>
                                </div>
                                <p className={styles.groupName}>{g.tourName}</p>
                                <div className={styles.groupMeta}>
                                    <svg viewBox="0 0 24 24" fill="none" width="11" height="11">
                                        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                                        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                    </svg>
                                    {g.date}
                                    <span className={styles.metaDot}>·</span>
                                    <svg viewBox="0 0 24 24" fill="none" width="11" height="11">
                                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
                                    </svg>
                                    {g.patients.length} BN
                                </div>
                                <div className={styles.groupProgress}>
                                    <div className={styles.progressTrack}>
                                        <div className={styles.progressFill} style={{ width: `${pct}%`,
                                            background: st === "complete" ? "#22c55e" : st === "partial" ? "#f59e0b" : "#e5e7eb"
                                        }}/>
                                    </div>
                                    <span className={styles.progressLabel}>{sent}/{g.patients.length}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </aside>

            {/* ── Main: patient list ── */}
            <main className={styles.main}>

                {/* Group header */}
                <div className={styles.groupHeader}>
                    <div className={styles.groupHeaderLeft}>
                        <div className={styles.groupHeaderAccent} style={{ background: currentGroup.agencyColor }}/>
                        <div>
                            <h1 className={styles.groupHeaderTitle}>{currentGroup.tourName}</h1>
                            <p className={styles.groupHeaderMeta}>
                                {currentGroup.agency} · {currentGroup.date} · {currentGroup.service}
                            </p>
                        </div>
                    </div>
                    <div className={styles.headerStats}>
                        <div className={styles.headerStat}>
                            <span className={styles.headerStatNum} style={{ color: "#15803d" }}>{sentCount}</span>
                            <span className={styles.headerStatLabel}>Đã gửi</span>
                        </div>
                        <div className={styles.headerStatDiv}/>
                        <div className={styles.headerStat}>
                            <span className={styles.headerStatNum} style={{ color: "#d97706" }}>{totalCount - sentCount}</span>
                            <span className={styles.headerStatLabel}>Chưa gửi</span>
                        </div>
                        <div className={styles.headerStatDiv}/>
                        <div className={styles.headerStat}>
                            <span className={styles.headerStatNum}>{totalCount}</span>
                            <span className={styles.headerStatLabel}>Tổng BN</span>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className={styles.searchWrap}>
                    <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
                        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/>
                        <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                    <input
                        className={styles.searchInput}
                        type="text"
                        placeholder="Tìm tên hoặc mã đặt chỗ…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                        <button className={styles.searchClear} onClick={() => setSearch("")}>
                            <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                            </svg>
                        </button>
                    )}
                </div>

                {/* Patient grid */}
                <div className={styles.patientGrid}>
                    {filtered.map((p, idx) => (
                        <div key={p.id} className={`${styles.patientCard} ${p.resultSent ? styles.patientCardDone : ""}`}>
                            <div className={styles.cardTop}>
                                <div className={styles.patientAvatar} style={{ background: avatarColor(currentGroup.patients.indexOf(p)) }}>
                                    {initials(p.name)}
                                </div>
                                <div className={styles.patientInfo}>
                                    <div className={styles.patientName}>{p.name}</div>
                                    <div className={styles.patientSubMeta}>{p.gender} · {p.dob}</div>
                                    <div className={styles.bookingId}>{p.bookingId}</div>
                                </div>
                                {p.resultSent
                                    ? <span className={styles.sentBadge}>
                                        <svg viewBox="0 0 24 24" fill="none" width="9" height="9">
                                            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                                        </svg>
                                        Đã gửi
                                      </span>
                                    : <span className={styles.pendingBadge}>Chưa gửi</span>
                                }
                            </div>

                            {p.resultSent && p.sentAt && (
                                <div className={styles.sentInfo}>
                                    <svg viewBox="0 0 24 24" fill="none" width="11" height="11">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                                        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                    </svg>
                                    Đã gửi lúc {p.sentAt}
                                </div>
                            )}

                            <div className={styles.patientPhone}>
                                <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.14 12a19.79 19.79 0 01-3.07-8.67A2 2 0 012.06 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.7"/>
                                </svg>
                                {p.phone}
                            </div>

                            <button
                                className={p.resultSent ? styles.resendBtn : styles.sendBtn}
                                onClick={() => openModal(p)}
                            >
                                {p.resultSent ? (
                                    <>
                                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Gửi lại / Chỉnh sửa
                                    </>
                                ) : (
                                    <>
                                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Gửi kết quả
                                    </>
                                )}
                            </button>
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div className={styles.emptyState}>
                            <svg viewBox="0 0 24 24" fill="none" width="40" height="40">
                                <circle cx="11" cy="11" r="8" stroke="#d1d5db" strokeWidth="1.5"/>
                                <path d="M21 21l-4.35-4.35" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            <p>Không tìm thấy bệnh nhân phù hợp</p>
                        </div>
                    )}
                </div>
            </main>

            {/* ── Modal ── */}
            {sendTarget && (
                <div className={styles.overlay} onClick={closeModal}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>

                        {!sendSuccess ? (
                            <>
                                {/* Header */}
                                <div className={styles.modalHeader}>
                                    <div className={styles.modalPatient}>
                                        <div className={styles.modalAvatar} style={{ background: avatarColor(targetIdx) }}>
                                            {initials(sendTarget.name)}
                                        </div>
                                        <div>
                                            <p className={styles.modalName}>{sendTarget.name}</p>
                                            <p className={styles.modalMeta}>
                                                {sendTarget.gender} · {sendTarget.dob} · {sendTarget.bookingId}
                                            </p>
                                        </div>
                                    </div>
                                    <button className={styles.modalClose} onClick={closeModal}>
                                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                                        </svg>
                                    </button>
                                </div>

                                <div className={styles.modalBody}>

                                    {/* Image upload */}
                                    <div className={styles.modalSection}>
                                        <p className={styles.sectionLabel}>
                                            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7"/>
                                                <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.7"/>
                                                <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            Hình ảnh hồ sơ bệnh án
                                            {images.length > 0 && <span className={styles.fileCount}>{images.length} file</span>}
                                        </p>

                                        <div
                                            className={`${styles.dropZone} ${previews.length > 0 ? styles.dropZoneFilled : ""}`}
                                            onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
                                            onDragOver={e => e.preventDefault()}
                                            onClick={() => previews.length === 0 && fileRef.current?.click()}
                                        >
                                            {previews.length === 0 ? (
                                                <>
                                                    <div className={styles.dropIconWrap}>
                                                        <svg viewBox="0 0 24 24" fill="none" width="26" height="26">
                                                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                                                            <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                                                            <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                                                        </svg>
                                                    </div>
                                                    <p className={styles.dropTitle}>Kéo thả ảnh / PDF vào đây</p>
                                                    <p className={styles.dropSub}>hoặc <button className={styles.dropBrowse} onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>chọn từ máy tính</button></p>
                                                    <p className={styles.dropHint}>PNG, JPG, PDF · Tối đa 10 MB/file · Nhiều file</p>
                                                </>
                                            ) : (
                                                <div className={styles.previewGrid} onClick={e => e.stopPropagation()}>
                                                    {previews.map((src, i) => (
                                                        <div key={i} className={styles.previewThumb}>
                                                            <img src={src} alt="" className={styles.previewImg} />
                                                            <button className={styles.previewRemove} onClick={() => removePreview(i)}>
                                                                <svg viewBox="0 0 24 24" fill="none" width="9" height="9">
                                                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button className={styles.previewAdd} onClick={() => fileRef.current?.click()}>
                                                        <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                                                            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                                        </svg>
                                                        <span>Thêm</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            ref={fileRef}
                                            type="file"
                                            accept="image/*,.pdf"
                                            multiple
                                            style={{ display: "none" }}
                                            onChange={e => addFiles(e.target.files)}
                                        />
                                    </div>

                                    {/* Notes */}
                                    <div className={styles.modalSection}>
                                        <p className={styles.sectionLabel}>
                                            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                                                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                                            </svg>
                                            Ghi chú & chẩn đoán
                                        </p>
                                        <textarea
                                            className={styles.notesArea}
                                            placeholder="Nhập chẩn đoán, kết quả xét nghiệm, khuyến nghị điều trị hoặc ghi chú quan trọng cho bệnh nhân…"
                                            rows={5}
                                            value={notes}
                                            onChange={e => setNotes(e.target.value.slice(0, 1000))}
                                        />
                                        <div className={styles.notesFooter}>
                                            <span className={styles.charCount}>{notes.length}/1000</span>
                                        </div>
                                    </div>

                                    {/* Warning if empty */}
                                    {images.length === 0 && !notes.trim() && (
                                        <div className={styles.emptyWarn}>
                                            <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                                                <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                            </svg>
                                            Vui lòng đính kèm ít nhất 1 hình ảnh hoặc nhập ghi chú trước khi gửi.
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className={styles.modalFooter}>
                                    <button className={styles.cancelBtn} onClick={closeModal} disabled={sending}>Huỷ</button>
                                    <button
                                        className={styles.sendResultBtn}
                                        disabled={sending || (images.length === 0 && !notes.trim())}
                                        onClick={handleSend}
                                    >
                                        {sending ? (
                                            <><span className={styles.spinner}/> Đang gửi…</>
                                        ) : (
                                            <>
                                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                                Gửi kết quả cho bệnh nhân
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        ) : (
                            /* Success panel */
                            <div className={styles.successPanel}>
                                <div className={styles.successIconWrap}>
                                    <div className={styles.successRing}/>
                                    <div className={styles.successIcon}>
                                        <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
                                            <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                </div>
                                <h3 className={styles.successTitle}>Đã gửi thành công!</h3>
                                <p className={styles.successSub}>
                                    Kết quả khám bệnh của <strong>{sendTarget.name}</strong> đã được gửi đi.<br/>
                                    Bệnh nhân sẽ nhận thông báo qua ứng dụng.
                                </p>
                                {(() => {
                                    const remaining = currentGroup.patients.filter(p => !p.resultSent && p.id !== sendTarget.id);
                                    return (
                                        <div className={styles.successActions}>
                                            <button className={styles.doneBtn} onClick={closeModal}>Đóng</button>
                                            {remaining.length > 0 && (
                                                <button className={styles.nextBtn} onClick={goNextPatient}>
                                                    Bệnh nhân tiếp theo ({remaining.length} còn lại) →
                                                </button>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
