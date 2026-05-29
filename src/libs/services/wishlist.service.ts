import axiosClient from "../http/axios-client";

export enum WishlistItemType {
    Service   = "Service",
    Package   = "Package",
    Agency    = "Agency",
    Provider  = "Provider",
    Itinerary = "Itinerary",
}

export type WishListDTO = {
    id: string;
    userId: string;
    itemType: WishlistItemType;
    itemId: string;
    createdAt: string;
    updatedAt: string | null;
};

export const wishlistService = {
    check: (itemId: string): Promise<ApiResponse<{ isFavorited: boolean; wishlistId?: string }>> =>
        axiosClient.get("/wishlists/check", { params: { itemId } }),

    add: (itemType: WishlistItemType, itemId: string): Promise<ApiResponse<WishListDTO>> =>
        axiosClient.post("/wishlists/me", { itemType, itemId }),

    remove: (itemId: string): Promise<ApiResponse<void>> =>
        axiosClient.delete(`/wishlists/me/item/${itemId}`),

    getMyWishlist: (): Promise<ApiResponse<WishListDTO[]>> =>
        axiosClient.get("/wishlists/my"),
};
