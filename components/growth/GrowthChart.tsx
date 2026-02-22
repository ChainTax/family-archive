"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────

interface GrowthRecord {
  id: string;
  date: string;
  height: number | null;
  weight: number | null;
  label: string | null;
}

interface ChartPoint {
  dateMs: number;
  dateLabel: string;
  height: number | null;
  weight: number | null;
  isActual: boolean;
  label?: string;
}

type Tab = "height" | "weight";

// ─── Natural Cubic Spline ─────────────────────────────────────

function naturalCubicSpline(
  xs: number[],
  ys: number[]
): (x: number) => number {
  const n = xs.length;
  if (n === 0) return () => 0;
  if (n === 1) return () => ys[0];
  if (n === 2) {
    const slope = (ys[1] - ys[0]) / (xs[1] - xs[0]);
    return (x) => ys[0] + slope * (x - xs[0]);
  }

  const h: number[] = [];
  for (let i = 0; i < n - 1; i++) h.push(xs[i + 1] - xs[i]);

  // Build tridiagonal system
  const alpha: number[] = new Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    alpha[i] =
      (3 / h[i]) * (ys[i + 1] - ys[i]) -
      (3 / h[i - 1]) * (ys[i] - ys[i - 1]);
  }

  const l: number[] = new Array(n).fill(1);
  const mu: number[] = new Array(n).fill(0);
  const z: number[] = new Array(n).fill(0);

  for (let i = 1; i < n - 1; i++) {
    l[i] = 2 * (xs[i + 1] - xs[i - 1]) - h[i - 1] * mu[i - 1];
    mu[i] = h[i] / l[i];
    z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
  }

  const b: number[] = new Array(n - 1).fill(0);
  const c: number[] = new Array(n).fill(0);
  const d: number[] = new Array(n - 1).fill(0);

  for (let j = n - 2; j >= 0; j--) {
    c[j] = z[j] - mu[j] * c[j + 1];
    b[j] = (ys[j + 1] - ys[j]) / h[j] - (h[j] * (c[j + 1] + 2 * c[j])) / 3;
    d[j] = (c[j + 1] - c[j]) / (3 * h[j]);
  }

  return (x: number) => {
    // Clamp to range
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];

    // Binary search for segment
    let lo = 0,
      hi = n - 2;
    while (lo < hi) {
      const mid = Math.floor((lo + hi + 1) / 2);
      if (xs[mid] <= x) lo = mid;
      else hi = mid - 1;
    }
    const i = lo;
    const dx = x - xs[i];
    return ys[i] + b[i] * dx + c[i] * dx * dx + d[i] * dx * dx * dx;
  };
}

// ─── Data Preparation ─────────────────────────────────────────

const DAY_MS = 86400000;
const INTERVAL_DAYS = 3;

function buildChartData(records: GrowthRecord[]): ChartPoint[] {
  if (records.length === 0) return [];

  const sorted = [...records].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const hRecords = sorted.filter((r) => r.height != null);
  const wRecords = sorted.filter((r) => r.weight != null);

  const hSpline =
    hRecords.length >= 2
      ? naturalCubicSpline(
          hRecords.map((r) => new Date(r.date).getTime()),
          hRecords.map((r) => r.height!)
        )
      : hRecords.length === 1
      ? () => hRecords[0].height!
      : null;

  const wSpline =
    wRecords.length >= 2
      ? naturalCubicSpline(
          wRecords.map((r) => new Date(r.date).getTime()),
          wRecords.map((r) => r.weight!)
        )
      : wRecords.length === 1
      ? () => wRecords[0].weight!
      : null;

  const minMs = new Date(sorted[0].date).getTime();
  const maxMs = new Date(sorted[sorted.length - 1].date).getTime();

  // hRange / wRange for valid spline domains
  const hMin = hRecords.length ? new Date(hRecords[0].date).getTime() : null;
  const hMax = hRecords.length
    ? new Date(hRecords[hRecords.length - 1].date).getTime()
    : null;
  const wMin = wRecords.length ? new Date(wRecords[0].date).getTime() : null;
  const wMax = wRecords.length
    ? new Date(wRecords[wRecords.length - 1].date).getTime()
    : null;

  // Actual dates set for quick lookup
  const actualSet = new Map<number, GrowthRecord>(
    sorted.map((r) => [new Date(r.date).getTime(), r])
  );

  const points: ChartPoint[] = [];
  let ms = minMs;
  while (ms <= maxMs + DAY_MS) {
    const actual = actualSet.get(ms);
    const isActual = !!actual;

    const h =
      hSpline && hMin !== null && hMax !== null && ms >= hMin && ms <= hMax
        ? Math.round(hSpline(ms) * 10) / 10
        : null;
    const w =
      wSpline && wMin !== null && wMax !== null && ms >= wMin && ms <= wMax
        ? Math.round(wSpline(ms) * 10) / 10
        : null;

    points.push({
      dateMs: ms,
      dateLabel: new Date(ms).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      height: h,
      weight: w,
      isActual,
      label: actual?.label ?? undefined,
    });

    ms += INTERVAL_DAYS * DAY_MS;
    // Ensure last actual point is included
    if (ms > maxMs && ms - INTERVAL_DAYS * DAY_MS < maxMs) ms = maxMs;
  }

  return points;
}

