"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatHours } from "@/lib/format";

const BAR_COLOR = "#0f172a";
const BAR_COLOR_SECONDARY = "#64748b";

export function RevenueByCollaboratorChart({
  data,
}: {
  data: { name: string; revenue: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value))}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Bar dataKey="revenue" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function HoursByClientChart({ data }: { data: { name: string; hours: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <Tooltip formatter={(value) => formatHours(Number(value))} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey="hours" fill={BAR_COLOR_SECONDARY} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
