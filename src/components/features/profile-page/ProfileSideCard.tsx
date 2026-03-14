import Image from "next/image";
import styles from "./profile-page.module.scss";

export type InfoRow = { icon: string; content: React.ReactNode };

type Props = {
  avatar: string;
  name: string;
  type: string;
  avatarVariant?: "circle" | "rounded";
  accentVariant?: "teal" | "amber";
  infoRows: InfoRow[];
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
};

export default function ProfileSideCard({
  avatar,
  name,
  type,
  avatarVariant = "circle",
  accentVariant = "teal",
  infoRows,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: Props) {
  const avatarClass = avatarVariant === "rounded" ? styles.sideAvatarRounded : styles.sideAvatarCircle;
  const typeClass = accentVariant === "amber" ? styles.sideTypeAmber : styles.sideTypeTeal;

  return (
    <div className={styles.sideCard}>
      <div className={avatarClass}>
        <Image src={avatar} alt={name} fill style={{ objectFit: "cover" }} />
      </div>
      <h3 className={styles.sideTitle}>{name}</h3>
      <p className={typeClass}>{type}</p>

      <div className={styles.sideInfo}>
        {infoRows.map((row, i) => (
          <div key={i} className={styles.sideInfoRow}>
            <span>{row.icon}</span>
            <span>{row.content}</span>
          </div>
        ))}
      </div>

      <button className={styles.primaryBtn} onClick={onPrimary}>{primaryLabel}</button>
      <button className={styles.secondaryBtn} onClick={onSecondary}>{secondaryLabel}</button>
    </div>
  );
}
