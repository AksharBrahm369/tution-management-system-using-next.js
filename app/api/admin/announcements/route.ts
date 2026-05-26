import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function GET() {
  try {
    const list: any = await prisma.$queryRaw`
      SELECT id, "userId", title, message, audience, channels, "scheduleAt", status, "createdAt", "updatedAt"
      FROM announcements
      ORDER BY "createdAt" DESC
      LIMIT 50
    `;
    return NextResponse.json(list, { status: 200 });
  } catch (error) {
    console.error('List announcements error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("tuitionpro_auth")?.value ?? request.cookies.get('auth-token')?.value;
    console.log('[announcements] POST incoming. auth-token/tuitionpro_auth present:', !!token);
    if (!token) return NextResponse.json({ error: 'Unauthorized: missing auth-token or tuitionpro_auth cookie' }, { status: 401 });

    let payload: any;
    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      payload = verified.payload;
    } catch (err) {
      console.error('[announcements] JWT verify failed:', err);
      return NextResponse.json({ error: 'Unauthorized: invalid token', detail: err instanceof Error ? err.message : String(err) }, { status: 401 });
    }

    const userId = payload.sub as string;
    if (!userId) return NextResponse.json({ error: 'Unauthorized: token missing sub claim' }, { status: 401 });

    const body = await request.json();
    console.log('[announcements] body:', body);
    const { title, message, audience = 'ALL', channels = null, scheduleAt = null } = body;

    // Use raw SQL insert to avoid Prisma client input mismatches
    const now = new Date();
    const id = crypto.randomUUID();
    const inserted: any = await prisma.$queryRaw`
      INSERT INTO announcements (id, "userId", title, message, audience, channels, "scheduleAt", status, "createdAt", "updatedAt")
      VALUES (${id}, ${userId}, ${title}, ${message}, ${audience}, ${channels}, ${scheduleAt ? new Date(scheduleAt) : null}, ${scheduleAt ? 'SCHEDULED' : 'PUBLISHED'}, ${now}, ${now})
      RETURNING *
    `;
    const created = Array.isArray(inserted) ? inserted[0] : inserted;

    // If immediate publish, create notifications for audience
    if (!scheduleAt) {
      try {
        await publishAnnouncement(created.id);
      } catch (err) {
        console.error('[announcements] publish failed:', err);
        return NextResponse.json({ error: 'Publish failed', detail: err instanceof Error ? err.message : String(err) }, { status: 500 });
      }
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Create announcement error:', error);
    return NextResponse.json({ error: 'Internal server error', detail: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

async function publishAnnouncement(announcementId: string) {
  const rows: any = await prisma.$queryRaw`SELECT * FROM announcements WHERE id = ${announcementId}`;
  const ann = Array.isArray(rows) ? rows[0] : rows;
  if (!ann) throw new Error('Announcement not found');

  // Resolve audience to userIds
  let users = [] as any[];
  if (ann.audience === 'ALL') {
    users = await prisma.user.findMany({ select: { id: true } });
  } else {
    // treat audience as Role name
    users = await prisma.user.findMany({ where: { role: ann.audience as any }, select: { id: true } });
  }

  if (users.length === 0) return;

  const now = new Date();
  const notifications = users.map((u) => ({ id: undefined as any, userId: u.id, title: ann.title, message: ann.message, type: 'ANNOUNCEMENT', isRead: false, link: null, createdAt: now, updatedAt: now }));

  // Insert notifications via raw SQL to avoid Prisma client/DB mismatches
  for (const n of notifications) {
    const nid = crypto.randomUUID();
    await prisma.$queryRaw`
      INSERT INTO notifications (id, "userId", title, message, type, "isRead", link, "createdAt", "updatedAt", "studentId")
      VALUES (${nid}, ${n.userId}, ${n.title}, ${n.message}, ${n.type}, ${n.isRead}, ${n.link ?? null}, ${n.createdAt}, ${n.updatedAt}, ${null})
    `;
  }

  // mark announcement as published via raw SQL
  await prisma.$queryRaw`UPDATE announcements SET status = 'PUBLISHED', "updatedAt" = ${new Date()} WHERE id = ${announcementId}`;
}
