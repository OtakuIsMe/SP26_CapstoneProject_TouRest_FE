export type LoginRequest = {
    email: string;
    password: string;
};

export type LoginResponse = {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export type RegisterRequest = {
    username: string;
    email: string;
    password: string;
    phoneNumber?: string;
};

export type RegisterResponse = {
    userId: string;
    message: string;
};

export type RefreshTokenResponse = {
    accessToken: string;
    expiresIn: number;
};