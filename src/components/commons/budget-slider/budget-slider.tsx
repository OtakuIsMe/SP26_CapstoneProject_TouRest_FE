"use client";

import { useState, useCallback } from "react";
import styles from "./budget-slider.module.scss";

interface BudgetSliderProps {
    min?: number;
    max?: number;
    defaultMin?: number;
    defaultMax?: number;
}

export default function BudgetSlider({
    min = 100,
    max = 9000,
    defaultMin = 100,
    defaultMax = 9000,
}: BudgetSliderProps) {
    const [minVal, setMinVal] = useState(defaultMin);
    const [maxVal, setMaxVal] = useState(defaultMax);

    const getPercent = useCallback(
        (value: number) => Math.round(((value - min) / (max - min)) * 100),
        [min, max]
    );

    const minPercent = getPercent(minVal);
    const maxPercent = getPercent(maxVal);

    return (
        <div className={styles.slider}>
            <div className={styles.label}>
                US ${minVal} - ${maxVal}+
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
                    value={minVal}
                    onChange={(e) => {
                        const val = Math.min(Number(e.target.value), maxVal - 100);
                        setMinVal(val);
                    }}
                    className={styles.thumb}
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={maxVal}
                    onChange={(e) => {
                        const val = Math.max(Number(e.target.value), minVal + 100);
                        setMaxVal(val);
                    }}
                    className={styles.thumb}
                />
            </div>
        </div>
    );
}
