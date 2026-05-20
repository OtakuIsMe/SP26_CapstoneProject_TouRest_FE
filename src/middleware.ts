import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Matches /tours/<any-id>/booking and /tours/<any-id>/booking/payment
const BOOKING_RE = /^\/tours\/[^/]+\/booking(\/|$)/;

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (!BOOKING_RE.test(pathname)) {
        return NextResponse.next();
    }

    const role = request.cookies.get("role")?.value;
    if (role) {
        return NextResponse.next();
    }

    // Preserve full URL (path + query string) as the redirect target
    const redirectTo = pathname + request.nextUrl.search;
    const signinUrl  = new URL("/signin", request.url);
    signinUrl.searchParams.set("redirect", redirectTo);
    return NextResponse.redirect(signinUrl);
}

export const config = {
    matcher: ["/tours/:id/booking", "/tours/:id/booking/:path*"],
};
