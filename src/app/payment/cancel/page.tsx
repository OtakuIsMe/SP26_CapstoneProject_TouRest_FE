"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/layouts/header/header";
import Footer from "@/components/layouts/footer/footer";
import styles from "../success/page.module.scss";

function CancelContent() {
    const searchParams = useSearchParams();
    const orderCode = searchParams.get("orderCode");

    return (
        <>
            <div className={styles.iconWrapFail}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="1.8" />
                    <path d="M12 8v4M12 16h.01" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </div>

            <h1 className={`${styles.title} ${styles.titleFail}`}>Payment Cancelled</h1>
            <p className={styles.subtitle}>
                Your payment was cancelled. Your booking is still pending — you can return and try again.
            </p>

            {orderCode && (
                <div className={styles.infoBox}>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Order code</span>
                        <span className={styles.infoValue}>#{orderCode}</span>
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Status</span>
                        <span style={{ color: "#f59e0b", fontWeight: 600, fontSize: 13 }}>Cancelled</span>
                    </div>
                </div>
            )}

            <div className={styles.actions}>
                <Link href="/tours" className={styles.btnPrimary}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    Browse Tours
                </Link>
                <Link href="/profile" className={styles.btnOutline}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    My Bookings
                </Link>
            </div>
        </>
    );
}

export default function PaymentCancelPage() {
    return (
        <div className={styles.page}>
            <Header variant="solid" />
            <main className={styles.main}>
                <div className={styles.card}>
                    <Suspense fallback={<div className={styles.spinner} />}>
                        <CancelContent />
                    </Suspense>
                </div>
            </main>
            <Footer />
        </div>
    );
}
