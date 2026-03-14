"use client";

import { useState } from "react";
import Image from "next/image";
import Header from "@/components/layouts/header/header";
import Footer from "@/components/layouts/footer/footer";
import ProfileHero, { StarRating } from "@/components/features/profile-page/ProfileHero";
import ProfileHighlights from "@/components/features/profile-page/ProfileHighlights";
import ProfileTabNav from "@/components/features/profile-page/ProfileTabNav";
import ProfileGallery from "@/components/features/profile-page/ProfileGallery";
import ReviewsList from "@/components/features/profile-page/ReviewsList";
import ProfileSideCard from "@/components/features/profile-page/ProfileSideCard";
import StatsCard from "@/components/features/profile-page/StatsCard";
import QuickPickList from "@/components/features/profile-page/QuickPickList";
import sharedStyles from "@/components/features/profile-page/profile-page.module.scss";
import styles from "./page.module.scss";

// ── Mock data ──────────────────────────────────────────────────────────────
const AGENCY = {
  id: "1",
  name: "Viet Horizon Travel",
  type: "Đại lý du lịch",
  tagline: "Khám phá Việt Nam theo cách của bạn",
  coverImage: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1600&q=80",
  avatar: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&q=80",
  rating: 4.7,
  reviewCount: 528,
  toursCount: 42,
  location: "18 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội",
  phone: "+84 24 3825 6789",
  email: "info@viethorizon.vn",
  website: "www.viethorizon.vn",
  openHours: "08:00 – 18:00 (T2–T7)",
  established: "2015",
  licenseNo: "DL-HN-2015-0178",
  description:
    "Viet Horizon Travel là đại lý du lịch chuyên tổ chức các tour khám phá Việt Nam từ Bắc vào Nam. Với hơn 9 năm kinh nghiệm, chúng tôi tự hào là đối tác tin cậy của hàng nghìn du khách trong và ngoài nước. Đội ngũ hướng dẫn viên giàu kinh nghiệm, am hiểu văn hóa địa phương sẽ mang đến cho bạn những trải nghiệm du lịch chân thực và đáng nhớ nhất.",
  highlights: [
    { icon: "🏆", label: "Top 10 đại lý uy tín" },
    { icon: "🗺️", label: "42 tour đa dạng" },
    { icon: "👨‍💼", label: "HDV chuyên nghiệp" },
    { icon: "🛡️", label: "Bảo hiểm toàn hành trình" },
  ],
  gallery: [
    "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80",
    "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&q=80",
    "https://images.unsplash.com/photo-1573270689103-d7a4e42b609a?w=800&q=80",
    "https://images.unsplash.com/photo-1540611025311-01df3cef54b5?w=800&q=80",
    "https://images.unsplash.com/photo-1555921015-5532091f6026?w=800&q=80",
    "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&q=80",
  ],
  services: [
    "Tour trong nước & quốc tế", "Vé máy bay & tàu hỏa",
    "Đặt khách sạn & resort", "Visa & hộ chiếu",
    "Bảo hiểm du lịch", "Xe đưa đón sân bay",
    "Hướng dẫn viên riêng", "Tour theo yêu cầu (Tailor-made)",
  ],
  guides: [
    { name: "Trần Quốc Bảo", role: "Hướng dẫn viên trưởng", avatar: "https://i.pravatar.cc/80?img=11", lang: "VI / EN / FR" },
    { name: "Nguyễn Thị Mai", role: "HDV miền Trung & Nam", avatar: "https://i.pravatar.cc/80?img=45", lang: "VI / EN / ZH" },
    { name: "Lê Văn Hùng", role: "HDV chuyên trek & leo núi", avatar: "https://i.pravatar.cc/80?img=22", lang: "VI / EN" },
  ],
};

