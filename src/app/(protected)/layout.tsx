import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CookieKeys } from "@/constants/storage";

export default async function ProtectedLayout(children: LayoutProps<"/">) {
    const cookiesStore = await cookies();
    const token = cookiesStore.get(CookieKeys.ACCESS_TOKEN)?.value;
    if (!token) {
        redirect("/signin");
    }
    return <>{children}</>;
}