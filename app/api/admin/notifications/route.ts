import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('tuitionpro_auth')?.value ?? request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.sub as string;

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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
