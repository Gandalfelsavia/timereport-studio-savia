"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatHours } from "@/lib/format";

// Palette categorica validata (vedi skill dataviz): 7 tinte fisse in ordine
// fisso, più un grigio neutro per "Altro" quando le categorie superano il
// numero di tinte disponibili.
const CATEGORY_COLORS = [
  "#2a78d6", // blu
  "#eb6834", // arancio
  "#1baf7a", // acqua
  "#eda100", // giallo
  "#e87ba4", // magenta
  "#008300", // verde
  "#4a3aa7", // viola
];
const OTHER_COLOR = "#94a3b8";
const MAX_CATEGORIES = CATEGORY_COLORS.length;

export function CategoryBreakdownChart({
  data,
}: {
  data: { categoryName: string; hours: number }[];
}) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">Nessuna attività in questo periodo.</p>;
  }

  const sorted = [...data].sort((a, b) => b.hours - a.hours);
  const top = sorted.slice(0, MAX_CATEGORIES);
  const rest = sorted.slice(MAX_CATEGORIES);
  const restHours = rest.reduce((s, c) => s + c.hours, 0);
  const chartData = top.map((c, i) => ({ ...c, fill: CATEGORY_COLORS[i] }));
  if (restHours > 0) {
    chartData.push({ categoryName: "Altro", hours: restHours, fill: OTHER_COLOR });
  }

  // Recharts disegna le barre orizzontali dal basso verso l'alto: invertiamo
  // l'ordine così la categoria con più ore appare in cima.
  const displayData = [...chartData].reverse();

  const rowHeight = 32;
  const height = Math.max(120, displayData.length * rowHeight + 40);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={displayData}
        layout="vertical"
        margin={{ top: 8, right: 24, bottom: 8, left: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <YAxis
          type="category"
          dataKey="categoryName"
          width={160}
          tick={{ fontSize: 12 }}
          stroke="#94a3b8"
        />
        <Tooltip formatter={(value) => formatHours(Number(value))} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey="hours" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {displayData.map((entry) => (
            <Cell key={entry.categoryName} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
