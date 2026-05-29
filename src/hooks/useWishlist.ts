"use client";

import { useState, useEffect } from "react";
import { StorageKeys } from "@/constants/storage";
import { wishlistService, WishlistItemType } from "@/libs/services/wishlist.service";

export function useWishlist(
    itemId: string | number | undefined,
    itemType: WishlistItemType = WishlistItemType.Itinerary,
    { checkOnMount = false }: { checkOnMount?: boolean } = {},
) {
    const [liked, setLiked]     = useState(false);
    const [loading, setLoading] = useState(false);
    const id = itemId?.toString();

    useEffect(() => {
        if (!id || !checkOnMount) return;
        const token = localStorage.getItem(StorageKeys.ACCESS_TOKEN);
        if (!token) return;
        wishlistService.check(id)
            .then(res => { if (res?.data?.isFavorited != null) setLiked(res.data.isFavorited); })
            .catch(() => {});
    }, [id, checkOnMount]);

    async function toggle(e?: React.MouseEvent) {
        e?.preventDefault();
        e?.stopPropagation();
        if (!id) return;

        const token = localStorage.getItem(StorageKeys.ACCESS_TOKEN);
        if (!token) {
            window.location.href = `/signin?redirect=${encodeURIComponent(window.location.pathname)}`;
            return;
        }

        const next = !liked;
        setLiked(next);
        setLoading(true);
        try {
            if (next) {
                await wishlistService.add(itemType, id);
            } else {
                await wishlistService.remove(id);
            }
        } catch {
            setLiked(!next);
        } finally {
            setLoading(false);
        }
    }

    return { liked, loading, toggle };
}
