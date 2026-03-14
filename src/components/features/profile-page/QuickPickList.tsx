import Image from "next/image";
import styles from "./profile-page.module.scss";

export type QuickPickItem = {
  id: string;
  image: string;
  name: string;
  sub?: string;
  price: string;
};

type Props = {
  title: string;
  items: QuickPickItem[];
};

export default function QuickPickList({ title, items }: Props) {
  return (
    <div className={styles.quickPick}>
      <h4 className={styles.quickPickTitle}>{title}</h4>
      {items.map((item) => (
        <div key={item.id} className={styles.quickPickItem}>
          <div className={styles.quickPickImg}>
            <Image src={item.image} alt={item.name} fill style={{ objectFit: "cover" }} />
          </div>
          <div className={styles.quickPickInfo}>
            <p className={styles.quickPickName}>{item.name}</p>
            {item.sub && <p className={styles.quickPickSub}>{item.sub}</p>}
            <p className={styles.quickPickPrice}>{item.price}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
