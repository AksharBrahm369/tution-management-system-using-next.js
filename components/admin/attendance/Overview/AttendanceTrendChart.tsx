'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TrendData {
  date: string;
  percentage: number;
}

interface TrendChartProps {
  data?: TrendData[];
}

export default function AttendanceTrendChart({ data }: TrendChartProps) {
  // Mock data for last 7 days if not provided
  const chartData = data || [
    { date: 'Mon', percentage: 82 },
    { date: 'Tue', percentage: 85 },
    { date: 'Wed', percentage: 78 },
    { date: 'Thu', percentage: 88 },
    { date: 'Fri', percentage: 81 },
    { date: 'Sat', percentage: 76 },
    { date: 'Sun', percentage: 79 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Last 7 Days Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis 
              dataKey="date" 
              stroke="var(--foreground)"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="var(--foreground)"
              domain={[0, 100]}
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
              }}
              formatter={(value) => [`${value}%`, 'Attendance']}
            />
            <Line
              type="monotone"
              dataKey="percentage"
              stroke="#10b981"
              dot={{ fill: '#10b981', r: 5 }}
              activeDot={{ r: 7 }}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
