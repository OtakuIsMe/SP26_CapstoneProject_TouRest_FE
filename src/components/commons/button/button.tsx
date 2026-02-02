import { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./button.module.scss";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: ReactNode;
    iconPosition?: "left" | "right";
}

export default function Button({ icon, children, className, iconPosition = "left", ...props }: ButtonProps) {
    return (
        <button className={`${styles.button} ${className ?? ""}`} {...props}>
            {iconPosition === "left" && icon}
            {children}
            {iconPosition === "right" && icon}
        </button>
    );
}
