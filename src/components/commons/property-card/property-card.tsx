"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./property-card.module.scss";

interface PropertyCardProps {
    image: string;
    type: string;
    name: string;
    guests: number;
    homeType: string;
    beds: number;
    baths: number;
    amenities: string[];
    rating: number;
    reviews: number;
    price: number;
    priceUnit?: string;
}

export default function PropertyCard({
    image,
    type,
    name,
    guests,
    homeType,
    beds,
    baths,
    amenities,
    rating,
    reviews,
    price,
    priceUnit = "/night",
}: PropertyCardProps) {
    const [liked, setLiked] = useState(false);

    return (
        <div className={styles.card}>
            <div className={styles.imageWrapper}>
                <Image src={image} alt={name} fill sizes="320px" style={{ objectFit: "cover" }} />
            </div>
            <div className={styles.content}>
                <div className={styles.topRow}>
                    <span className={styles.type}>{type}</span>
                    <button
                        className={`${styles.heart} ${liked ? styles.heartActive : ""}`}
                        onClick={() => setLiked(!liked)}
                        type="button"
                        aria-label="Save"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} xmlns="http://www.w3.org/2000/svg">
                            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
                <h3 className={styles.name}>{name}</h3>
                <p className={styles.details}>
                    {guests} guests · {homeType} · {beds} beds · {baths} bath
                </p>
                <p className={styles.amenities}>
                    {amenities.join(" · ")}
                </p>
                <div className={styles.bottomRow}>
                    <div className={styles.rating}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#f59e0b" />
                        </svg>
                        <span className={styles.ratingScore}>{rating}</span>
                        <span className={styles.ratingDot}>·</span>
                        <span className={styles.reviewCount}>{reviews} reviews</span>
                    </div>
                    <div className={styles.price}>
                        <span className={styles.priceAmount}>${price}</span>
                        <span className={styles.priceUnit}>{priceUnit}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
