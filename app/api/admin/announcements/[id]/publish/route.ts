import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  createAnnouncementNotifications,
  deliverAnnouncementToContacts,
  parseAnnouncementChannels,
  resolveAnnouncementRecipients,
} from '@/lib/announcementDelivery';

import { requireAdmin, getRouteErrorStatus } from "@/lib/roleAuth";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);

    const { id } = await params;
    const ann = await prisma.announcement.findUnique({ where: { id } });
    if (!ann) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const channels = parseAnnouncementChannels(ann.channels);
    const recipients = await resolveAnnouncementRecipients(ann);
    const notificationCount = channels.includes("IN_APP")
      ? await createAnnouncementNotifications(ann, recipients.userIds)
      : 0;
    const delivery = await deliverAnnouncementToContacts(ann, channels, recipients.contacts);
    await prisma.announcement.update({ where: { id }, data: { status: 'PUBLISHED' } });

    return NextResponse.json({ message: 'Published', count: notificationCount, delivery }, { status: 200 });
  } catch (error) {
    console.error('Publish error:', error);
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}
