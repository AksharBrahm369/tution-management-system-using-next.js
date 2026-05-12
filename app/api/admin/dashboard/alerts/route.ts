import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    // Fetch actual alerts from database
    const alerts = await prisma.dashboardAlert.findMany({
      where: { isResolved: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const formattedAlerts = alerts.map((alert) => ({
      id: alert.id,
      type: alert.type,
      message: alert.message,
      severity: alert.severity,
      createdAt: alert.createdAt,
    }));

    return NextResponse.json(formattedAlerts, { status: 200 });
  } catch (error) {
    console.error('Alerts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
