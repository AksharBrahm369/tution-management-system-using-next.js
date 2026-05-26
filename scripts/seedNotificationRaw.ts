import prisma from '../lib/prisma';
import { randomUUID } from 'node:crypto';

async function main() {
  try {
    const userId = 'cmpauii3b0000hkubyr5yfgpj';
    const title = 'Test Announcement - Automation (raw)';
    const message = 'This is a seeded test announcement inserted via raw SQL.';
    const type = 'ANNOUNCEMENT';
    const isRead = false;
    const link = '/admin/communication';
    const createdAt = new Date().toISOString();

    const id = randomUUID();
    const sql = `INSERT INTO notifications (id, "userId", title, message, type, "isRead", link, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8) RETURNING id`;
    const res: any = await prisma.$queryRawUnsafe(sql, id, userId, title, message, type, isRead, link, createdAt);
    console.log('Inserted notification id:', res[0]?.id ?? res?.id ?? res);
  } catch (e) {
    console.error('Raw insert error:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
