"use client";

import { useState } from "react";
import styles from "./filter-dropdown.module.scss";

interface SubCategory {
    name: string;
    count: number;
}

interface FilterDropdownProps {
    category: string;
    items: SubCategory[];
    defaultOpen?: boolean;
    maxVisible?: number;
}

export default function FilterDropdown({
    category,
    items,
    defaultOpen = true,
    maxVisible = 6,
}: FilterDropdownProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [showAll, setShowAll] = useState(false);
    const [checked, setChecked] = useState<Set<string>>(new Set());

    const visibleItems = showAll ? items : items.slice(0, maxVisible);
    const hasMore = items.length > maxVisible;

    function toggleCheck(name: string) {
        setChecked((prev) => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    }

    return (
        <div className={styles.dropdown}>
            <button
                className={styles.header}
                onClick={() => setIsOpen(!isOpen)}
                type="button"
            >
                <span className={styles.categoryName}>{category}</span>
                <svg
                    className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                >
                    <path
                        d="M4 6L8 10L12 6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            {isOpen && (
                <ul className={styles.list}>
                    {visibleItems.map((item) => (
                        <li key={item.name} className={styles.item}>
                            <label className={styles.checkLabel}>
                                <input
                                    type="checkbox"
                                    className={styles.checkbox}
                                    checked={checked.has(item.name)}
                                    onChange={() => toggleCheck(item.name)}
                                />
                                <span className={styles.itemName}>{item.name}</span>
                                <span className={styles.itemCount}>{item.count}</span>
                            </label>
                        </li>
                    ))}

                    {hasMore && !showAll && (
                        <li className={styles.showAllItem}>
                            <button
                                className={styles.showAllBtn}
                                onClick={() => setShowAll(true)}
                                type="button"
                            >
                                Show All ({items.length})
                            </button>
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
}