const TOP_TOURS = [
  {
    id: "t1",
    name: "Hà Nội – Hạ Long – Ninh Bình",
    region: "Miền Bắc",
    description: "Hành trình khám phá trái tim Hà Nội, kỳ quan Hạ Long và vẻ đẹp hữu tình của Ninh Bình trong một chuyến đi trọn vẹn.",
    image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=500&q=80",
    price: 3800000,
    originalPrice: 4500000,
    duration: "4 ngày 3 đêm",
    bookedCount: 2140,
    rating: 4.9,
    maxGroup: 20,
    badge: "Bán chạy nhất",
    badgeColor: "#ef4444",
    departure: "Hằng ngày",
    includes: ["Xe đưa đón", "Khách sạn 4★", "Bữa ăn", "HDV", "Bảo hiểm"],
  },
  {
    id: "t2",
    name: "Đà Nẵng – Hội An – Huế",
    region: "Miền Trung",
    description: "Trải nghiệm di sản văn hóa thế giới Hội An và Huế, thưởng thức ẩm thực đặc sắc miền Trung, tắm biển Đà Nẵng.",
    image: "https://images.unsplash.com/photo-1555921015-5532091f6026?w=500&q=80",
    price: 4200000,
    originalPrice: 5000000,
    duration: "5 ngày 4 đêm",
    bookedCount: 1876,
    rating: 4.8,
    maxGroup: 18,
    badge: "Du khách yêu thích",
    badgeColor: "#f97316",
    departure: "T2, T4, T6, CN",
    includes: ["Vé máy bay", "Khách sạn 4★", "Bữa ăn", "HDV", "Bảo hiểm"],
  },
  {
    id: "t3",
    name: "Sài Gòn – Mekong – Phú Quốc",
    region: "Miền Nam",
    description: "Khám phá sức sống của Sài Gòn, lênh đênh trên sông Mekong và thư giãn tại thiên đường biển đảo Phú Quốc.",
    image: "https://images.unsplash.com/photo-1540611025311-01df3cef54b5?w=500&q=80",
    price: 5500000,
    originalPrice: 6200000,
    duration: "6 ngày 5 đêm",
    bookedCount: 1453,
    rating: 4.7,
    maxGroup: 15,
    badge: "Ưu đãi hè",
    badgeColor: "#2a9d8f",
    departure: "T3, T6",
    includes: ["Vé máy bay", "Resort 5★", "Bữa ăn", "HDV", "Bảo hiểm"],
  },
  {
    id: "t4",
    name: "Sapa – Fansipan – Bắc Hà",
    region: "Tây Bắc",
    description: "Chinh phục nóc nhà Đông Dương Fansipan, ngắm ruộng bậc thang Sa Pa và trải nghiệm phiên chợ văn hóa Bắc Hà.",
    image: "https://images.unsplash.com/photo-1573270689103-d7a4e42b609a?w=500&q=80",
    price: 3200000,
    originalPrice: 3800000,
    duration: "3 ngày 2 đêm",
    bookedCount: 987,
    rating: 4.6,
    maxGroup: 12,
    badge: "Phiêu lưu",
    badgeColor: "#7c3aed",
    departure: "T5, CN",
    includes: ["Tàu hỏa", "Homestay", "Bữa ăn", "HDV", "Cáp treo"],
  },
];

const REVIEWS = [
  {
    id: "r1",
    author: "Lê Thị Phương",
    avatar: "https://i.pravatar.cc/60?img=9",
    rating: 5,
    date: "Tháng 3, 2026",
    comment: "Tour Hạ Long tuyệt vời! Hướng dẫn viên Bảo rất nhiệt tình, am hiểu lịch sử và luôn chăm sóc đoàn chu đáo. Giá cả hợp lý, dịch vụ xứng tầm. Chắc chắn sẽ đặt tour tiếp với Viet Horizon.",
    tag: "Tour: Hà Nội – Hạ Long – Ninh Bình",
  },
  {
    id: "r2",
    author: "Nguyễn Văn Đức",
    avatar: "https://i.pravatar.cc/60?img=17",
    rating: 5,
    date: "Tháng 2, 2026",
    comment: "Đây là lần thứ ba gia đình mình đặt tour qua Viet Horizon. Lần nào cũng rất hài lòng. Tour miền Trung lần này đặc biệt ấn tượng với khách sạn đẹp và lịch trình hợp lý.",
    tag: "Tour: Đà Nẵng – Hội An – Huế",
  },
  {
    id: "r3",
    author: "Trần Minh Khôi",
    avatar: "https://i.pravatar.cc/60?img=33",
    rating: 4,
    date: "Tháng 1, 2026",
    comment: "Tour Sapa leo Fansipan thực sự thử thách nhưng cực kỳ đáng giá. HDV Hùng có kinh nghiệm leo núi tốt, đảm bảo an toàn cho cả đoàn.",
    tag: "Tour: Sapa – Fansipan – Bắc Hà",
  },
];

