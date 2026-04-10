export type UserDTO = {
    id: string;
    username: string;
    email: string;
    phone?: string;
    fullName?: string;
    role: string;
    status: string;
    createdAt: string;
    dateOfBirth?: string;
    cityId?: string;
    districtId?: string;
    addressDetail?: string;
};

export type UpdateProfileRequest = {
    username?: string;
    fullName?: string;
    phone?: string;
    imageUrl?: string;
    dateOfBirth?: string; // ISO 8601
    addressDetail?: string;
    cityId?: string;
    districtId?: string;
};

export type UserQuery = {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: string;
    status?: string;
};
