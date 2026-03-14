import styles from "./profile-page.module.scss";

type Tab = { key: string; label: string };

type Props = {
  tabs: Tab[];
  active: string;
  accent?: "teal" | "amber";
  onChange: (key: string) => void;
};

export default function ProfileTabNav({ tabs, active, accent = "teal", onChange }: Props) {
  return (
    <div className={styles.tabs}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`${styles.tabBtn} ${active === tab.key ? styles.tabActive : ""} ${
            active === tab.key && accent === "amber" ? styles.amber : ""
          }`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
