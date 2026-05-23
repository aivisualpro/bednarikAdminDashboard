"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import type { EmailScorecard } from "@/lib/types";

interface CallsTrendChartProps {
  data: EmailScorecard[];
  title: string;
}

const USER_COLORS = [
  "#111827", "#059669", "#2563EB", "#D97706", "#7C3AED",
  "#DC2626", "#0891B2", "#4F46E5", "#B91C1C", "#065F46",
];

function getWeekLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  return `${month} ${day}`;
}

function buildStackedData(data: EmailScorecard[]) {
  // Get unique users
  const userSet = new Set<string>();
  for (const row of data) {
    if (row.user) userSet.add(row.user);
  }
  const users = Array.from(userSet).sort();

  // Group by week (startDate)
  const weekMap = new Map<string, { label: string; [key: string]: number | string }>();

  for (const row of data) {
    const key = row.startDate;
    if (!weekMap.has(key)) {
      const label = `${getWeekLabel(row.startDate)} – ${getWeekLabel(row.endDate)}`;
      const entry: Record<string, number | string> = { week: label, _sort: key };
      for (const u of users) entry[u] = 0;
      weekMap.set(key, entry as { label: string; [key: string]: number | string });
    }
    const w = weekMap.get(key)!;
    w[row.user] = (Number(w[row.user]) || 0) + row.callsTotal;
  }

  const chartData = Array.from(weekMap.values()).sort((a, b) =>
    String(a._sort).localeCompare(String(b._sort))
  );

  // Remove sort key
  for (const d of chartData) delete d._sort;

  return { chartData, users };
}

export default function CallsTrendChart({ data, title }: CallsTrendChartProps) {
  const { chartData, users } = buildStackedData(data);

  if (chartData.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={360}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 16, left: 0, bottom: 4 }}
          barCategoryGap="15%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11, fill: "#6B7280" }}
            axisLine={{ stroke: "#E5E7EB" }}
            tickLine={false}
            angle={-25}
            textAnchor="end"
            height={55}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#6B7280" }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              fontSize: "13px",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
            }}
            cursor={{ fill: "#F9FAFB" }}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
            iconType="rect"
            iconSize={10}
          />
          {users.map((user, i) => (
            <Bar
              key={user}
              dataKey={user}
              name={user}
              stackId="calls"
              fill={USER_COLORS[i % USER_COLORS.length]}
              radius={i === users.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
            >
              {i === users.length - 1 && (
                <LabelList
                  valueAccessor={((entry: Record<string, number | string>) => {
                    let total = 0;
                    for (const u of users) total += Number(entry[u]) || 0;
                    return total;
                  }) as never}
                  position="top"
                  style={{ fontSize: 11, fill: "#374151", fontWeight: 600 }}
                  formatter={((v: never) => (Number(v) > 0 ? Number(v).toLocaleString() : "")) as never}
                />
              )}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
