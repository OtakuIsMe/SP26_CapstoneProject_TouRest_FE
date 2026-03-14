"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./profile-page.module.scss";

type Props = {
  images: string[];
  title?: string;
};

export default function ProfileGallery({ images, title = "Hình ảnh" }: Props) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setIndex((i) => (i + 1) % images.length);

  return (
    <>
      <h2 className={styles.sectionTitle}>{title}</h2>

      <div className={styles.galleryGrid}>
        {images.map((img, i) => (
          <button
            key={i}
            className={styles.galleryThumb}
            onClick={() => { setIndex(i); setOpen(true); }}
          >
            <Image src={img} alt={`Ảnh ${i + 1}`} fill style={{ objectFit: "cover" }} />
            <div className={styles.galleryOverlay}><span>🔍</span></div>
          </button>
        ))}
      </div>

      {open && (
        <div className={styles.lightbox} onClick={() => setOpen(false)}>
          <button className={styles.lbClose} onClick={() => setOpen(false)}>✕</button>
          <button className={styles.lbPrev} onClick={(e) => { e.stopPropagation(); prev(); }}>‹</button>
          <div className={styles.lbImageWrap} onClick={(e) => e.stopPropagation()}>
            <Image src={images[index]} alt={`Ảnh ${index + 1}`} fill style={{ objectFit: "contain" }} />
          </div>
          <button className={styles.lbNext} onClick={(e) => { e.stopPropagation(); next(); }}>›</button>
          <p className={styles.lbCounter}>{index + 1} / {images.length}</p>
        </div>
      )}
    </>
  );
}