const TABS = [
  { key: "about", label: "Giới thiệu" },
  { key: "tours", label: "Tour nổi bật" },
  { key: "gallery", label: "Hình ảnh" },
  { key: "reviews", label: "Đánh giá" },
];

function formatPrice(p: number) {
  return p.toLocaleString("vi-VN") + "₫";
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function AgencyDetailPage() {
  const [activeTab, setActiveTab] = useState("about");

  return (
    <>
      <Header variant="solid" />

      <main className={sharedStyles.main}>
        <ProfileHero
          coverImage={AGENCY.coverImage}
          name={AGENCY.name}
          badge={AGENCY.type}
          badgeVariant="amber"
          tagline={AGENCY.tagline}
          breadcrumbs={[
            { label: "Trang chủ", href: "/" },
            { label: "Đại lý du lịch", href: "/agencies" },
            { label: AGENCY.name },
          ]}
          meta={[
            { icon: "📍", content: AGENCY.location },
            {
              icon: "",
              content: (
                <>
                  <StarRating value={AGENCY.rating} size={14} />
                  <b>{AGENCY.rating}</b>
                  <span>({AGENCY.reviewCount} đánh giá)</span>
                </>
              ),
            },
            { icon: "🗺️", content: <><b>{AGENCY.toursCount}</b> tour đang hoạt động</> },
            { icon: "🕐", content: AGENCY.openHours },
          ]}
        />

        <div className={sharedStyles.layout}>
          {/* ── LEFT ── */}
          <div>
            <ProfileHighlights items={AGENCY.highlights} />
            <ProfileTabNav tabs={TABS} active={activeTab} accent="amber" onChange={setActiveTab} />

            {/* About */}
            {activeTab === "about" && (
              <div className={sharedStyles.tabContent}>
                <h2 className={sharedStyles.sectionTitle}>Về {AGENCY.name}</h2>
                <p className={styles.description}>{AGENCY.description}</p>

                <h3 className={styles.subTitle}>Dịch vụ cung cấp</h3>
                <div className={styles.servicesGrid}>
                  {AGENCY.services.map((s) => (
                    <div key={s} className={styles.serviceChip}>
                      <span className={styles.checkIcon}>✓</span>
                      {s}
                    </div>
                  ))}
                </div>

                <h3 className={styles.subTitle}>Hướng dẫn viên tiêu biểu</h3>
                <div className={styles.guidesGrid}>
                  {AGENCY.guides.map((g) => (
                    <div key={g.name} className={styles.guideCard}>
                      <div className={styles.guideAvatar}>
                        <Image src={g.avatar} alt={g.name} fill style={{ objectFit: "cover" }} />
                      </div>
                      <div>
                        <p className={styles.guideName}>{g.name}</p>
                        <p className={styles.guideRole}>{g.role}</p>
                        <p className={styles.guideLang}>🌐 {g.lang}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tours */}
            {activeTab === "tours" && (
              <div className={sharedStyles.tabContent}>
                <h2 className={sharedStyles.sectionTitle}>Tour được đặt nhiều nhất</h2>
                <p className={sharedStyles.sectionSub}>
                  {AGENCY.toursCount} tour đang hoạt động · Dưới đây là những hành trình được du khách lựa chọn nhiều nhất
                </p>

                <div className={styles.toursList}>
                  {TOP_TOURS.map((tour, idx) => (
                    <div key={tour.id} className={styles.tourCard}>
                      <div className={styles.tourImageWrap}>
                        <Image src={tour.image} alt={tour.name} fill style={{ objectFit: "cover" }} />
                        <span className={styles.tourBadge} style={{ background: tour.badgeColor }}>
                          {tour.badge}
                        </span>
                        <span className={styles.tourRank}>#{idx + 1}</span>
                      </div>

                      <div className={styles.tourBody}>
                        <div className={styles.tourHeader}>
                          <span className={styles.tourRegion}>{tour.region}</span>
                          <div className={styles.tourRating}>
                            <StarRating value={tour.rating} size={13} />
                            <span>{tour.rating}</span>
                          </div>
                        </div>

                        <h3 className={styles.tourName}>{tour.name}</h3>
                        <p className={styles.tourDesc}>{tour.description}</p>

                        <div className={styles.includesTags}>
                          {tour.includes.map((inc) => (
                            <span key={inc} className={styles.includeTag}>{inc}</span>
                          ))}
                        </div>

                        <div className={styles.tourMeta}>
                          <span>⏱ {tour.duration}</span>
                          <span>📅 {tour.departure}</span>
                          <span>👥 Tối đa {tour.maxGroup} người</span>
                          <span>🔥 {tour.bookedCount.toLocaleString()} lượt đặt</span>
                        </div>

                        <div className={styles.tourFooter}>
                          <div className={styles.tourPrice}>
                            <div className={styles.priceRow}>
                              <span className={styles.priceOriginal}>{formatPrice(tour.originalPrice)}</span>
                              <span className={styles.discountBadge}>
                                -{Math.round(((tour.originalPrice - tour.price) / tour.originalPrice) * 100)}%
                              </span>
                            </div>
                            <div className={styles.priceCurrent}>
                              <span className={styles.priceFrom}>Từ</span>
                              <span className={styles.priceValue}>{formatPrice(tour.price)}</span>
                              <span className={styles.pricePer}>/người</span>
                            </div>
                          </div>
                          <div className={styles.tourActions}>
                            <button className={styles.detailBtn}>Chi tiết</button>
                            <button className={styles.bookBtn}>Đặt ngay</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery */}
            {activeTab === "gallery" && (
              <div className={sharedStyles.tabContent}>
                <ProfileGallery images={AGENCY.gallery} title="Hình ảnh từ các tour" />
              </div>
            )}

            {/* Reviews */}
            {activeTab === "reviews" && (
              <div className={sharedStyles.tabContent}>
                <ReviewsList
                  rating={AGENCY.rating}
                  reviewCount={AGENCY.reviewCount}
                  reviews={REVIEWS}
                  tagVariant="amber"
                />
              </div>
            )}
          </div>

          {/* ── SIDEBAR ── */}
          <aside className={sharedStyles.sidebar}>
            <ProfileSideCard
              avatar={AGENCY.avatar}
              name={AGENCY.name}
              type={AGENCY.type}
              avatarVariant="rounded"
              accentVariant="amber"
              infoRows={[
                { icon: "📍", content: AGENCY.location },
                { icon: "📞", content: <a href={`tel:${AGENCY.phone}`}>{AGENCY.phone}</a> },
                { icon: "✉️", content: <a href={`mailto:${AGENCY.email}`}>{AGENCY.email}</a> },
                { icon: "🌐", content: AGENCY.website },
                { icon: "🕐", content: AGENCY.openHours },
                { icon: "📋", content: `GPLH: ${AGENCY.licenseNo}` },
              ]}
              primaryLabel="Liên hệ tư vấn"
              secondaryLabel="Xem tất cả tour"
            />

            <StatsCard
              accentVariant="amber"
              stats={[
                { value: AGENCY.rating, label: "Điểm TB" },
                { value: AGENCY.toursCount, label: "Số tour" },
                { value: `${AGENCY.reviewCount}+`, label: "Đánh giá" },
                { value: `${new Date().getFullYear() - parseInt(AGENCY.established)}+`, label: "Năm KN" },
              ]}
            />

            <QuickPickList
              title="🔥 Tour đặt nhiều nhất"
              items={TOP_TOURS.slice(0, 3).map((t) => ({
                id: t.id,
                image: t.image,
                name: t.name,
                sub: t.duration,
                price: `${formatPrice(t.price)}/người`,
              }))}
            />
          </aside>
        </div>
      </main>

      <Footer />
    </>
  );
}
