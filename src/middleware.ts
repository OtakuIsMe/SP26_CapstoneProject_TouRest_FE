import { NextRequest, NextResponse } from "next/server";
import type { UserResponse } from "@/types/auth.type";
import { authService } from "./libs/services/auth.service";

type Role = UserResponse["role"];
type DashboardRole = Extract<Role, "admin" | "agency" | "provider">;

const roleMap: Record<DashboardRole, string> = {
  admin:    "/(admin)/dashboard/",
  agency:   "/(agency)/dashboard/",
  provider: "/(provider)/dashboard/",
};

// Type guard → TypeScript hiểu role là DashboardRole sau khi check
function isDashboardRole(role: Role): role is DashboardRole {
  return Object.keys(roleMap).includes(role);
}

async function getCurrentUser(): Promise<UserResponse | null> {
  try {
    const res = await authService.getMe();
    if (res.status === 200) return res.data;
    return null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const user = await getCurrentUser();
  const role = user?.role;

  // role giờ được narrow thành DashboardRole trong block dưới
  if (!role || !isDashboardRole(role)) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete("access-token");
    return res;
  }

  if (request.nextUrl.pathname === "/dashboard") {
    return NextResponse.rewrite(new URL(roleMap[role], request.url));
  }
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};