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
const PROVIDER = {
  id: "1",
  name: "Trạm Y Tế & Nghỉ Dưỡng Sapa Highland",
  type: "Trạm Y Tế Du Lịch",
  tagline: "Chăm sóc sức khỏe toàn diện giữa lòng thiên nhiên",
  coverImage: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600&q=80",
  avatar: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=200&q=80",
  rating: 4.8,
  reviewCount: 312,
  location: "Thị trấn Sa Pa, Lào Cai, Việt Nam",
  phone: "+84 214 387 1234",
  email: "contact@sapahighland-medical.vn",
  openHours: "07:00 – 22:00 (T2–CN)",
  established: "2018",
  licenseNo: "YT-LC-2018-0042",
  description:
    "Trạm Y Tế & Nghỉ Dưỡng Sapa Highland được thành lập với sứ mệnh cung cấp dịch vụ y tế và chăm sóc sức khỏe chất lượng cao cho du khách và cư dân địa phương. Nằm ở độ cao 1.500m, chúng tôi kết hợp y học hiện đại với liệu pháp thiên nhiên truyền thống, mang đến trải nghiệm phục hồi toàn diện giữa không khí trong lành của núi rừng Tây Bắc.",
  highlights: [
    { icon: "🏥", label: "Đội ngũ y bác sĩ chuyên nghiệp" },
    { icon: "🌿", label: "Liệu pháp thảo dược tự nhiên" },
    { icon: "🚑", label: "Cấp cứu 24/7" },
    { icon: "🏨", label: "Phòng nghỉ cao cấp" },
  ],
  gallery: [
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80",
    "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&q=80",
    "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80",
    "https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800&q=80",
    "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&q=80",
    "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=800&q=80",
  ],
  facilities: [
    "Phòng khám đa khoa", "Phòng vật lý trị liệu",
    "Spa & Massage thư giãn", "Phòng xét nghiệm cơ bản",
    "Nhà thuốc đầy đủ", "Phòng nghỉ đơn & đôi",
    "Khu vực thiền định ngoài trời", "Nhà bếp dinh dưỡng",
    "Wifi miễn phí", "Bãi đỗ xe",
  ],
  staff: [
    { name: "BS. Nguyễn Minh Tuấn", role: "Bác sĩ trưởng", avatar: "https://i.pravatar.cc/80?img=12" },
    { name: "Điều dưỡng Lê Thị Hoa", role: "Trưởng nhóm điều dưỡng", avatar: "https://i.pravatar.cc/80?img=47" },
    { name: "KTV. Phạm Văn An", role: "Kỹ thuật viên phục hồi", avatar: "https://i.pravatar.cc/80?img=33" },
  ],
};

const TOP_SERVICES = [
  {
    id: "s1",
    name: "Gói Khám Sức Khỏe Tổng Quát",
    category: "Khám chữa bệnh",
    description: "Kiểm tra toàn diện các chỉ số sức khỏe, đo huyết áp, đường huyết, xét nghiệm máu cơ bản và tư vấn dinh dưỡng.",
    image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&q=80",
    price: 350000,
    duration: "90 phút",
    bookedCount: 1240,
    rating: 4.9,
    badge: "Phổ biến nhất",
    badgeColor: "#ef4444",
  },
  {
    id: "s2",
    name: "Liệu Pháp Massage Thảo Dược",
    category: "Spa & Thư giãn",
    description: "Massage toàn thân kết hợp tinh dầu thảo dược địa phương, giúp thư giãn cơ bắp sau các chuyến leo núi dài.",
    image: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=400&q=80",
    price: 480000,
    duration: "60 phút",
    bookedCount: 987,
    rating: 4.8,
    badge: "Được yêu thích",
    badgeColor: "#f97316",
  },
  {
    id: "s3",
    name: "Phục Hồi Chức Năng Cơ Xương Khớp",
    category: "Vật lý trị liệu",
    description: "Chương trình phục hồi chuyên biệt cho các chấn thương nhẹ, đau lưng, đau khớp với thiết bị hiện đại.",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80",
    price: 650000,
    duration: "120 phút",
    bookedCount: 734,
    rating: 4.7,
    badge: "Chuyên gia khuyên dùng",
    badgeColor: "#2a9d8f",
  },
  {
    id: "s4",
    name: "Nghỉ Dưỡng Phục Hồi 2 Ngày 1 Đêm",
    category: "Gói nghỉ dưỡng",
    description: "Gói nghỉ dưỡng trọn gói bao gồm phòng nghỉ, 3 bữa ăn dinh dưỡng, 1 buổi khám, 1 buổi spa và tham quan.",
    image: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=400&q=80",
    price: 2200000,
    duration: "2 ngày 1 đêm",
    bookedCount: 521,
    rating: 4.9,
    badge: "Giá trị tốt nhất",
    badgeColor: "#7c3aed",
  },
];

