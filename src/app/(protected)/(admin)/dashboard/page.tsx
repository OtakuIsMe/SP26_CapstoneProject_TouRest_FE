"use client";

import { useState } from "react";
import styles from "./page.module.scss";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
    return `$${n}`;
}

// ── Data ──────────────────────────────────────────────────────────────────────
const STATS = [
    { label: "Page Views",  value: "16,431", badge: "+15.5%", up: true,  vs: "vs. 14,653 last period", icon: "👁",  iconCls: "statIconBlue"   },
    { label: "Visitors",    value: "6,225",  badge: "+8.4%",  up: true,  vs: "vs. 5,732 last period",  icon: "👥", iconCls: "statIconGreen"  },
    { label: "Click",       value: "2,832",  badge: "-10.5%", up: false, vs: "vs. 3,294 last period",  icon: "🖱️", iconCls: "statIconAmber"  },
    { label: "Orders",      value: "1,224",  badge: "+4.4%",  up: true,  vs: "vs. 1,186 last period",  icon: "📦", iconCls: "statIconPurple" },
];

// SVG line chart data — normalised 0‒100 coords for an 11-point series
const CHART_W = 400;
const CHART_H = 100;
const THIS_M = [20, 35, 25, 45, 38, 60, 55, 72, 65, 80, 88];
const LAST_M = [18, 28, 32, 38, 50, 42, 48, 58, 52, 60, 65];

function pts(data: number[]): string {
    return data.map((v, i) => {
        const x = (i / (data.length - 1)) * CHART_W;
        const y = CHART_H - (v / 100) * CHART_H;
        return `${x},${y}`;
    }).join(" ");
}

function areaPath(data: number[]): string {
    const top = data.map((v, i) => {
        const x = (i / (data.length - 1)) * CHART_W;
        const y = CHART_H - (v / 100) * CHART_H;
        return `${i === 0 ? "M" : "L"}${x},${y}`;
    }).join(" ");
    return `${top} L${CHART_W},${CHART_H} L0,${CHART_H} Z`;
}

const X_LABELS = ["1 Jan","8 Jan","15 Jan","22 Jan","29 Jan"];

const DAYS = [
    { day: "Sun", val: 5200,  active: false },
    { day: "Mon", val: 7400,  active: false },
    { day: "Tue", val: 8162,  active: true  },
    { day: "Wed", val: 6300,  active: false },
    { day: "Thu", val: 5800,  active: false },
    { day: "Fri", val: 4900,  active: false },
    { day: "Sat", val: 5500,  active: false },
];
const MAX_DAY = Math.max(...DAYS.map(d => d.val));

const PRODUCTS = [
    { id:"#83009", name:"Hybrid Active Noise Cance...", icon:"🎧", sold:"2,310 sold", revenue: 124839, rating:5.0, rev:"green"  },
    { id:"#83001", name:"Casio G-Shock Shock Resi...",  icon:"⌚", sold:"1,230 sold", revenue:  92662, rating:4.8, rev:"red"    },
    { id:"#83004", name:"SAMSUNG Galaxy S25 Ultr...",   icon:"📱", sold:"812 sold",   revenue:  74048, rating:4.7, rev:"amber"  },
    { id:"#83002", name:"Xbox Wireless Gaming Co...",   icon:"🎮", sold:"645 sold",   revenue:  62820, rating:4.5, rev:"green"  },
    { id:"#83002", name:"Timex Men's Easy Reader...",   icon:"⌚", sold:"572 sold",   revenue:  48724, rating:4.5, rev:"green"  },
];

