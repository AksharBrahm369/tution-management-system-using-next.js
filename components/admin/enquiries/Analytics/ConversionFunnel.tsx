"use client";

import { Funnel, FunnelChart, LabelList, ResponsiveContainer, Tooltip } from "recharts";

interface ConversionFunnelProps {
  data: Array<{ name: string; value: number }>;
}

export default function ConversionFunnel({ data }: ConversionFunnelProps) {
  const funnelData = data.map((item) => ({ ...item, fill: "#0f172a" }));

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Conversion Funnel</h3>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart>
            <Tooltip />
            <Funnel dataKey="value" data={funnelData} isAnimationActive>
              <LabelList position="right" fill="#475569" stroke="none" dataKey="name" />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
