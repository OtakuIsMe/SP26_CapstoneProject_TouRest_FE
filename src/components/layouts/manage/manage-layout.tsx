import styles from "./manage-layout.module.scss";
import ManageSidebar, { type Role } from "./manage-sidebar";
import ManageHeader from "./manage-header";

export default function ManageLayout({
    children,
    role,
}: {
    children: React.ReactNode;
    role: Role;
}) {
    return (
        <div className={styles.layout}>
            <ManageSidebar role={role} />
            <div className={styles.main}>
                <ManageHeader role={role} />
                <main className={styles.content}>{children}</main>
            </div>
        </div>
    );
}
