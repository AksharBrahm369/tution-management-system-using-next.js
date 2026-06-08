"use client";

import React from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function ScoreDistributionChart({ scores }: { scores: number[] }) {
  const buckets = Array.from({ length: 10 }, (_, index) => {
    const min = index * 10;
    const max = index === 9 ? 100 : min + 9;
    return { range: `${min}-${max}`, count: scores.filter((score) => score >= min && score <= max).length };
  });
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={buckets}>
          <XAxis dataKey="range" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
