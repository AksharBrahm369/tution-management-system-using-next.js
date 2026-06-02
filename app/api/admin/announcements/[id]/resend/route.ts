import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import {
  createAnnouncementNotifications,
  deliverAnnouncementToContacts,
  parseAnnouncementChannels,
  resolveAnnouncementRecipients,
} from '@/lib/announcementDelivery';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get('tuitionpro_auth')?.value ?? request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await jwtVerify(token, JWT_SECRET);

    const { id } = await params;
    const ann = await prisma.announcement.findUnique({ where: { id } });
    if (!ann) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const channels = parseAnnouncementChannels(ann.channels);
    const recipients = await resolveAnnouncementRecipients(ann);
    const notificationCount = await createAnnouncementNotifications(ann, recipients.userIds);
    const delivery = await deliverAnnouncementToContacts(ann, channels, recipients.contacts);

    return NextResponse.json({ message: 'Resent', count: notificationCount, delivery }, { status: 200 });
  } catch (error) {
    console.error('Resend error:', error);
    return NextResponse.json(
      { error: 'Internal server error', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
