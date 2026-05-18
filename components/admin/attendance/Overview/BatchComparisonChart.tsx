'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BatchData {
  batchName: string;
  percentage: number;
}

interface ComparisonChartProps {
  data?: BatchData[];
}

export default function BatchComparisonChart({ data }: ComparisonChartProps) {
  const chartData = data || [
    { batchName: 'Class 10 - Math', percentage: 85 },
    { batchName: 'Class 9 - Physics', percentage: 78 },
    { batchName: 'Class 11 - Chemistry', percentage: 82 },
    { batchName: 'Class 12 - English', percentage: 76 },
  ];

  const getBarColor = (percentage: number) => {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Batch-wise This Month</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis 
              type="number"
              domain={[0, 100]}
              stroke="var(--foreground)"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              dataKey="batchName"
              type="category"
              stroke="var(--foreground)"
              style={{ fontSize: '11px' }}
              width={140}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
              }}
              formatter={(value) => [`${value}%`, 'Attendance']}
            />
            <Bar 
              dataKey="percentage" 
              fill="#3b82f6"
              shape={<CustomBar />}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function CustomBar(props: any) {
  const { x, y, width, height, value } = props;
  const color = 
    value >= 80 ? '#10b981' : 
    value >= 60 ? '#f59e0b' : 
    '#ef4444';
  
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={color}
      rx={4}
      ry={4}
    />
  );
}
