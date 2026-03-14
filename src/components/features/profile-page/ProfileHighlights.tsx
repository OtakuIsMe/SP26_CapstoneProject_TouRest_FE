import styles from "./profile-page.module.scss";

type Highlight = { icon: string; label: string };

type Props = { items: Highlight[] };

export default function ProfileHighlights({ items }: Props) {
  return (
    <div className={styles.highlights}>
      {items.map((h) => (
        <div key={h.label} className={styles.highlightItem}>
          <span className={styles.highlightIcon}>{h.icon}</span>
          <span>{h.label}</span>
        </div>
      ))}
    </div>
  );
}
