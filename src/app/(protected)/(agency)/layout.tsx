import ManageLayout from "@/components/layouts/manage/manage-layout";

export default function AgencyLayout({ children }: { children: React.ReactNode }) {
    return <ManageLayout role="agency">{children}</ManageLayout>;
}
