import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layouts/header/header";
import Footer from "@/components/layouts/footer/footer";
import styles from "./page.module.scss";

const stats = [
    { value: "12+", label: "Years of Experience" },
    { value: "50K+", label: "Happy Patients" },
    { value: "120+", label: "Partner Hospitals" },
    { value: "40+", label: "Countries Served" },
];

const values = [
    {
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402C1 3.518 3.8 1 6.8 1c1.875 0 3.637.87 4.863 2.297L12 4.5l.337-.203C13.563 1.87 15.325 1 17.2 1 20.2 1 23 3.518 23 7.191c0 4.105-5.37 8.863-11 14.402z" fill="currentColor" />
            </svg>
        ),
        title: "Patient First",
        desc: "Every decision we make starts with a single question: is this best for the patient? Your health, comfort, and peace of mind are our top priorities.",
    },
    {
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        title: "World-Class Quality",
        desc: "We only partner with JCI-accredited hospitals and internationally certified specialists to ensure you receive the highest standard of care.",
    },
    {
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        ),
        title: "End-to-End Support",
        desc: "From first consultation to post-treatment recovery, we handle logistics, translation, accommodation, and follow-up — every step of the way.",
    },
    {
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        title: "Trusted & Transparent",
        desc: "No hidden fees, no surprises. We provide clear pricing, honest medical opinions, and verified reviews so you can travel with confidence.",
    },
];

const team = [
    { name: "Dr. Sarah Mitchell", role: "Chief Medical Officer", img: "/images/landing/explore_1.avif" },
    { name: "James Nguyen", role: "Head of Patient Experience", img: "/images/landing/explore_2.webp" },
    { name: "Dr. Aisha Rahman", role: "Medical Coordinator", img: "/images/landing/explore_3.jpg" },
    { name: "Carlos Mendez", role: "Travel & Logistics Director", img: "/images/landing/explore_4.avif" },
];

export default function AboutPage() {
    return (
        <main>
            <Header variant="solid" />

            {/* ── Hero ── */}
            <section className={styles.hero}>
                <div className={styles.heroOverlay} />
                <div className={styles.heroContent}>
                    <span className={styles.badge}>About TouRest</span>
                    <h1 className={styles.heroTitle}>
                        Bridging World-Class Healthcare<br />with Seamless Travel
                    </h1>
                    <p className={styles.heroDesc}>
                        TouRest is a leading medical tourism platform connecting patients worldwide
                        with top-tier hospitals, clinics, and wellness retreats — making quality
                        healthcare accessible, affordable, and stress-free.
                    </p>
                    <div className={styles.heroBtns}>
                        <Link href="/tours" className={styles.btnPrimary}>Explore Packages</Link>
                        <Link href="/signin" className={styles.btnOutline}>Get Started</Link>
                    </div>
                </div>
            </section>

            {/* ── Stats ── */}
            <section className={styles.stats}>
                {stats.map((s) => (
                    <div key={s.label} className={styles.statItem}>
                        <span className={styles.statValue}>{s.value}</span>
                        <span className={styles.statLabel}>{s.label}</span>
                    </div>
                ))}
            </section>

            {/* ── Mission ── */}
            <section className={styles.mission}>
                <div className={styles.missionImages}>
                    <div className={styles.missionImg1}>
                        <Image src="/images/landing/explore_1.avif" alt="Mission" fill sizes="50vw" style={{ objectFit: "cover" }} />
                    </div>
                    <div className={styles.missionImg2}>
                        <Image src="/images/landing/explore_2.webp" alt="Mission 2" fill sizes="25vw" style={{ objectFit: "cover" }} />
                    </div>
                </div>
                <div className={styles.missionContent}>
                    <span className={styles.sectionTag}>Our Mission</span>
                    <h2 className={styles.sectionTitle}>Making Global Healthcare Accessible to Everyone</h2>
                    <p className={styles.sectionDesc}>
                        Founded in 2012, TouRest was born from a simple belief — everyone deserves
                        access to the best healthcare, regardless of where they live. We saw patients
                        traveling abroad without guidance, facing language barriers, unfamiliar systems,
                        and hidden costs.
                    </p>
                    <p className={styles.sectionDesc}>
                        We built TouRest to change that. Today, we serve over 50,000 patients annually,
                        connecting them with vetted medical facilities across 40+ countries — all under
                        one trusted platform.
                    </p>
                    <div className={styles.missionChecks}>
                        {["ISO-certified partner hospitals", "Multilingual patient coordinators", "Transparent cost estimates", "24/7 emergency support"].map((item) => (
                            <div key={item} className={styles.checkItem}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                    <path d="M20 6L9 17l-5-5" stroke="#2a9d8f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Values ── */}
            <section className={styles.values}>
                <div className={styles.valueHeader}>
                    <span className={styles.sectionTag}>Our Values</span>
                    <h2 className={styles.sectionTitle}>What Drives Everything We Do</h2>
                </div>
                <div className={styles.valuesGrid}>
                    {values.map((v) => (
                        <div key={v.title} className={styles.valueCard}>
                            <div className={styles.valueIcon}>{v.icon}</div>
                            <h3 className={styles.valueTitle}>{v.title}</h3>
                            <p className={styles.valueDesc}>{v.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Team ── */}
            <section className={styles.team}>
                <div className={styles.valueHeader}>
                    <span className={styles.sectionTag}>Our Team</span>
                    <h2 className={styles.sectionTitle}>The People Behind TouRest</h2>
                </div>
                <div className={styles.teamGrid}>
                    {team.map((member) => (
                        <div key={member.name} className={styles.teamCard}>
                            <div className={styles.teamImg}>
                                <Image src={member.img} alt={member.name} fill sizes="280px" style={{ objectFit: "cover" }} />
                            </div>
                            <div className={styles.teamInfo}>
                                <h3 className={styles.teamName}>{member.name}</h3>
                                <p className={styles.teamRole}>{member.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA ── */}
            <section className={styles.cta}>
                <h2 className={styles.ctaTitle}>Ready to Start Your Medical Journey?</h2>
                <p className={styles.ctaDesc}>
                    Join thousands of patients who have trusted TouRest to guide them to the care they deserve.
                </p>
                <Link href="/tours" className={styles.ctaBtn}>Browse All Packages</Link>
            </section>

            <Footer />
        </main>
    );
}
