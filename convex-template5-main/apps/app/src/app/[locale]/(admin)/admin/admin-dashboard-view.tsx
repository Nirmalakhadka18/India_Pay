import { Edit } from "lucide-react";
import React from "react";

interface AdminDashboardViewProps {
  activeCount?: number;
}

export function AdminDashboardView({
  activeCount = 33,
}: AdminDashboardViewProps) {
  return (
    <div className="w-full bg-[#f8fafc] px-4 py-3 select-none text-[#333]">
      {/* Top action row */}
      <div className="flex justify-end mb-2">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded border border-[#0d6efd] bg-white px-3 py-1 text-xs font-medium text-[#0d6efd] hover:bg-blue-50 transition shadow-2xs"
        >
          <Edit className="h-3 w-3" />
          Edit
        </button>
      </div>

      {/* Grid of Dashlets */}
      <div className="space-y-4">
        {/* ROW 1: Years In Service Distribution (50%) & Additions & Attrition (50%) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Card 1: Years In Service Distribution */}
          <div className="rounded border border-[#e2e8f0] bg-white p-3.5 shadow-2xs">
            <div className="border-b border-[#f1f5f9] pb-2 text-[14px] font-semibold text-[#0d6efd]">
              Years In Service Distribution
            </div>
            <div className="pt-2 text-[11px] text-slate-500 mb-1">
              <span className="font-semibold text-slate-600">Years</span>
            </div>
            <div className="relative h-[160px] w-full">
              <svg
                viewBox="0 0 600 160"
                className="w-full h-full"
                preserveAspectRatio="none"
              >
                {/* Horizontal Grid lines */}
                <line
                  x1="40"
                  y1="20"
                  x2="580"
                  y2="20"
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <line
                  x1="40"
                  y1="50"
                  x2="580"
                  y2="50"
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <line
                  x1="40"
                  y1="80"
                  x2="580"
                  y2="80"
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <line
                  x1="40"
                  y1="110"
                  x2="580"
                  y2="110"
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <line
                  x1="40"
                  y1="140"
                  x2="580"
                  y2="140"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />

                {/* Y-axis labels */}
                <text
                  x="32"
                  y="24"
                  fontSize="10"
                  fill="#94a3b8"
                  textAnchor="end"
                >
                  50
                </text>
                <text
                  x="32"
                  y="54"
                  fontSize="10"
                  fill="#94a3b8"
                  textAnchor="end"
                >
                  40
                </text>
                <text
                  x="32"
                  y="84"
                  fontSize="10"
                  fill="#94a3b8"
                  textAnchor="end"
                >
                  30
                </text>
                <text
                  x="32"
                  y="114"
                  fontSize="10"
                  fill="#94a3b8"
                  textAnchor="end"
                >
                  20
                </text>
                <text
                  x="32"
                  y="144"
                  fontSize="10"
                  fill="#94a3b8"
                  textAnchor="end"
                >
                  0
                </text>

                {/* Cyan data line */}
                <polyline
                  fill="none"
                  stroke="#17a2b8"
                  strokeWidth="2.5"
                  points="160,60 480,140"
                />
                {/* Points */}
                <circle cx="160" cy="60" r="4" fill="#17a2b8" />
                <text
                  x="160"
                  y="50"
                  fontSize="11"
                  fontWeight="bold"
                  fill="#334155"
                  textAnchor="middle"
                >
                  33
                </text>

                <circle cx="480" cy="140" r="3" fill="#17a2b8" />

                {/* X-axis labels */}
                <text
                  x="160"
                  y="156"
                  fontSize="10"
                  fill="#64748b"
                  textAnchor="middle"
                >
                  &lt; 1
                </text>
                <text
                  x="480"
                  y="156"
                  fontSize="10"
                  fill="#64748b"
                  textAnchor="middle"
                >
                  &gt; 10
                </text>
              </svg>
            </div>
            <div className="text-center text-[11px] text-slate-500 mt-1">
              Years
            </div>
          </div>

          {/* Card 2: Additions & Attrition */}
          <div className="rounded border border-[#e2e8f0] bg-white p-3.5 shadow-2xs">
            <div className="border-b border-[#f1f5f9] pb-2 text-[14px] font-semibold text-[#0d6efd]">
              Additions &amp; Attrition
            </div>
            <div className="pt-2 text-[11px] text-slate-500">
              December-2025 to November-2026
            </div>
            <div className="relative h-[160px] w-full">
              <svg
                viewBox="0 0 600 160"
                className="w-full h-full"
                preserveAspectRatio="none"
              >
                {/* Horizontal Grid lines */}
                <line
                  x1="30"
                  y1="20"
                  x2="580"
                  y2="20"
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <line
                  x1="30"
                  y1="60"
                  x2="580"
                  y2="60"
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <line
                  x1="30"
                  y1="100"
                  x2="580"
                  y2="100"
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <line
                  x1="30"
                  y1="135"
                  x2="580"
                  y2="135"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />

                {/* Y-axis */}
                <text
                  x="24"
                  y="24"
                  fontSize="10"
                  fill="#94a3b8"
                  textAnchor="end"
                >
                  40
                </text>
                <text
                  x="24"
                  y="64"
                  fontSize="10"
                  fill="#94a3b8"
                  textAnchor="end"
                >
                  20
                </text>
                <text
                  x="24"
                  y="138"
                  fontSize="10"
                  fill="#94a3b8"
                  textAnchor="end"
                >
                  0
                </text>

                {/* Red Attrition flat line */}
                <polyline
                  fill="none"
                  stroke="#e11d48"
                  strokeWidth="1.5"
                  points="60,135 110,135 160,135 210,135 260,135 310,135 360,135 410,135 460,135 500,135 540,135 570,135"
                />
                {[
                  60, 110, 160, 210, 260, 310, 360, 410, 460, 500, 540, 570,
                ].map((cx, i) => (
                  <circle key={cx} cx={cx} cy="135" r="2.5" fill="#e11d48" />
                ))}

                {/* Cyan Joined line: spike at Sep (29), Oct (3), Nov (1) */}
                <polyline
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="2"
                  points="60,135 110,135 160,135 210,135 260,135 310,135 360,135 410,135 460,135 500,45 540,126 570,132"
                />
                <circle cx="500" cy="45" r="3.5" fill="#0284c7" />
                <text
                  x="500"
                  y="38"
                  fontSize="10"
                  fontWeight="bold"
                  fill="#0284c7"
                  textAnchor="middle"
                >
                  29
                </text>

                <circle cx="540" cy="126" r="3" fill="#0284c7" />
                <text
                  x="540"
                  y="120"
                  fontSize="10"
                  fontWeight="bold"
                  fill="#0284c7"
                  textAnchor="middle"
                >
                  3
                </text>

                <circle cx="570" cy="132" r="3" fill="#0284c7" />
                <text
                  x="570"
                  y="124"
                  fontSize="10"
                  fontWeight="bold"
                  fill="#0284c7"
                  textAnchor="middle"
                >
                  1
                </text>

                {/* X labels */}
                {[
                  "Dec",
                  "Jan",
                  "Feb",
                  "Mar",
                  "Apr",
                  "May",
                  "Jun",
                  "Jul",
                  "Aug",
                  "Sep",
                  "Oct",
                  "Nov",
                ].map((m, idx) => (
                  <text
                    key={m}
                    x={60 + idx * 46}
                    y="150"
                    fontSize="9"
                    fill="#64748b"
                    textAnchor="middle"
                  >
                    {m}
                  </text>
                ))}
              </svg>
            </div>
            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-600 mt-1">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 bg-[#0284c7] inline-block rounded-xs" />{" "}
                Joined
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 bg-[#e11d48] inline-block rounded-xs" />{" "}
                Resigned
              </span>
            </div>
          </div>
        </div>

        {/* ROW 2: Employee Count By Location (Left) & Age Distribution (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Card 3: Employee Count By Location */}
          <div className="rounded border border-[#e2e8f0] bg-white p-3.5 shadow-2xs">
            <div className="border-b border-[#f1f5f9] pb-2 text-[14px] font-semibold text-[#0d6efd]">
              Employee Count By Location
            </div>
            <div className="relative h-[220px] w-full pt-4">
              <svg
                viewBox="0 0 600 200"
                className="w-full h-full"
                preserveAspectRatio="none"
              >
                {/* Horizontal axes */}
                <line
                  x1="70"
                  y1="160"
                  x2="580"
                  y2="160"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
                <line
                  x1="70"
                  y1="20"
                  x2="70"
                  y2="160"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />

                {/* Bar */}
                <rect
                  x="70"
                  y="80"
                  width="220"
                  height="24"
                  fill="#0e7490"
                  rx="1"
                />
                <text
                  x="64"
                  y="96"
                  fontSize="11"
                  fill="#475569"
                  textAnchor="end"
                >
                  Bangalore
                </text>
                <text
                  x="296"
                  y="96"
                  fontSize="11"
                  fontWeight="bold"
                  fill="#0e7490"
                >
                  33
                </text>

                {/* X-axis ticks */}
                {[0, 7, 14, 21, 28, 35, 42, 49, 56, 63, 70].map((val, idx) => (
                  <g key={val}>
                    <line
                      x1={70 + idx * 51}
                      y1="160"
                      x2={70 + idx * 51}
                      y2="165"
                      stroke="#94a3b8"
                    />
                    <text
                      x={70 + idx * 51}
                      y="178"
                      fontSize="9"
                      fill="#64748b"
                      textAnchor="middle"
                    >
                      {val}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Card 4: Age Distribution */}
          <div className="rounded border border-[#e2e8f0] bg-white p-3.5 shadow-2xs">
            <div className="border-b border-[#f1f5f9] pb-2 text-[14px] font-semibold text-[#0d6efd]">
              Age Distribution
            </div>
            <div className="relative h-[220px] w-full pt-4">
              <svg
                viewBox="0 0 600 190"
                className="w-full h-full"
                preserveAspectRatio="none"
              >
                {/* Grid */}
                <line
                  x1="30"
                  y1="20"
                  x2="580"
                  y2="20"
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <line
                  x1="30"
                  y1="60"
                  x2="580"
                  y2="60"
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <line
                  x1="30"
                  y1="100"
                  x2="580"
                  y2="100"
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <line
                  x1="30"
                  y1="140"
                  x2="580"
                  y2="140"
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <line
                  x1="30"
                  y1="160"
                  x2="580"
                  y2="160"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />

                {/* Y labels */}
                <text
                  x="24"
                  y="24"
                  fontSize="10"
                  fill="#94a3b8"
                  textAnchor="end"
                >
                  22
                </text>
                <text
                  x="24"
                  y="64"
                  fontSize="10"
                  fill="#94a3b8"
                  textAnchor="end"
                >
                  16
                </text>
                <text
                  x="24"
                  y="104"
                  fontSize="10"
                  fill="#94a3b8"
                  textAnchor="end"
                >
                  10
                </text>
                <text
                  x="24"
                  y="144"
                  fontSize="10"
                  fill="#94a3b8"
                  textAnchor="end"
                >
                  4
                </text>
                <text
                  x="24"
                  y="164"
                  fontSize="10"
                  fill="#94a3b8"
                  textAnchor="end"
                >
                  0
                </text>

                {/* Teal line with points: <20(1), 20-25(6), 25-30(16), 30-35(7), 35-40(1), 45-50(2) */}
                <polyline
                  fill="none"
                  stroke="#0891b2"
                  strokeWidth="2"
                  points="60,154 140,118 220,58 300,112 380,154 460,148 540,160"
                />
                {[
                  { cx: 60, cy: 154, val: 1 },
                  { cx: 140, cy: 118, val: 6 },
                  { cx: 220, cy: 58, val: 16 },
                  { cx: 300, cy: 112, val: 7 },
                  { cx: 380, cy: 154, val: 1 },
                  { cx: 460, cy: 148, val: 2 },
                  { cx: 540, cy: 160, val: 0 },
                ].map((pt, i) => (
                  <g key={pt.cx}>
                    <circle cx={pt.cx} cy={pt.cy} r="3" fill="#0891b2" />
                    {pt.val > 0 && (
                      <text
                        x={pt.cx}
                        y={pt.cy - 7}
                        fontSize="10"
                        fontWeight="bold"
                        fill="#0891b2"
                        textAnchor="middle"
                      >
                        {pt.val}
                      </text>
                    )}
                  </g>
                ))}

                {/* X labels */}
                {[
                  { label: "< 20", x: 60 },
                  { label: "20-25", x: 140 },
                  { label: "25-30", x: 220 },
                  { label: "30-35", x: 300 },
                  { label: "35-40", x: 380 },
                  { label: "45-50", x: 460 },
                  { label: "> 50", x: 540 },
                ].map((item) => (
                  <text
                    key={item.label}
                    x={item.x}
                    y="176"
                    fontSize="9"
                    fill="#64748b"
                    textAnchor="middle"
                  >
                    {item.label}
                  </text>
                ))}
              </svg>
            </div>
            <div className="text-center text-[11px] text-slate-500 mt-1">
              Age
            </div>
          </div>
        </div>

        {/* ROW 3: Salary Revision Frequency (Left) & Gender Distribution (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Card 5: Salary Revision Frequency */}
          <div className="rounded border border-[#e2e8f0] bg-white p-3.5 shadow-2xs">
            <div className="border-b border-[#f1f5f9] pb-2 text-[14px] font-semibold text-[#0d6efd]">
              Salary Revision Frequency
            </div>
            <div className="relative h-[160px] w-full pt-4">
              <svg
                viewBox="0 0 600 150"
                className="w-full h-full"
                preserveAspectRatio="none"
              >
                <line
                  x1="30"
                  y1="20"
                  x2="580"
                  y2="20"
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <line
                  x1="30"
                  y1="60"
                  x2="580"
                  y2="60"
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <line
                  x1="30"
                  y1="100"
                  x2="580"
                  y2="100"
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <line
                  x1="30"
                  y1="130"
                  x2="580"
                  y2="130"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />

                <text
                  x="24"
                  y="24"
                  fontSize="10"
                  fill="#94a3b8"
                  textAnchor="end"
                >
                  10
                </text>
                <text
                  x="24"
                  y="64"
                  fontSize="10"
                  fill="#94a3b8"
                  textAnchor="end"
                >
                  7
                </text>
                <text
                  x="24"
                  y="104"
                  fontSize="10"
                  fill="#94a3b8"
                  textAnchor="end"
                >
                  3
                </text>
                <text
                  x="24"
                  y="134"
                  fontSize="10"
                  fill="#94a3b8"
                  textAnchor="end"
                >
                  0
                </text>

                <polyline
                  fill="none"
                  stroke="#0891b2"
                  strokeWidth="2"
                  points="160,130 480,130"
                />
                <circle cx="160" cy="130" r="3" fill="#0891b2" />
                <circle cx="480" cy="130" r="3" fill="#0891b2" />

                <text
                  x="160"
                  y="146"
                  fontSize="9"
                  fill="#64748b"
                  textAnchor="middle"
                >
                  &lt; 6
                </text>
                <text
                  x="480"
                  y="146"
                  fontSize="9"
                  fill="#64748b"
                  textAnchor="middle"
                >
                  &gt; 30
                </text>
              </svg>
            </div>
            <div className="text-center text-[11px] text-slate-500 mt-1">
              Month
            </div>
          </div>

          {/* Card 6: Gender Distribution - Current Employees */}
          <div className="rounded border border-[#e2e8f0] bg-white p-3.5 shadow-2xs">
            <div className="border-b border-[#f1f5f9] pb-2 text-[14px] font-semibold text-[#0d6efd]">
              Gender Distribution - Current Employees
            </div>
            <div className="flex flex-col items-center justify-center pt-2">
              <svg viewBox="0 0 160 160" className="w-36 h-36">
                {/* Male slice (18 / 33 = ~54.5% => 196 deg) */}
                <path d="M80,80 L80,10 A70,70 0 1,1 68,149 Z" fill="#009688" />
                {/* Female slice (15 / 33 = ~45.5% => 164 deg) */}
                <path d="M80,80 L68,149 A70,70 0 0,1 80,10 Z" fill="#e91e63" />
                {/* Labels inside slices */}
                <text
                  x="110"
                  y="90"
                  fontSize="12"
                  fontWeight="bold"
                  fill="#ffffff"
                  textAnchor="middle"
                >
                  18
                </text>
                <text
                  x="50"
                  y="90"
                  fontSize="12"
                  fontWeight="bold"
                  fill="#ffffff"
                  textAnchor="middle"
                >
                  15
                </text>
              </svg>

              {/* Legend */}
              <div className="flex items-center gap-4 text-[11px] text-slate-600 mt-3">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 bg-[#009688] inline-block rounded-xs" />{" "}
                  Male
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 bg-[#e91e63] inline-block rounded-xs" />{" "}
                  Female
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 bg-[#3b82f6] inline-block rounded-xs" />{" "}
                  Not Available
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 4: Last 6 Months MONTHLY CTC (Left 65%) & MONTHLY CTC By Location (Right 35%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Card 7: Last 6 Months MONTHLY CTC */}
          <div className="lg:col-span-8 rounded border border-[#e2e8f0] bg-white p-3.5 shadow-2xs">
            <div className="border-b border-[#f1f5f9] pb-2 text-[14px] font-semibold text-[#0d6efd]">
              Last 6 Months MONTHLY CTC
            </div>
            <div className="relative h-[220px] w-full pt-4">
              <svg
                viewBox="0 0 650 190"
                className="w-full h-full"
                preserveAspectRatio="none"
              >
                <line
                  x1="40"
                  y1="20"
                  x2="620"
                  y2="20"
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <line
                  x1="40"
                  y1="65"
                  x2="620"
                  y2="65"
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <line
                  x1="40"
                  y1="110"
                  x2="620"
                  y2="110"
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <line
                  x1="40"
                  y1="155"
                  x2="620"
                  y2="155"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />

                {/* Sep Bar */}
                <rect
                  x="120"
                  y="70"
                  width="30"
                  height="85"
                  fill="#009688"
                  rx="1"
                />
                <text
                  x="135"
                  y="62"
                  fontSize="9"
                  fill="#475569"
                  textAnchor="middle"
                >
                  1804500
                </text>
                <text
                  x="135"
                  y="170"
                  fontSize="10"
                  fill="#64748b"
                  textAnchor="middle"
                >
                  Sep 2026
                </text>

                {/* Oct Bar */}
                <rect
                  x="290"
                  y="55"
                  width="30"
                  height="100"
                  fill="#009688"
                  rx="1"
                />
                <text
                  x="305"
                  y="47"
                  fontSize="9"
                  fill="#475569"
                  textAnchor="middle"
                >
                  2064500
                </text>
                <text
                  x="305"
                  y="170"
                  fontSize="10"
                  fill="#64748b"
                  textAnchor="middle"
                >
                  Oct 2026
                </text>

                {/* Nov Bar */}
                <rect
                  x="460"
                  y="52"
                  width="30"
                  height="103"
                  fill="#009688"
                  rx="1"
                />
                <text
                  x="475"
                  y="44"
                  fontSize="9"
                  fill="#475569"
                  textAnchor="middle"
                >
                  2089500
                </text>
                <text
                  x="475"
                  y="170"
                  fontSize="10"
                  fill="#64748b"
                  textAnchor="middle"
                >
                  Nov 2026
                </text>
              </svg>
            </div>
          </div>

          {/* Card 8: MONTHLY CTC By Location */}
          <div className="lg:col-span-4 rounded border border-[#e2e8f0] bg-white p-3.5 shadow-2xs">
            <div className="border-b border-[#f1f5f9] pb-2 text-[14px] font-semibold text-[#0d6efd]">
              MONTHLY CTC By Location
            </div>
            <div className="pt-3">
              <table className="w-full text-left text-xs border border-[#bce8f1]">
                <thead>
                  <tr className="bg-[#d9edf7] text-[#31708f] border-b border-[#bce8f1]">
                    <th className="p-2 font-semibold">Location</th>
                    <th className="p-2 font-semibold text-right">
                      MONTHLY CT...
                    </th>
                    <th className="p-2 font-semibold text-right">
                      No of Employees
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr className="hover:bg-slate-50">
                    <td className="p-2">Bangalore</td>
                    <td className="p-2 text-right">2,089,499.99</td>
                    <td className="p-2 text-right">33</td>
                  </tr>
                  <tr className="font-bold bg-slate-50">
                    <td className="p-2">Total</td>
                    <td className="p-2 text-right">2,089,499.99</td>
                    <td className="p-2 text-right">33</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ROW 5: Ticket Status (Left) & Resolution Time (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Card 9: Ticket Status */}
          <div className="rounded border border-[#e2e8f0] bg-white p-3.5 shadow-2xs">
            <div className="border-b border-[#f1f5f9] pb-2 text-[14px] font-semibold text-[#0d6efd]">
              Ticket Status
            </div>
            <div className="flex h-[130px] items-center justify-center text-xs text-slate-400">
              Data Not Available
            </div>
          </div>

          {/* Card 10: Resolution Time */}
          <div className="rounded border border-[#e2e8f0] bg-white p-3.5 shadow-2xs">
            <div className="border-b border-[#f1f5f9] pb-2 text-[14px] font-semibold text-[#0d6efd]">
              Resolution Time
            </div>
            <div className="pt-1 text-[11px] text-slate-500">
              August-2026 to November-2026
            </div>
            <div className="relative h-[110px] w-full pt-2">
              <svg
                viewBox="0 0 500 100"
                className="w-full h-full"
                preserveAspectRatio="none"
              >
                <line
                  x1="30"
                  y1="20"
                  x2="480"
                  y2="20"
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <line
                  x1="30"
                  y1="50"
                  x2="480"
                  y2="50"
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <line
                  x1="30"
                  y1="80"
                  x2="480"
                  y2="80"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />

                <text
                  x="24"
                  y="24"
                  fontSize="9"
                  fill="#94a3b8"
                  textAnchor="end"
                >
                  1
                </text>
                <text
                  x="24"
                  y="54"
                  fontSize="9"
                  fill="#94a3b8"
                  textAnchor="end"
                >
                  1
                </text>
                <text
                  x="24"
                  y="84"
                  fontSize="9"
                  fill="#94a3b8"
                  textAnchor="end"
                >
                  0
                </text>

                <polyline
                  fill="none"
                  stroke="#2592a7"
                  strokeWidth="2"
                  points="140,80 380,80"
                />
                <circle cx="140" cy="80" r="3" fill="#2592a7" />
                <circle cx="380" cy="80" r="3" fill="#2592a7" />

                <text
                  x="140"
                  y="94"
                  fontSize="9"
                  fill="#64748b"
                  textAnchor="middle"
                >
                  &lt; 2
                </text>
                <text
                  x="380"
                  y="94"
                  fontSize="9"
                  fill="#64748b"
                  textAnchor="middle"
                >
                  &gt; 24
                </text>
              </svg>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-600 mt-1">
              <span className="h-2.5 w-2.5 bg-[#2592a7] inline-block rounded-xs" />{" "}
              Resolved
            </div>
          </div>
        </div>

        {/* ROW 6: Top 5 Leave Takers (Full width / Half width) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Card 11: Top 5 Leave Takers */}
          <div className="rounded border border-[#e2e8f0] bg-white p-3.5 shadow-2xs">
            <div className="border-b border-[#f1f5f9] pb-2 text-[14px] font-semibold text-[#0d6efd]">
              Top 5 Leave Takers
            </div>
            <div className="pt-1 text-[11px] text-slate-500 mb-2">
              01 Aug 2026 to 30 Nov 2026
            </div>
            <table className="w-full text-left text-xs border border-[#bce8f1]">
              <thead>
                <tr className="bg-[#d9edf7] text-[#31708f] border-b border-[#bce8f1]">
                  <th className="p-2 font-semibold">Emp No.</th>
                  <th className="p-2 font-semibold">Name</th>
                  <th className="p-2 font-semibold text-right">Day</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {[
                  { empNo: "NH-OL-651", name: "Srishti", day: 5 },
                  { empNo: "NH-OL-628", name: "Gowramma KB", day: 5 },
                  { empNo: "NH-OL-429", name: "Ajay Kumawat", day: 4 },
                  { empNo: "NH-OL-577", name: "Abdul Mailar", day: 3 },
                  { empNo: "VC-OL-028", name: "Rahi Sanjay Kayarkar", day: 2 },
                ].map((row, idx) => (
                  <tr key={row.empNo} className="hover:bg-slate-50">
                    <td className="p-2 font-mono text-[11px] text-slate-600">
                      {row.empNo}
                    </td>
                    <td className="p-2">{row.name}</td>
                    <td className="p-2 text-right font-medium">{row.day}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
