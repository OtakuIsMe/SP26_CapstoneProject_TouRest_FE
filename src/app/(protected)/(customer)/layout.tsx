import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
    const role = (await cookies()).get("role")?.value;
    if (role !== "customer") redirect("/signin");

    return <>{children}</>;
}
