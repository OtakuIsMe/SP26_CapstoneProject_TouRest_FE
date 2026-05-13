"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/layouts/header/header";
import Footer from "@/components/layouts/footer/footer";
import styles from "./page.module.scss";

function SuccessContent() {
    const searchParams = useSearchParams();
    const orderCode = searchParams.get("orderCode");
    const status    = searchParams.get("status");
    const code      = searchParams.get("code");
    const isSuccess = code === "00" || status === "PAID";

    const [count, setCount] = useState(10);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!isSuccess) return;
        timerRef.current = setInterval(() => {
            setCount(c => {
                if (c <= 1) {
                    clearInterval(timerRef.current!);
                    window.location.href = "/profile";
                    return 0;
                }
                return c - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isSuccess]);

    if (isSuccess) {
        return (
            <>
                <div className={styles.iconWrap}>
                    <svg className={styles.checkSvg} viewBox="0 0 80 80" fill="none">
                        <circle className={styles.checkCircle} cx="40" cy="40" r="36" stroke="#22c55e" strokeWidth="5" strokeLinecap="round"/>
                        <path className={styles.checkMark} d="M24 40l12 12 20-24" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>

                <h1 className={styles.title}>Payment Successful!</h1>
                <p className={styles.subtitle}>Your booking has been confirmed. Thank you for choosing TouRest!</p>

                {orderCode && (
                    <div className={styles.infoBox}>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Order code</span>
                            <span className={styles.infoValue}>#{orderCode}</span>
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Status</span>
                            <span className={styles.statusBadge}>Confirmed</span>
                        </div>
                    </div>
                )}

                <p className={styles.redirectNote}>
                    Redirecting to your bookings in <strong>{count}s</strong>…
                </p>

                <div className={styles.actions}>
                    <Link href="/profile" className={styles.btnPrimary}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                            <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        View My Bookings
                    </Link>
                    <Link href="/tours" className={styles.btnOutline}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Explore More Tours
                    </Link>
                </div>
            </>
        );
    }

    return (
        <>
            <div className={styles.iconWrapFail}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="1.8"/>
                    <path d="M15 9l-6 6M9 9l6 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
                </svg>
            </div>
            <h1 className={`${styles.title} ${styles.titleFail}`}>Payment Failed</h1>
            <p className={styles.subtitle}>Something went wrong with your payment. Please try again.</p>
            <div className={styles.actions}>
                <Link href="/tours" className={styles.btnPrimary}>Try Again</Link>
            </div>
        </>
    );
}

export default function PaymentSuccessPage() {
    return (
        <div className={styles.page}>
            <Header variant="solid" />
            <main className={styles.main}>
                <div className={styles.card}>
                    <Suspense fallback={<div className={styles.spinner} />}>
                        <SuccessContent />
                    </Suspense>
                </div>
            </main>
            <Footer />
        </div>
    );
}
