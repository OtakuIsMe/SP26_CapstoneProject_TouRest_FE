"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import Header from "@/components/layouts/header/header";
import Footer from "@/components/layouts/footer/footer";
import { agencyService } from "@/libs/services/agency.service";
import { ItineraryDTO } from "@/types/itinerary.type";
import styles from "./page.module.scss";

const QR_EXPIRE_SECONDS = 15 * 60;

function generateTxnRef(itineraryId: string) {
    return `TXN-${itineraryId.slice(0, 8).toUpperCase()}-${Date.now()}`;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

export default function PaymentPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const tourId = params.id as string;
    const scheduleId = searchParams.get("scheduleId");
    const travelers = Number(searchParams.get("travelers") ?? 1);

    const [itinerary, setItinerary] = useState<ItineraryDTO | null>(null);
    const [qrContent, setQrContent] = useState<string>("");
    const [qrStatus, setQrStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [qrError, setQrError] = useState("");
    const [secondsLeft, setSecondsLeft] = useState(QR_EXPIRE_SECONDS);
    const [txnRef, setTxnRef] = useState("");
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const selectedSchedule =
        itinerary?.schedules.find((s) => s.id === scheduleId) ??
        itinerary?.schedules[0] ??
        null;
    const totalAmount = (itinerary?.price ?? 0) * travelers;

    // Fetch itinerary
    useEffect(() => {
        if (!tourId) return;
        agencyService.getItineraryById(tourId).then((res) => {
            if (res.data) setItinerary(res.data);
        });
    }, [tourId]);

    const generateQr = useCallback(async () => {
        if (!itinerary) return;
        setQrStatus("loading");
        setQrError("");
        setQrContent("");

        const ref = generateTxnRef(tourId);
        setTxnRef(ref);

        try {
            const res = await fetch("/api/payment/generate-qr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: totalAmount,
                    orderInfo: `Thanh toan tour ${itinerary.name}`,
                    txnRef: ref,
                }),
            });

            const data = await res.json();

            if (data.code === "00" && data.qrcontent) {
                setQrContent(data.qrcontent);
                setQrStatus("success");
                setSecondsLeft(QR_EXPIRE_SECONDS);

                if (timerRef.current) clearInterval(timerRef.current);
                timerRef.current = setInterval(() => {
                    setSecondsLeft((s) => {
                        if (s <= 1) {
                            clearInterval(timerRef.current!);
                            setQrStatus("idle");
                            setQrContent("");
                            return 0;
                        }
                        return s - 1;
                    });
                }, 1000);
            } else {
                setQrStatus("error");
                setQrError(data.message ?? "Không thể tạo mã QR");
            }
        } catch {
            setQrStatus("error");
            setQrError("Lỗi kết nối. Vui lòng thử lại.");
        }
    }, [itinerary, tourId, totalAmount]);

    useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    const expirePercent = (secondsLeft / QR_EXPIRE_SECONDS) * 100;

    const tourImage = itinerary?.images?.[0]?.url ?? "/images/landing/explore_1.avif";

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
                        <Link href={`/tours/${tourId}`}>{itinerary?.name ?? "Tour"}</Link>
                        <span>/</span>
                        <span>Thanh toán</span>
                    </nav>

                    <h1 className={styles.pageTitle}>Thanh toán qua VNPay</h1>

                    <div className={styles.layout}>

                        {/* ── LEFT: QR Section ── */}
                        <div className={styles.qrSide}>
                            <div className={styles.qrCard}>
                                <div className={styles.qrCardHeader}>
                                    <div className={styles.vnpayLogo}>
                                        <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
                                            <rect width="48" height="48" rx="10" fill="#0066CC" />
                                            <text x="8" y="33" fontSize="18" fontWeight="bold" fill="white" fontFamily="Arial">VN</text>
                                            <text x="26" y="33" fontSize="18" fontWeight="bold" fill="#F5A623" fontFamily="Arial">P</text>
                                        </svg>
                                        <div>
                                            <span className={styles.vnpayTitle}>VNPay</span>
                                            <span className={styles.vnpaySubtitle}>Quét mã QR để thanh toán</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.qrWrapper}>
                                    {qrStatus === "idle" && (
                                        <div className={styles.qrPlaceholder}>
                                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                                                <rect x="3" y="3" width="7" height="7" rx="1" stroke="#9ca3af" strokeWidth="1.5" />
                                                <rect x="14" y="3" width="7" height="7" rx="1" stroke="#9ca3af" strokeWidth="1.5" />
                                                <rect x="3" y="14" width="7" height="7" rx="1" stroke="#9ca3af" strokeWidth="1.5" />
                                                <path d="M14 14h2v2h-2zM18 14h3v3h-3zM14 18h3v3h-3z" fill="#9ca3af" />
                                            </svg>
                                            <p>Nhấn nút bên dưới để tạo mã QR</p>
                                        </div>
                                    )}

                                    {qrStatus === "loading" && (
                                        <div className={styles.qrPlaceholder}>
                                            <div className={styles.spinner} />
                                            <p>Đang tạo mã QR...</p>
                                        </div>
                                    )}

                                    {qrStatus === "success" && qrContent && (
                                        <div className={styles.qrImageWrapper}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrContent)}`}
                                                alt="VNPay QR Code"
                                                className={styles.qrImage}
                                                width={220}
                                                height={220}
                                            />
                                            <div className={styles.timerBar}>
                                                <div
                                                    className={styles.timerFill}
                                                    style={{
                                                        width: `${expirePercent}%`,
                                                        backgroundColor: expirePercent > 40 ? "#2a9d8f" : expirePercent > 15 ? "#f59e0b" : "#ef4444",
                                                    }}
                                                />
                                            </div>
                                            <p className={styles.timerText}>
                                                Mã hết hạn sau{" "}
                                                <strong style={{ color: expirePercent > 40 ? "#2a9d8f" : expirePercent > 15 ? "#f59e0b" : "#ef4444" }}>
                                                    {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                                                </strong>
                                            </p>
                                        </div>
                                    )}

                                    {qrStatus === "error" && (
                                        <div className={styles.qrError}>
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                                                <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="1.5" />
                                                <path d="M12 8v4M12 16h.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                            <p>{qrError}</p>
                                        </div>
                                    )}
                                </div>

                                {(qrStatus === "idle" || qrStatus === "error") && (
                                    <button
                                        className={styles.generateBtn}
                                        onClick={generateQr}
                                        disabled={!itinerary}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                            <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                                            <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                                            <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                                            <path d="M14 14h2v2h-2zM18 14h3v3h-3zM14 18h3v3h-3z" fill="currentColor" />
                                        </svg>
                                        {qrStatus === "error" ? "Thử lại" : "Tạo mã QR thanh toán"}
                                    </button>
                                )}

                                {qrStatus === "success" && (
                                    <button className={styles.refreshBtn} onClick={generateQr}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Tạo lại mã QR
                                    </button>
                                )}

                                <div className={styles.instructions}>
                                    <p className={styles.instructionTitle}>Hướng dẫn thanh toán</p>
                                    <ol className={styles.instructionList}>
                                        <li>Mở ứng dụng ngân hàng hoặc VNPay</li>
                                        <li>Chọn tính năng <strong>Quét QR</strong></li>
                                        <li>Quét mã QR ở trên</li>
                                        <li>Xác nhận thông tin và thanh toán</li>
                                    </ol>
                                </div>

                                <div className={styles.bankLogos}>
                                    {["Vietcombank", "Techcombank", "MB Bank", "VPBank", "ACB"].map((b) => (
                                        <span key={b} className={styles.bankBadge}>{b}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT: Order Summary ── */}
                        <aside className={styles.summarySide}>
                            <div className={styles.summaryCard}>
                                <h3 className={styles.summaryTitle}>Thông tin đơn hàng</h3>

                                {itinerary ? (
                                    <>
                                        <div className={styles.summaryImage}>
                                            <Image src={tourImage} alt={itinerary.name} fill sizes="320px" style={{ objectFit: "cover" }} />
                                        </div>

                                        <p className={styles.summaryTourName}>{itinerary.name}</p>

                                        {selectedSchedule && (
                                            <div className={styles.summaryDates}>
                                                <div className={styles.summaryDateBox}>
                                                    <span className={styles.summaryDateLabel}>Check-in</span>
                                                    <span className={styles.summaryDateVal}>{formatDate(selectedSchedule.startTime)}</span>
                                                </div>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                                    <path d="M5 12h14M13 6l6 6-6 6" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <div className={styles.summaryDateBox}>
                                                    <span className={styles.summaryDateLabel}>Check-out</span>
                                                    <span className={styles.summaryDateVal}>{formatDate(selectedSchedule.endTime)}</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className={styles.summaryDivider} />

                                        <div className={styles.summaryRow}>
                                            <span>Giá / người</span>
                                            <span>{itinerary.price.toLocaleString("vi-VN")}đ</span>
                                        </div>
                                        <div className={styles.summaryRow}>
                                            <span>Số người</span>
                                            <span>× {travelers}</span>
                                        </div>
                                        <div className={styles.summaryDivider} />
                                        <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                                            <strong>Tổng tiền</strong>
                                            <strong className={styles.summaryTotalPrice}>
                                                {totalAmount.toLocaleString("vi-VN")}đ
                                            </strong>
                                        </div>

                                        {txnRef && (
                                            <div className={styles.txnRef}>
                                                Mã giao dịch: <strong>{txnRef}</strong>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className={styles.skeletonBlock} />
                                )}
                            </div>

                            <div className={styles.trustCard}>
                                <div className={styles.trustItem}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#e6f7f5" stroke="#2a9d8f" strokeWidth="1.5" />
                                    </svg>
                                    <span>Thanh toán bảo mật SSL</span>
                                </div>
                                <div className={styles.trustItem}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <path d="M3 10h18M7 15h1M12 15h1" stroke="#2a9d8f" strokeWidth="1.5" strokeLinecap="round" />
                                        <rect x="2" y="5" width="20" height="14" rx="2" stroke="#2a9d8f" strokeWidth="1.5" />
                                    </svg>
                                    <span>Hỗ trợ đa ngân hàng</span>
                                </div>
                                <div className={styles.trustItem}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="#2a9d8f" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                    <span>Hoàn tiền trong 24h nếu hủy</span>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
