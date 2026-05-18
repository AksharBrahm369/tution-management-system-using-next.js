'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Users, Clock, AlertCircle, BarChart3, Percent } from 'lucide-react';

interface StatsCardsProps {
  data?: {
    overallPercentage: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    onLeaveCount: number;
    notifiedCount: number;
    lowAttendanceAlerts: number;
    monthlyAverage: number;
  };
  isLoading?: boolean;
}

export default function AttendanceStatsCards({ data, isLoading }: StatsCardsProps) {
  if (isLoading || !data) {
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="pt-6 h-[140px]" />
        </Card>
      ))}
    </div>;
  }

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPercentageBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-50 dark:bg-green-950';
    if (percentage >= 60) return 'bg-yellow-50 dark:bg-yellow-950';
    return 'bg-red-50 dark:bg-red-950';
  };

  const cards = [
    {
      title: "Today's Overall Attendance",
      icon: Percent,
      value: `${data.overallPercentage}%`,
      description: `${data.presentCount} present out of ${data.presentCount + data.absentCount + data.lateCount + data.onLeaveCount}`,
      colorClass: getPercentageColor(data.overallPercentage),
      bgClass: getPercentageBgColor(data.overallPercentage),
    },
    {
      title: "Present Today",
      icon: Users,
      value: data.presentCount.toString(),
      description: "Across all batches",
      colorClass: 'text-green-600',
      bgClass: 'bg-green-50 dark:bg-green-950',
    },
    {
      title: "Absent Today",
      icon: AlertCircle,
      value: data.absentCount.toString(),
      description: `Parents notified: ${data.notifiedCount ?? 0}`,
      colorClass: 'text-red-600',
      bgClass: 'bg-red-50 dark:bg-red-950',
    },
    {
      title: "Late Today",
      icon: Clock,
      value: data.lateCount.toString(),
      description: `${data.onLeaveCount} on leave`,
      colorClass: 'text-orange-600',
      bgClass: 'bg-orange-50 dark:bg-orange-950',
    },
    {
      title: "Low Attendance Alerts",
      icon: AlertCircle,
      value: data.lowAttendanceAlerts.toString(),
      description: "Needs immediate attention",
      colorClass: 'text-red-600',
      bgClass: 'bg-red-50 dark:bg-red-950',
    },
    {
      title: "Monthly Average",
      icon: BarChart3,
      value: `${data.monthlyAverage}%`,
      description: "This month",
      colorClass: 'text-blue-600',
      bgClass: 'bg-blue-50 dark:bg-blue-950',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className={`w-12 h-12 rounded-lg ${card.bgClass} flex items-center justify-center mb-4`}>
                <Icon className={`h-6 w-6 ${card.colorClass}`} />
              </div>
              <p className="text-sm text-muted-foreground font-medium">{card.title}</p>
              <p className={`text-2xl font-bold my-2 ${card.colorClass}`}>{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