const REVIEWS = [
  {
    id: "r1",
    author: "Trần Thị Lan",
    avatar: "https://i.pravatar.cc/60?img=5",
    rating: 5,
    date: "Tháng 2, 2026",
    comment: "Dịch vụ tuyệt vời! Sau chuyến leo núi Fansipan mệt mỏi, chúng tôi ghé vào đây và được chăm sóc rất chu đáo. Đội ngũ bác sĩ nhiệt tình, cơ sở vật chất sạch sẽ và hiện đại.",
    tag: "Dịch vụ: Gói Khám Sức Khỏe Tổng Quát",
  },
  {
    id: "r2",
    author: "Nguyễn Hoàng Nam",
    avatar: "https://i.pravatar.cc/60?img=15",
    rating: 5,
    date: "Tháng 1, 2026",
    comment: "Gói nghỉ dưỡng 2 ngày 1 đêm hoàn toàn xứng đáng với mức giá. Phòng nghỉ thoáng đãng, đồ ăn ngon và lành mạnh.",
    tag: "Dịch vụ: Nghỉ Dưỡng Phục Hồi 2N1Đ",
  },
  {
    id: "r3",
    author: "Phạm Minh Châu",
    avatar: "https://i.pravatar.cc/60?img=29",
    rating: 4,
    date: "Tháng 12, 2025",
    comment: "Vật lý trị liệu rất hiệu quả, đau lưng của tôi giảm hẳn sau 2 buổi. Kỹ thuật viên chuyên nghiệp và giải thích kỹ càng từng bài tập.",
    tag: "Dịch vụ: Phục Hồi Chức Năng",
  },
];

const TABS = [
  { key: "about", label: "Giới thiệu" },
  { key: "services", label: "Dịch vụ nổi bật" },
  { key: "gallery", label: "Hình ảnh" },
  { key: "reviews", label: "Đánh giá" },
];

