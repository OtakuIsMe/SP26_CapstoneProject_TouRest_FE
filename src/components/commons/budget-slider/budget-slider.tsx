"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import styles from "./budget-slider.module.scss";

interface BudgetSliderProps {
    min?: number;
    max?: number;
    defaultMin?: number;
    defaultMax?: number;
    onRangeChange?: (min: number, max: number) => void;
}

export default function BudgetSlider({
    min = 0,
    max = 50_000_000,
    defaultMin = 0,
    defaultMax = 50_000_000,
    onRangeChange,
}: BudgetSliderProps) {
    const [minVal, setMinVal] = useState(defaultMin);
    const [maxVal, setMaxVal] = useState(defaultMax);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const getPercent = useCallback(
        (value: number) => Math.round(((value - min) / (max - min)) * 100),
        [min, max]
    );

    const notify = useCallback((lo: number, hi: number) => {
        if (!onRangeChange) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => onRangeChange(lo, hi), 400);
    }, [onRangeChange]);

    useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

    const minPercent = getPercent(minVal);
    const maxPercent = getPercent(maxVal);

    return (
        <div className={styles.slider}>
            <div className={styles.label}>
                {minVal.toLocaleString("vi-VN")}đ — {maxVal.toLocaleString("vi-VN")}đ
            </div>
            <div className={styles.track}>
                <div
                    className={styles.range}
                    style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={100_000}
                    value={minVal}
                    onChange={(e) => {
                        const val = Math.min(Number(e.target.value), maxVal - 100_000);
                        setMinVal(val);
                        notify(val, maxVal);
                    }}
                    className={styles.thumb}
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={100_000}
                    value={maxVal}
                    onChange={(e) => {
                        const val = Math.max(Number(e.target.value), minVal + 100_000);
                        setMaxVal(val);
                        notify(minVal, val);
                    }}
                    className={styles.thumb}
                />
            </div>
        </div>
    );
}