// ─── Custom Dot ───────────────────────────────────────────────

function ActualDot(props: {
  cx?: number;
  cy?: number;
  payload?: ChartPoint;
  color: string;
}) {
  const { cx, cy, payload, color } = props;
  if (!payload?.isActual || cx == null || cy == null) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={color}
      stroke="white"
      strokeWidth={2}
    />
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────

interface TooltipProps {
  active?: boolean;
  payload?: { payload: ChartPoint }[];
  activeTab: Tab;
}

function CustomTooltip({ active, payload, activeTab }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-border-default px-4 py-3 text-sm min-w-[140px]">
      <p className="text-text-tertiary text-xs mb-2">{d.dateLabel}</p>
      {d.label && (
        <p className="text-xs font-semibold text-brand mb-1.5 bg-brand/10 px-2 py-0.5 rounded-full inline-block">
          {d.label}
        </p>
      )}
      {(activeTab === "height" || activeTab === "weight") && (
        <>
          {activeTab === "height" && d.height != null && (
            <p className="font-semibold text-text-primary">
              {d.height}{" "}
              <span className="text-xs text-text-tertiary font-normal">cm</span>
            </p>
          )}
          {activeTab === "weight" && d.weight != null && (
            <p className="font-semibold text-text-primary">
              {d.weight}{" "}
              <span className="text-xs text-text-tertiary font-normal">kg</span>
            </p>
          )}
        </>
      )}
      {d.isActual && (
        <p className="text-xs text-brand mt-1.5">● 실측값</p>
      )}
    </div>
  );
}

// ─── X-Axis Tick ─────────────────────────────────────────────

function formatXTick(ms: number): string {
  return new Date(ms).toLocaleDateString("ko-KR", {
    year: "2-digit",
    month: "numeric",
  });
}

// ─── Main Component ───────────────────────────────────────────

