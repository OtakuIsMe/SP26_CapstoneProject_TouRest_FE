import ManageLayout from "@/components/layouts/manage/manage-layout";

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
    return <ManageLayout role="provider">{children}</ManageLayout>;
}
