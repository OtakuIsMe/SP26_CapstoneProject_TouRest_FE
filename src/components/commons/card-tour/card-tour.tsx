import Image from "next/image";
import styles from "./card-tour.module.scss";

interface CardTourProps {
    image: string;
    name: string;
    location: string;
    rating: number;
    reviews: number;
    price: number;
    originalPrice?: number;
}

export default function CardTour({
    image,
    name,
    location,
    rating,
    reviews,
    price,
    originalPrice,
}: CardTourProps) {
    return (
        <div className={styles.card}>
            <div className={styles.imageWrapper}>
                <Image src={image} alt={name} fill sizes="280px" style={{ objectFit: "cover" }} />
            </div>
            <div className={styles.content}>
                <h3 className={styles.name}>{name}</h3>
                <div className={styles.location}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
                            fill="currentColor"
                        />
                    </svg>
                    {location}
                </div>
                <div className={styles.rating}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                            fill="currentColor"
                        />
                    </svg>
                    {rating} ({reviews.toLocaleString()} Reviews)
                </div>
                <div className={styles.priceRow}>
                    <span className={styles.price}>${price}</span>
                    {originalPrice && (
                        <span className={styles.originalPrice}>${originalPrice}</span>
                    )}
                </div>
                <p className={styles.taxNote}>Includes taxes & fees</p>
            </div>
        </div>
    );
}