function formatPrice(p: number) {
  return p.toLocaleString("vi-VN") + "₫";
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function ProviderDetailPage() {
  const [activeTab, setActiveTab] = useState("about");

  return (
    <>
      <Header variant="solid" />

      <main className={sharedStyles.main}>
        <ProfileHero
          coverImage={PROVIDER.coverImage}
          name={PROVIDER.name}
          badge={PROVIDER.type}
          badgeVariant="teal"
          tagline={PROVIDER.tagline}
          breadcrumbs={[
            { label: "Trang chủ", href: "/" },
            { label: "Nhà cung cấp", href: "/providers" },
            { label: PROVIDER.name },
          ]}
          meta={[
            { icon: "📍", content: PROVIDER.location },
            {
              icon: "",
              content: (
                <>
                  <StarRating value={PROVIDER.rating} size={14} />
                  <b>{PROVIDER.rating}</b>
                  <span>({PROVIDER.reviewCount} đánh giá)</span>
                </>
              ),
            },
            { icon: "🕐", content: PROVIDER.openHours },
          ]}
        />

        <div className={sharedStyles.layout}>
          {/* ── LEFT ── */}
          <div>
            <ProfileHighlights items={PROVIDER.highlights} />
            <ProfileTabNav tabs={TABS} active={activeTab} accent="teal" onChange={setActiveTab} />

            {/* About */}
            {activeTab === "about" && (
              <div className={sharedStyles.tabContent}>
                <h2 className={sharedStyles.sectionTitle}>Về chúng tôi</h2>
                <p className={styles.description}>{PROVIDER.description}</p>

                <h3 className={styles.subTitle}>Cơ sở vật chất</h3>
                <div className={styles.facilitiesGrid}>
                  {PROVIDER.facilities.map((f) => (
                    <div key={f} className={styles.facilityItem}>
                      <span className={styles.checkIcon}>✓</span>
                      {f}
                    </div>
                  ))}
                </div>

                <h3 className={styles.subTitle}>Đội ngũ chuyên gia</h3>
                <div className={styles.staffGrid}>
                  {PROVIDER.staff.map((s) => (
                    <div key={s.name} className={styles.staffCard}>
                      <div className={styles.staffAvatar}>
                        <Image src={s.avatar} alt={s.name} fill style={{ objectFit: "cover" }} />
                      </div>
                      <div>
                        <p className={styles.staffName}>{s.name}</p>
                        <p className={styles.staffRole}>{s.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Services */}
            {activeTab === "services" && (
              <div className={sharedStyles.tabContent}>
                <h2 className={sharedStyles.sectionTitle}>Dịch vụ được đặt nhiều nhất</h2>
                <p className={sharedStyles.sectionSub}>
                  Những dịch vụ được du khách tin chọn và đánh giá cao nhất tại {PROVIDER.name}
                </p>

                <div className={styles.servicesList}>
                  {TOP_SERVICES.map((svc, idx) => (
                    <div key={svc.id} className={styles.serviceCard}>
                      <div className={styles.serviceRank}>#{idx + 1}</div>

                      <div className={styles.serviceImage}>
                        <Image src={svc.image} alt={svc.name} fill style={{ objectFit: "cover" }} />
                        <span className={styles.serviceBadge} style={{ background: svc.badgeColor }}>
                          {svc.badge}
                        </span>
                      </div>

                      <div className={styles.serviceBody}>
                        <div className={styles.serviceHeader}>
                          <span className={styles.serviceCategory}>{svc.category}</span>
                          <div className={styles.serviceRating}>
                            <StarRating value={svc.rating} size={13} />
                            <span>{svc.rating}</span>
                          </div>
                        </div>
                        <h3 className={styles.serviceName}>{svc.name}</h3>
                        <p className={styles.serviceDesc}>{svc.description}</p>
                        <div className={styles.serviceMeta}>
                          <span>⏱ {svc.duration}</span>
                          <span>🔥 {svc.bookedCount.toLocaleString()} lượt đặt</span>
                        </div>
                        <div className={styles.serviceFooter}>
                          <div className={styles.servicePrice}>
                            <span className={styles.priceLabel}>Từ</span>
                            <span className={styles.priceValue}>{formatPrice(svc.price)}</span>
                          </div>
                          <button className={styles.bookBtn}>Đặt ngay</button>
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
                <ProfileGallery images={PROVIDER.gallery} title="Hình ảnh thực tế" />
              </div>
            )}

            {/* Reviews */}
            {activeTab === "reviews" && (
              <div className={sharedStyles.tabContent}>
                <ReviewsList
                  rating={PROVIDER.rating}
                  reviewCount={PROVIDER.reviewCount}
                  reviews={REVIEWS}
                  tagVariant="teal"
                />
              </div>
            )}
          </div>

          {/* ── SIDEBAR ── */}
          <aside className={sharedStyles.sidebar}>
            <ProfileSideCard
              avatar={PROVIDER.avatar}
              name={PROVIDER.name}
              type={PROVIDER.type}
              avatarVariant="circle"
              accentVariant="teal"
              infoRows={[
                { icon: "📍", content: PROVIDER.location },
                { icon: "📞", content: <a href={`tel:${PROVIDER.phone}`}>{PROVIDER.phone}</a> },
                { icon: "✉️", content: <a href={`mailto:${PROVIDER.email}`}>{PROVIDER.email}</a> },
                { icon: "🕐", content: PROVIDER.openHours },
                { icon: "📋", content: `Giấy phép: ${PROVIDER.licenseNo}` },
              ]}
              primaryLabel="Liên hệ ngay"
              secondaryLabel="Xem tất cả dịch vụ"
            />

            <StatsCard
              accentVariant="teal"
              stats={[
                { value: PROVIDER.rating, label: "Điểm đánh giá" },
                { value: `${PROVIDER.reviewCount}+`, label: "Lượt đánh giá" },
                { value: PROVIDER.established, label: "Thành lập" },
                { value: "24/7", label: "Hỗ trợ" },
              ]}
            />

            <QuickPickList
              title="🔥 Dịch vụ đặt nhiều nhất"
              items={TOP_SERVICES.slice(0, 3).map((s) => ({
                id: s.id,
                image: s.image,
                name: s.name,
                price: formatPrice(s.price),
              }))}
            />
          </aside>
        </div>
      </main>

      <Footer />
    </>
  );
}
