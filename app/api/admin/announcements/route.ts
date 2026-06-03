import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import {
  createAnnouncementNotifications,
  deliverAnnouncementToContacts,
  parseAnnouncementChannels,
  resolveAnnouncementRecipients,
  serializeAnnouncementChannels,
} from '@/lib/announcementDelivery';

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
    const { title, message, audience = 'STUDENT', channels = null, scheduleAt = null } = body;
    const serializedChannels = serializeAnnouncementChannels(channels);

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    // Use raw SQL insert to avoid Prisma client input mismatches
    const now = new Date();
    const id = crypto.randomUUID();
    const inserted: any = await prisma.$queryRaw`
      INSERT INTO announcements (id, "userId", title, message, audience, channels, "scheduleAt", status, "createdAt", "updatedAt")
      VALUES (${id}, ${userId}, ${title.trim()}, ${message.trim()}, ${audience}, ${serializedChannels}, ${scheduleAt ? new Date(scheduleAt) : null}, ${scheduleAt ? 'SCHEDULED' : 'PUBLISHED'}, ${now}, ${now})
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

  const channels = parseAnnouncementChannels(ann.channels);
  const recipients = await resolveAnnouncementRecipients(ann);
  await createAnnouncementNotifications(ann, recipients.userIds);
  await deliverAnnouncementToContacts(ann, channels, recipients.contacts);

  // mark announcement as published via raw SQL
  await prisma.$queryRaw`UPDATE announcements SET status = 'PUBLISHED', "updatedAt" = ${new Date()} WHERE id = ${announcementId}`;
}
