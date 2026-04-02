import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ManageLayout from "@/components/layouts/manage/manage-layout";

const roleHome: Record<string, string> = {
    admin:    "/admin/dashboard",
    agency:   "/agency/dashboard",
    provider: "/provider/dashboard",
    customer: "/",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const role = (await cookies()).get("role")?.value;
    if (!role) redirect("/signin");
    if (role !== "admin") redirect(roleHome[role] ?? "/signin");

    return <ManageLayout role="admin">{children}</ManageLayout>;
}
