import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ManageLayout from "@/components/layouts/manage/manage-layout";

export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
    const role = (await cookies()).get("role")?.value;
    if (role !== "provider") redirect("/signin");

    return <ManageLayout role="provider">{children}</ManageLayout>;
}
