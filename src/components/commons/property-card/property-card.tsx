"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./property-card.module.scss";

interface PropertyCardProps {
    id?: string | number;
    image?: string;
    type?: string;
    name: string;
    duration?: number;
    stopCount?: number;
    rating?: number;
    reviews?: number;
    price: number;
    priceUnit?: string;
    description?: string;
}

export default function PropertyCard({
    id,
    image,
    type,
    name,
    duration,
    stopCount,
    rating,
    reviews,
    price,
    priceUnit = "/tour",
    description,
}: PropertyCardProps) {
    const [liked, setLiked] = useState(false);
    const hasImage = !!image;

    return (
        <Link href={id ? `/tours/${id}` : "/tours"} className={styles.card}>
            <div className={styles.imageWrapper}>
                {hasImage ? (
                    <Image src={image} alt={name} fill sizes="320px" style={{ objectFit: "cover" }} />
                ) : (
                    <div className={styles.imageSkeleton} />
                )}
            </div>
            <div className={styles.content}>
                <div className={styles.topRow}>
                    <span className={styles.type}>{type ?? "Tour Package"}</span>
                    <button
                        className={`${styles.heart} ${liked ? styles.heartActive : ""}`}
                        onClick={(e) => { e.preventDefault(); setLiked(!liked); }}
                        type="button"
                        aria-label="Save"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} xmlns="http://www.w3.org/2000/svg">
                            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                <h3 className={styles.name}>{name}</h3>

                {(duration || stopCount) && (
                    <div className={styles.tags}>
                        {duration && (
                            <span className={styles.tag}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                </svg>
                                {duration} {duration === 1 ? "day" : "days"}
                            </span>
                        )}
                        {stopCount != null && stopCount > 0 && (
                            <span className={styles.tag}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" fill="currentColor" />
                                </svg>
                                {stopCount} {stopCount === 1 ? "stop" : "stops"}
                            </span>
                        )}
                    </div>
                )}

                {description && (
                    <p className={styles.amenities}>{description}</p>
                )}

                <div className={styles.bottomRow}>
                    <div className={styles.rating}>
                        {rating && rating > 0 ? (
                            <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#f59e0b" />
                                </svg>
                                <span className={styles.ratingScore}>{rating}</span>
                                {reviews && reviews > 0 && (
                                    <>
                                        <span className={styles.ratingDot}>·</span>
                                        <span className={styles.reviewCount}>{reviews.toLocaleString()} reviews</span>
                                    </>
                                )}
                            </>
                        ) : (
                            <span className={styles.noRating}>No reviews yet</span>
                        )}
                    </div>
                    <div className={styles.price}>
                        <span className={styles.priceAmount}>{price.toLocaleString("vi-VN")}đ</span>
                        <span className={styles.priceUnit}>{priceUnit}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
