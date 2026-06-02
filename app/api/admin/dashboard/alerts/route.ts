import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
};

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    try {
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

      return NextResponse.json(formattedAlerts, { status: 200, headers: NO_STORE_HEADERS });
    } catch (dashboardError) {
      console.error('Alerts query error:', dashboardError);
      return NextResponse.json([], { status: 200, headers: NO_STORE_HEADERS });
    }
  } catch (error) {
    console.error('Alerts error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.startsWith('Forbidden')
      ? 403
      : message.startsWith('Unauthorized')
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS });
  }
}
