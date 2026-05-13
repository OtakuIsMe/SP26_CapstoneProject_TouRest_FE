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

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export default function PaymentPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const tourId = params.id as string;
    const bookingId = searchParams.get("bookingId") ?? "";
    const scheduleId = searchParams.get("scheduleId");
    const travelers = Number(searchParams.get("travelers") ?? 1);

    const [itinerary, setItinerary] = useState<ItineraryDTO | null>(null);
    const [qrContent, setQrContent] = useState<string>("");
    const [checkoutUrl, setCheckoutUrl] = useState<string>("");
    const [finalAmount, setFinalAmount] = useState<number>(0);
    const [qrStatus, setQrStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [qrError, setQrError] = useState("");
    const [secondsLeft, setSecondsLeft] = useState(QR_EXPIRE_SECONDS);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null);

    const selectedSchedule =
        itinerary?.schedules.find((s) => s.id === scheduleId) ??
        itinerary?.schedules[0] ??
        null;

    useEffect(() => {
        if (!tourId) return;
        agencyService.getItineraryById(tourId).then((res) => {
            if (res.data) setItinerary(res.data);
        });
    }, [tourId]);

    const generateQr = useCallback(async () => {
        if (!bookingId) return;
        setQrStatus("loading");
        setQrError("");
        setQrContent("");
        setCheckoutUrl("");

        try {
            const res = await agencyService.createPayment(bookingId);
            const payment = res.data;

            if (payment.qrCode) {
                setQrContent(payment.qrCode);
                setCheckoutUrl(payment.checkoutUrl ?? "");
                setFinalAmount(payment.finalAmount);
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
                setQrError("No QR code received from the server.");
            }
        } catch {
            setQrStatus("error");
            setQrError("Connection error. Please try again.");
        }
    }, [bookingId]);

    // Poll payment status every 4s while QR is displayed
    useEffect(() => {
        if (qrStatus !== "success" || !bookingId) {
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
            return;
        }
        pollRef.current = setInterval(async () => {
            try {
                const res = await agencyService.getActivePayment(bookingId);
                if (res.data?.status === "Paid") {
                    clearInterval(pollRef.current!); pollRef.current = null;
                    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
                    window.location.href = `/payment/success?orderCode=${res.data.orderCode}&status=PAID&code=00`;
                }
            } catch { /* ignore */ }
        }, 4000);
        return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
    }, [qrStatus, bookingId]);

    useEffect(() => () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (pollRef.current)  clearInterval(pollRef.current);
    }, []);

    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    const expirePercent = (secondsLeft / QR_EXPIRE_SECONDS) * 100;
    const timerColor = expirePercent > 40 ? "#2a9d8f" : expirePercent > 15 ? "#f59e0b" : "#ef4444";

    const displayAmount = finalAmount || (itinerary?.price ?? 0) * travelers;
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
                        <span>Payment</span>
                    </nav>

                    <h1 className={styles.pageTitle}>Pay with QR Code</h1>

                    <div className={styles.layout}>

                        {/* ── LEFT: QR Section ── */}
                        <div className={styles.qrSide}>
                            <div className={styles.qrCard}>
                                <div className={styles.qrCardHeader}>
                                    <div className={styles.vnpayLogo}>
                                        <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
                                            <rect width="48" height="48" rx="10" fill="#0866FF" />
                                            <text x="9" y="33" fontSize="17" fontWeight="bold" fill="white" fontFamily="Arial">Pay</text>
                                            <text x="29" y="33" fontSize="17" fontWeight="bold" fill="#FFCC00" fontFamily="Arial">OS</text>
                                        </svg>
                                        <div>
                                            <span className={styles.vnpayTitle}>PayOS</span>
                                            <span className={styles.vnpaySubtitle}>Scan QR code to complete payment</span>
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
                                            <p>Click the button below to generate your QR code</p>
                                        </div>
                                    )}

                                    {qrStatus === "loading" && (
                                        <div className={styles.qrPlaceholder}>
                                            <div className={styles.spinner} />
                                            <p>Generating QR code...</p>
                                        </div>
                                    )}

                                    {qrStatus === "success" && qrContent && (
                                        <div className={styles.qrImageWrapper}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrContent)}`}
                                                alt="Payment QR Code"
                                                className={styles.qrImage}
                                                width={220}
                                                height={220}
                                            />
                                            <div className={styles.timerBar}>
                                                <div
                                                    className={styles.timerFill}
                                                    style={{ width: `${expirePercent}%`, backgroundColor: timerColor }}
                                                />
                                            </div>
                                            <p className={styles.timerText}>
                                                Expires in{" "}
                                                <strong style={{ color: timerColor }}>
                                                    {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                                                </strong>
                                            </p>
                                            {checkoutUrl && (
                                                <a
                                                    href={checkoutUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.checkoutLink}
                                                >
                                                    Or pay via browser →
                                                </a>
                                            )}
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
                                        disabled={!bookingId}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                            <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                                            <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                                            <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                                            <path d="M14 14h2v2h-2zM18 14h3v3h-3zM14 18h3v3h-3z" fill="currentColor" />
                                        </svg>
                                        {qrStatus === "error" ? "Try Again" : "Generate QR Code"}
                                    </button>
                                )}

                                {qrStatus === "success" && (
                                    <button className={styles.refreshBtn} onClick={generateQr}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Refresh QR Code
                                    </button>
                                )}

                                <div className={styles.instructions}>
                                    <p className={styles.instructionTitle}>How to pay</p>
                                    <ol className={styles.instructionList}>
                                        <li>Open your banking app or e-wallet</li>
                                        <li>Select <strong>Scan QR</strong></li>
                                        <li>Scan the QR code above</li>
                                        <li>Confirm the details and complete payment</li>
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
                                <h3 className={styles.summaryTitle}>Order Summary</h3>

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
                                            <span>Price / person</span>
                                            <span>{itinerary.price.toLocaleString("vi-VN")}đ</span>
                                        </div>
                                        <div className={styles.summaryRow}>
                                            <span>Travelers</span>
                                            <span>× {travelers}</span>
                                        </div>
                                        <div className={styles.summaryDivider} />
                                        <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                                            <strong>Total</strong>
                                            <strong className={styles.summaryTotalPrice}>
                                                {displayAmount.toLocaleString("vi-VN")}đ
                                            </strong>
                                        </div>
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
                                    <span>SSL secured payment</span>
                                </div>
                                <div className={styles.trustItem}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <path d="M3 10h18M7 15h1M12 15h1" stroke="#2a9d8f" strokeWidth="1.5" strokeLinecap="round" />
                                        <rect x="2" y="5" width="20" height="14" rx="2" stroke="#2a9d8f" strokeWidth="1.5" />
                                    </svg>
                                    <span>Multi-bank support</span>
                                </div>
                                <div className={styles.trustItem}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="#2a9d8f" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                    <span>Full refund within 24h if cancelled</span>
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
