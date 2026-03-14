import Image from "next/image";
import Link from "next/link";
import styles from "./profile-page.module.scss";

export type MetaItem = {
  icon: string;
  content: React.ReactNode;
};

type Props = {
  coverImage: string;
  name: string;
  badge: string;
  badgeVariant?: "teal" | "amber";
  tagline: string;
  meta: MetaItem[];
  breadcrumbs: { label: string; href?: string }[];
};

export function StarRating({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className={styles.stars} style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ color: s <= Math.round(value) ? "#f59e0b" : "#d1d5db" }}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function ProfileHero({
  coverImage,
  name,
  badge,
  badgeVariant = "amber",
  tagline,
  meta,
  breadcrumbs,
}: Props) {
  return (
    <>
      <div className={styles.breadcrumb}>
        {breadcrumbs.map((b, i) => (
          <span key={i} style={{ display: "contents" }}>
            {i > 0 && <span>/</span>}
            {b.href ? <Link href={b.href}>{b.label}</Link> : <span>{b.label}</span>}
          </span>
        ))}
      </div>

      <section className={styles.hero}>
        <div className={styles.heroCover}>
          <Image src={coverImage} alt={name} fill style={{ objectFit: "cover" }} priority />
          <div className={styles.heroOverlay} />
        </div>

        <div className={styles.heroContent}>
          <div className={`${styles.heroBadge} ${badgeVariant === "teal" ? styles.teal : ""}`}>
            {badge}
          </div>
          <h1 className={styles.heroTitle}>{name}</h1>
          <p className={styles.heroTagline}>{tagline}</p>

          <div className={styles.heroMeta}>
            {meta.map((m, i) => (
              <span key={i} className={styles.metaItem}>
                <span>{m.icon}</span>
                {m.content}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
