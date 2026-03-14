import Image from "next/image";
import { StarRating } from "./ProfileHero";
import styles from "./profile-page.module.scss";

export type Review = {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  comment: string;
  tag: string;
};

type Props = {
  rating: number;
  reviewCount: number;
  reviews: Review[];
  tagVariant?: "teal" | "amber";
};

export default function ReviewsList({ rating, reviewCount, reviews, tagVariant = "teal" }: Props) {
  return (
    <>
      <div className={styles.reviewsHeader}>
        <span className={styles.ratingScore}>{rating}</span>
        <div>
          <StarRating value={rating} size={24} />
          <p className={styles.ratingCount}>{reviewCount} đánh giá từ du khách thực tế</p>
        </div>
      </div>

      <div className={styles.reviewsList}>
        {reviews.map((r) => (
          <div key={r.id} className={styles.reviewCard}>
            <div className={styles.reviewAuthor}>
              <div className={styles.reviewAvatar}>
                <Image src={r.avatar} alt={r.author} fill style={{ objectFit: "cover" }} />
              </div>
              <div>
                <p className={styles.reviewName}>{r.author}</p>
                <p className={styles.reviewDate}>{r.date}</p>
              </div>
              <div className={styles.reviewRatingWrap}>
                <StarRating value={r.rating} size={14} />
              </div>
            </div>
            <p className={styles.reviewText}>{r.comment}</p>
            <span className={`${styles.reviewTag} ${tagVariant === "amber" ? styles.reviewTagAmber : styles.reviewTagTeal}`}>
              {r.tag}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
