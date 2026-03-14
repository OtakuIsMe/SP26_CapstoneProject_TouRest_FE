import ManageLayout from "@/components/layouts/manage/manage-layout";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return <ManageLayout role="admin">{children}</ManageLayout>;
}
