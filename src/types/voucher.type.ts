export type DiscountType = "Fixed" | "Percent";
export type VoucherApplicableType = "All" | "Service" | "Package";
export type VoucherStatus = "Active" | "Inactive" | "Expired";

export interface VoucherDTO {
    id: string;
    code: string;
    name: string;
    description?: string;
    discountType: DiscountType;
    discountValue: number;
    maxDiscountAmount?: number;
    minOrderAmount?: number;
    applicableType: VoucherApplicableType;
    applicableId?: string;
    usageLimit?: number;
    usedCount: number;
    validFrom: string;
    validTo: string;
    status: VoucherStatus;
    createdAt: string;
    updatedAt?: string;
}

export interface VoucherCreateRequest {
    code: string;
    name: string;
    description?: string;
    discountType: DiscountType;
    discountValue: number;
    maxDiscountAmount?: number;
    minOrderAmount?: number;
    applicableType: VoucherApplicableType;
    applicableId?: string;
    usageLimit?: number;
    validFrom: string;
    validTo: string;
    status: VoucherStatus;
}

export type VoucherUpdateRequest = VoucherCreateRequest;
