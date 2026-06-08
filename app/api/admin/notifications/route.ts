import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

import { requireAdmin, getRouteErrorStatus } from "@/lib/roleAuth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    const userId = auth.userId;

    // Fetch user notifications using raw SQL to avoid Prisma client/DB schema mismatch
    const notifications: any = await prisma.$queryRaw`
      SELECT id, "userId", title, message, type, "isRead", link, "createdAt", "updatedAt", "studentId"
      FROM notifications
      WHERE "userId" = ${userId}
      ORDER BY "createdAt" DESC
      LIMIT 10
    `;

    return NextResponse.json(notifications, { status: 200 });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}
