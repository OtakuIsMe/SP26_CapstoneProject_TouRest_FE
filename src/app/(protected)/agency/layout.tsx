import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ManageLayout from "@/components/layouts/manage/manage-layout";

export default async function AgencyLayout({ children }: { children: React.ReactNode }) {
    const role = (await cookies()).get("role")?.value;
    if (role !== "agency") redirect("/signin");

    return <ManageLayout role="agency">{children}</ManageLayout>;
}
