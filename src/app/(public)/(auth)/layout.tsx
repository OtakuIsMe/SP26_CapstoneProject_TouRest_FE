import Link from "next/link";
import styles from "./layout.module.scss";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={styles.page}>
            {/* Left - Form area */}
            <div className={styles.left}>
                <div className={styles.leftInner}>
                    <Link href="/" className={styles.logo}>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
                                fill="currentColor"
                            />
                        </svg>
                        TouRest
                    </Link>
                    {children}
                </div>
            </div>

            {/* Right - Banner */}
            <div className={styles.right}>
                <Link href="#" className={styles.supportLink}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Support
                </Link>

                <div className={styles.bannerCard}>
                    <p className={styles.bannerCardTitle}>Sale Analytics</p>
                    <div className={styles.bannerStats}>
                        <div className={styles.stat}>
                            <p className={styles.statLabel}>Sales</p>
                            <p className={styles.statValue}>14.5k</p>
                            <p className={`${styles.statChange} ${styles.statUp}`}>↗ +6.2% Last 24hr</p>
                        </div>
                        <div className={styles.stat}>
                            <p className={styles.statLabel}>Product</p>
                            <p className={styles.statValue}>13.9k</p>
                            <p className={`${styles.statChange} ${styles.statDown}`}>↘ +1.4% Last 24hr</p>
                        </div>
                    </div>
                    <div className={styles.chartPlaceholder} />
                </div>

                <div className={styles.bannerText}>
                    <h2 className={styles.bannerTitle}>Introducing new features</h2>
                    <p className={styles.bannerDesc}>
                        Analyzing previous trends ensures that businesses always make the right
                        decision. And as the scale of the decision and its impact magnifies...
                    </p>
                </div>

                <div className={styles.bannerDots}>
                    <button className={styles.navArrow}>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <button />
                    <button className={styles.dotActive} />
                    <button />
                    <button className={styles.navArrow}>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
