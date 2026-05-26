import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get('tuitionpro_auth')?.value ?? request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await jwtVerify(token, JWT_SECRET);

    const { id } = await params;
    const ann = await prisma.announcement.findUnique({ where: { id } });
    if (!ann) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Recreate notifications for users (same logic as publish)
    let users: any[] = [];
    if (ann.audience === 'ALL') {
      users = await prisma.user.findMany({ select: { id: true } });
    } else {
      users = await prisma.user.findMany({ where: { role: ann.audience as any }, select: { id: true } });
    }

    if (users.length === 0) return NextResponse.json({ message: 'No users' }, { status: 200 });

    const now = new Date().toISOString();
    for (const user of users) {
      await prisma.$executeRawUnsafe(
        'INSERT INTO notifications (id, "userId", title, message, type, "isRead", link, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        randomUUID(),
        user.id,
        ann.title,
        ann.message,
        'ANNOUNCEMENT',
        false,
        null,
        now,
        now
      );
    }

    return NextResponse.json({ message: 'Resent', count: users.length }, { status: 200 });
  } catch (error) {
    console.error('Resend error:', error);
    return NextResponse.json(
      { error: 'Internal server error', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
