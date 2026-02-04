import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedLayout( children : React.ReactNode) {
    const cookiesStore = await cookies();
    const token = cookiesStore.get("access-token")?.value;
    if (!token) {
        redirect("/login");
    }
    return <>{children}</>;
}