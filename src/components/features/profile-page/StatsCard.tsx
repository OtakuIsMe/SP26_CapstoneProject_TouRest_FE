import styles from "./profile-page.module.scss";

export type Stat = { value: string | number; label: string };

type Props = {
  title?: string;
  stats: Stat[];
  accentVariant?: "teal" | "amber";
};

export default function StatsCard({ title = "Thống kê", stats, accentVariant = "teal" }: Props) {
  const valueClass = accentVariant === "amber" ? styles.statValueAmber : styles.statValueTeal;

  return (
    <div className={styles.statsCard}>
      <h4 className={styles.statsTitle}>{title}</h4>
      <div className={styles.statsList}>
        {stats.map((s) => (
          <div key={s.label} className={styles.statItem}>
            <span className={valueClass}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
