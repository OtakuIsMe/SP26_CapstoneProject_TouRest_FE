export type District = { id: string; name: string };
export type Province = { id: string; name: string; districts: District[] };

export const PROVINCES: Province[] = [
    { id: "HN", name: "Hà Nội", districts: [
        { id: "HN-HK", name: "Hoàn Kiếm" }, { id: "HN-DDA", name: "Đống Đa" },
        { id: "HN-HBT", name: "Hai Bà Trưng" }, { id: "HN-BA", name: "Ba Đình" },
        { id: "HN-CG", name: "Cầu Giấy" }, { id: "HN-TH", name: "Thanh Xuân" },
        { id: "HN-HM", name: "Hoàng Mai" }, { id: "HN-LB", name: "Long Biên" },
        { id: "HN-NTL", name: "Nam Từ Liêm" }, { id: "HN-BTL", name: "Bắc Từ Liêm" },
    ]},
    { id: "HCM", name: "TP. Hồ Chí Minh", districts: [
        { id: "HCM-Q1", name: "Quận 1" }, { id: "HCM-Q3", name: "Quận 3" },
        { id: "HCM-Q4", name: "Quận 4" }, { id: "HCM-Q5", name: "Quận 5" },
        { id: "HCM-Q6", name: "Quận 6" }, { id: "HCM-Q7", name: "Quận 7" },
        { id: "HCM-Q8", name: "Quận 8" }, { id: "HCM-Q10", name: "Quận 10" },
        { id: "HCM-Q11", name: "Quận 11" }, { id: "HCM-Q12", name: "Quận 12" },
        { id: "HCM-BT", name: "Bình Thạnh" }, { id: "HCM-TB", name: "Tân Bình" },
        { id: "HCM-TP", name: "Tân Phú" }, { id: "HCM-PN", name: "Phú Nhuận" },
        { id: "HCM-GV", name: "Gò Vấp" }, { id: "HCM-BC", name: "Bình Chánh" },
    ]},
    { id: "DN", name: "Đà Nẵng", districts: [
        { id: "DN-HC", name: "Hải Châu" }, { id: "DN-KH", name: "Khê Hải" },
        { id: "DN-LCT", name: "Liên Chiểu" }, { id: "DN-NHN", name: "Ngũ Hành Sơn" },
        { id: "DN-ST", name: "Sơn Trà" }, { id: "DN-TK", name: "Thanh Khê" },
        { id: "DN-CH", name: "Cẩm Lệ" },
    ]},
    { id: "CT", name: "Cần Thơ", districts: [
        { id: "CT-NK", name: "Ninh Kiều" }, { id: "CT-BT", name: "Bình Thủy" },
        { id: "CT-CR", name: "Cái Răng" }, { id: "CT-OC", name: "Ô Môn" },
        { id: "CT-TN", name: "Thốt Nốt" },
    ]},
    { id: "HP", name: "Hải Phòng", districts: [
        { id: "HP-HB", name: "Hồng Bàng" }, { id: "HP-KA", name: "Kiến An" },
        { id: "HP-LB", name: "Lê Chân" }, { id: "HP-NC", name: "Ngô Quyền" },
        { id: "HP-DH", name: "Đồ Sơn" },
    ]},
    { id: "BD", name: "Bình Dương", districts: [
        { id: "BD-TDA", name: "Thủ Dầu Một" }, { id: "BD-DA", name: "Dĩ An" },
        { id: "BD-TU", name: "Thuận An" }, { id: "BD-BK", name: "Bến Cát" },
    ]},
    { id: "BH", name: "Đồng Nai", districts: [
        { id: "BH-BH", name: "Biên Hòa" }, { id: "BH-LC", name: "Long Khánh" },
        { id: "BH-XL", name: "Xuân Lộc" },
    ]},
    { id: "KH", name: "Khánh Hòa", districts: [
        { id: "KH-NT", name: "Nha Trang" }, { id: "KH-CS", name: "Cam Ranh" },
        { id: "KH-NH", name: "Ninh Hòa" },
    ]},
    { id: "LA", name: "Lâm Đồng", districts: [
        { id: "LA-DL", name: "Đà Lạt" }, { id: "LA-BT", name: "Bảo Lộc" },
    ]},
    { id: "QN", name: "Quảng Nam", districts: [
        { id: "QN-HP", name: "Hội An" }, { id: "QN-TK", name: "Tam Kỳ" },
    ]},
];

export function getProvinceName(cityId?: string | null): string {
    if (!cityId) return "";
    return PROVINCES.find(p => p.id === cityId)?.name ?? cityId;
}

export function getDistrictName(cityId?: string | null, districtId?: string | null): string {
    if (!cityId || !districtId) return "";
    const province = PROVINCES.find(p => p.id === cityId);
    return province?.districts.find(d => d.id === districtId)?.name ?? districtId;
}
