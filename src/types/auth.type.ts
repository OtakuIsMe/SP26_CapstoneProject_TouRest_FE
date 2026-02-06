export type LoginRequest = {
    email: string;
    password: string;
};

export type LoginResponse = {
    accessToken: string;
    expiresIn: number;
}

export type RegisterRequest = {
    username: string;
    email: string;
    password: string;
    phone?: string;
};

export type RegisterResponse = {
    userId: string;
    message: string;
};

export type RefreshTokenResponse = {
    accessToken: string;
    expiresIn: number;
};