// Gauge — semicircle from -180 to 0 deg, value = 68%
function GaugePath({ pct, color }: { pct: number; color: string }) {
    const R = 70;
    const cx = 85, cy = 85;
    const start = { x: cx - R, y: cy };           // -180°
    const angle = Math.PI * (pct / 100);
    const end   = { x: cx - R * Math.cos(angle), y: cy - R * Math.sin(angle) };
    const large = angle > Math.PI / 2 ? 1 : 0;
    return (
        <path
            d={`M${start.x},${start.y} A${R},${R} 0 ${large} 1 ${end.x},${end.y}`}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
        />
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
    const [aiMsg, setAiMsg] = useState("");

    return (
        <div className={styles.page}>
            {/* ── Stat Cards ── */}
            <div className={styles.statsRow}>
                {STATS.map(s => (
                    <div key={s.label} className={styles.statCard}>
                        <div className={styles.statTop}>
                            <p className={styles.statLabel}>{s.label}</p>
                            <div className={`${styles.statIcon} ${styles[s.iconCls as keyof typeof styles]}`}>
                                <span style={{ fontSize: 16 }}>{s.icon}</span>
                            </div>
                        </div>
                        <p className={styles.statValue}>{s.value}</p>
                        <div className={styles.statFooter}>
                            <span className={`${styles.statBadge} ${s.up ? styles.badgeUp : styles.badgeDown}`}>
                                {s.up ? "▲" : "▼"} {s.badge}
                            </span>
                            <span className={styles.statSub}>{s.vs}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Mid Row ── */}
            <div className={styles.midRow}>
                <div className={styles.midLeft}>
                    {/* Total Profit chart */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <p className={styles.cardTitle}>Total Profit</p>
                            <button className={styles.cardMenu}>···</button>
                        </div>
                        <div className={styles.profitBody}>
                            <div className={styles.profitLeft}>
                                <p className={styles.profitValue}>$446.7K</p>
                                <div className={styles.profitBadge}>▲ 24.4%</div>
                                <p className={styles.profitVs}>vs. last period</p>
                            </div>
                            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                                <div className={styles.chartWrap}>
                                    <svg
                                        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                                        className={styles.chartSvg}
                                        preserveAspectRatio="none"
                                    >
                                        <defs>
                                            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18"/>
                                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                                            </linearGradient>
                                        </defs>
                                        {/* Grid lines */}
                                        {[0,33,66,100].map(v => (
                                            <line key={v}
                                                x1="0" y1={CHART_H - (v/100)*CHART_H}
                                                x2={CHART_W} y2={CHART_H - (v/100)*CHART_H}
                                                stroke="#e5e7eb" strokeWidth="1"
                                            />
                                        ))}
                                        {/* Area fill */}
                                        <path d={areaPath(THIS_M)} fill="url(#areaGrad)" />
                                        {/* Last month dashed */}
                                        <polyline
                                            points={pts(LAST_M)}
                                            fill="none"
                                            stroke="#d1d5db"
                                            strokeWidth="1.5"
                                            strokeDasharray="4 3"
                                        />
                                        {/* This month solid */}
                                        <polyline
                                            points={pts(THIS_M)}
                                            fill="none"
                                            stroke="#3b82f6"
                                            strokeWidth="2"
                                        />
                                        {/* Tooltip dot */}
                                        <circle
                                            cx={(6/(THIS_M.length-1))*CHART_W}
                                            cy={CHART_H - (THIS_M[6]/100)*CHART_H}
                                            r="4" fill="#3b82f6"
                                        />
                                    </svg>
                                    {/* Tooltip */}
                                    <div className={styles.chartTooltip}>
                                        <p className={styles.tooltipDate}>Jan 18, 2026</p>
                                        <p className={styles.tooltipThis}>
                                            <span className={styles.tooltipDot} style={{ background:"#3b82f6" }}/>
                                            $12,324 this month
                                        </p>
                                        <p className={styles.tooltipLast}>
                                            <span className={styles.tooltipDot} style={{ background:"#d1d5db" }}/>
                                            $5,563 last month
                                        </p>
                                    </div>
                                </div>
                                <div className={styles.chartXAxis}>
                                    {X_LABELS.map(l => <span key={l}>{l}</span>)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customers breakdown */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <p className={styles.cardTitle}>Customers</p>
                            <button className={styles.cardMenu}>···</button>
                        </div>
                        <div className={styles.breakdownRows}>
                            {[
                                { label:"Retailers",     value:"2,884", color:"#3b82f6", pct: 52 },
                                { label:"Distributors",  value:"1,432", color:"#10b981", pct: 26 },
                                { label:"Wholesalers",   value:"562",   color:"#f59e0b", pct: 22 },
                            ].map(b => (
                                <div key={b.label} className={styles.breakdownItem}>
                                    <div className={styles.breakdownValue}>
                                        <span className={styles.breakdownDot} style={{ background: b.color }} />
                                        {b.value}
                                    </div>
                                    <span className={styles.breakdownLabel}>{b.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className={styles.breakdownBar}>
                            <div className={styles.barSegment} style={{ width:"52%", background:"#3b82f6" }} />
                            <div className={styles.barSegment} style={{ width:"26%", background:"#10b981" }} />
                            <div className={styles.barSegment} style={{ width:"22%", background:"#f59e0b" }} />
                        </div>
                    </div>
                </div>

                <div className={styles.midRight}>
                    {/* Most Day Active bar chart */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <p className={styles.cardTitle}>Most Day Active</p>
                            <button className={styles.cardMenu}>···</button>
                        </div>
                        <div className={styles.barChart}>
                            {DAYS.map(d => (
                                <div key={d.day} className={styles.barCol}>
                                    {d.active && (
                                        <span className={styles.barTopVal}>
                                            {(d.val/1000).toFixed(1)}k
                                        </span>
                                    )}
                                    <div
                                        className={`${styles.bar} ${d.active ? styles.barActive : ""}`}
                                        style={{ height: `${(d.val / MAX_DAY) * 80}%` }}
                                    />
                                    <span className={styles.barLabel}>{d.day}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Repeat Customer Rate gauge */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <p className={styles.cardTitle}>Repeat Customer Rate</p>
                            <button className={styles.cardMenu}>···</button>
                        </div>
                        <div className={styles.gaugeWrap}>
                            <div className={styles.gaugeSvgWrap}>
                                <svg viewBox="0 0 170 96" className={styles.gaugeSvg}>
                                    {/* Background segments */}
                                    {[
                                        { pct: 100, color: "#e5e7eb" },
                                        { pct: 68,  color: "#10b981" },
                                    ].map((s, i) => (
                                        <GaugePath key={i} pct={s.pct} color={s.color} />
                                    ))}
                                </svg>
                                <div className={styles.gaugeOverlay}>
                                    <span className={styles.gaugeNum}>68%</span>
                                    <span className={styles.gaugeSub}>On track for 80% target</span>
                                </div>
                            </div>
                            <button className={styles.gaugeDetailsBtn}>Show details</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Bottom Row ── */}
            <div className={styles.bottomRow}>
                {/* Best Selling Products table */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <p className={styles.cardTitle}>Best Selling Products</p>
                        <button className={styles.cardMenu}>···</button>
                    </div>
                    <table className={styles.table}>
                        <thead className={styles.thead}>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Sold</th>
                                <th>Revenue</th>
                                <th>Rating</th>
                            </tr>
                        </thead>
                        <tbody className={styles.tbody}>
                            {PRODUCTS.map((p, i) => (
                                <tr key={i}>
                                    <td className={styles.tdId}>{p.id}</td>
                                    <td>
                                        <div className={styles.productCell}>
                                            <div className={styles.productIcon}>{p.icon}</div>
                                            <span className={styles.productName}>{p.name}</span>
                                        </div>
                                    </td>
                                    <td className={styles.tdSold}>{p.sold}</td>
                                    <td>
                                        <span className={`${styles.revenue} ${styles[p.rev as keyof typeof styles]}`}>
                                            ${p.revenue.toLocaleString()}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.tdRating}>
                                            <span className={styles.star}>★</span>
                                            ({p.rating.toFixed(1)})
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* AI Assistant */}
                <div className={styles.aiCard}>
                    <div className={styles.aiHeader}>
                        <p className={styles.aiTitle}>AI Assistant</p>
                        <button className={styles.aiExpandBtn}>⤢</button>
                    </div>
                    <div className={styles.aiBody}>
                        <div className={styles.aiOrb} />
                    </div>
                    <div className={styles.aiInput}>
                        <input
                            className={styles.aiInputField}
                            placeholder="Ask me anything..."
                            value={aiMsg}
                            onChange={e => setAiMsg(e.target.value)}
                        />
                        <button className={styles.aiVoiceBtn} title="Voice input">🎙️</button>
                        <button className={styles.aiSendBtn} title="Send">↑</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
