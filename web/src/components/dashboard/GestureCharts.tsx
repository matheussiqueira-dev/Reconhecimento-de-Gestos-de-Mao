"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const distribution = [
  { gesture: "Palma", count: 42 },
  { gesture: "Punho", count: 18 },
  { gesture: "Paz", count: 15 },
  { gesture: "Joinha", count: 11 },
  { gesture: "Rock", count: 7 },
];

const performance = [
  { second: "0s", fps: 48, confidence: 88 },
  { second: "10s", fps: 54, confidence: 91 },
  { second: "20s", fps: 57, confidence: 94 },
  { second: "30s", fps: 59, confidence: 96 },
  { second: "40s", fps: 58, confidence: 95 },
  { second: "50s", fps: 60, confidence: 97 },
];

export function DistributionChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={distribution}>
        <CartesianGrid stroke="#d8e0e7" vertical={false} />
        <XAxis dataKey="gesture" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" fill="#0f766e" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PerformanceChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={performance}>
        <CartesianGrid stroke="#d8e0e7" vertical={false} />
        <XAxis dataKey="second" />
        <YAxis />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="fps"
          stroke="#2563eb"
          fill="#bfdbfe"
          strokeWidth={3}
        />
        <Area
          type="monotone"
          dataKey="confidence"
          stroke="#d97706"
          fill="#fed7aa"
          strokeWidth={3}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
