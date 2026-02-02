import { InputHTMLAttributes } from "react";
import styles from "./form-field.module.scss";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

export default function FormField({ label, className, id, ...props }: FormFieldProps) {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");

    return (
        <div className={`${styles.field} ${className ?? ""}`}>
            <label htmlFor={fieldId} className={styles.label}>
                {label}
            </label>
            <input id={fieldId} className={styles.input} {...props} />
        </div>
    );
}
