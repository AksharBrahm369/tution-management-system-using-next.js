import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const userId = 'cmpauii3b0000hkubyr5yfgpj';
    console.log('Querying notifications for user:', userId);
    const notifs = await prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 10 });
    console.log('Found', notifs.length, 'notifications');
    console.log(JSON.stringify(notifs, null, 2));
  } catch (e) {
    console.error('DB query error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