export function GrowthChart({ records }: { records: GrowthRecord[] }) {
  const [activeTab, setActiveTab] = useState<Tab>("height");
  const [animKey, setAnimKey] = useState(0);

  const handleTabChange = (tab: Tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setAnimKey((k) => k + 1);
  };

  const chartData = useMemo(() => buildChartData(records), [records]);

  const hasHeight = records.some((r) => r.height != null);
  const hasWeight = records.some((r) => r.weight != null);

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-tertiary gap-3">
        <span className="text-4xl">📏</span>
        <p className="text-sm">아직 기록이 없습니다.</p>
      </div>
    );
  }

  // Y-axis domain with padding
  const heightValues = chartData
    .map((d) => d.height)
    .filter((v): v is number => v != null);
  const weightValues = chartData
    .map((d) => d.weight)
    .filter((v): v is number => v != null);

  const hMin = heightValues.length
    ? Math.floor(Math.min(...heightValues) - 3)
    : 0;
  const hMax = heightValues.length
    ? Math.ceil(Math.max(...heightValues) + 3)
    : 100;
  const wMin = weightValues.length
    ? Math.floor(Math.min(...weightValues) - 1)
    : 0;
  const wMax = weightValues.length
    ? Math.ceil(Math.max(...weightValues) + 1)
    : 20;

  const COLOR_HEIGHT = "#CC7A4A";
  const COLOR_WEIGHT = "#7A8ECC";

  return (
    <div>
      {/* ── 탭 ── */}
      <div className="flex gap-2 mb-6">
        {hasHeight && (
          <button
            onClick={() => handleTabChange("height")}
            className={[
              "px-4 py-2 rounded-xl text-sm font-medium transition-all",
              activeTab === "height"
                ? "bg-brand text-white shadow-sm"
                : "bg-bg-secondary text-text-secondary hover:bg-border-default",
            ].join(" ")}
          >
            키 (cm)
          </button>
        )}
        {hasWeight && (
          <button
            onClick={() => handleTabChange("weight")}
            className={[
              "px-4 py-2 rounded-xl text-sm font-medium transition-all",
              activeTab === "weight"
                ? "bg-[#7A8ECC] text-white shadow-sm"
                : "bg-bg-secondary text-text-secondary hover:bg-border-default",
            ].join(" ")}
          >
            몸무게 (kg)
          </button>
        )}
      </div>

      {/* ── 차트 ── */}
      <div className="select-none">
        <ResponsiveContainer width="100%" height={340}>
          <LineChart
            key={animKey}
            data={chartData}
            margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D8" />
            <XAxis
              dataKey="dateMs"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={formatXTick}
              tick={{ fontSize: 11, fill: "#9C9890" }}
              tickLine={false}
              axisLine={{ stroke: "#E5E0D8" }}
              minTickGap={60}
            />
            {activeTab === "height" && (
              <YAxis
                domain={[hMin, hMax]}
                tick={{ fontSize: 11, fill: "#9C9890" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}`}
                width={38}
              />
            )}
            {activeTab === "weight" && (
              <YAxis
                domain={[wMin, wMax]}
                tick={{ fontSize: 11, fill: "#9C9890" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}`}
                width={38}
              />
            )}
            <Tooltip
              content={<CustomTooltip activeTab={activeTab} />}
              cursor={{ stroke: "#CFC9BF", strokeWidth: 1.5 }}
            />


            {/* 키 라인 */}
            {activeTab === "height" && hasHeight && (
              <Line
                type="linear"
                dataKey="height"
                stroke={COLOR_HEIGHT}
                strokeWidth={2.5}
                dot={(dotProps: Record<string, unknown>) => (
                  <ActualDot
                    key={String(dotProps.key ?? "")}
                    cx={dotProps.cx as number | undefined}
                    cy={dotProps.cy as number | undefined}
                    payload={dotProps.payload as ChartPoint | undefined}
                    color={COLOR_HEIGHT}
                  />
                )}
                activeDot={{ r: 7, fill: COLOR_HEIGHT, stroke: "white", strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive={true}
                animationDuration={900}
                animationEasing="ease-out"
              />
            )}

            {/* 몸무게 라인 */}
            {activeTab === "weight" && hasWeight && (
              <Line
                type="linear"
                dataKey="weight"
                stroke={COLOR_WEIGHT}
                strokeWidth={2.5}
                dot={(dotProps: Record<string, unknown>) => (
                  <ActualDot
                    key={String(dotProps.key ?? "")}
                    cx={dotProps.cx as number | undefined}
                    cy={dotProps.cy as number | undefined}
                    payload={dotProps.payload as ChartPoint | undefined}
                    color={COLOR_WEIGHT}
                  />
                )}
                activeDot={{ r: 7, fill: COLOR_WEIGHT, stroke: "white", strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive={true}
                animationDuration={900}
                animationEasing="ease-out"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── 범례 ── */}
      <div className="flex items-center gap-4 mt-3 text-xs text-text-tertiary justify-end pr-2">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-4 h-0.5"
            style={{ background: activeTab === "height" ? COLOR_HEIGHT : COLOR_WEIGHT }}
          />
          보간 곡선
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm"
            style={{ background: activeTab === "height" ? COLOR_HEIGHT : COLOR_WEIGHT }}
          />
          실측값
        </span>
      </div>
    </div>
  );
}
