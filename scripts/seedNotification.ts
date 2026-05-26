import prisma from '../lib/prisma';

async function main() {
  try {
    const userId = 'cmpauii3b0000hkubyr5yfgpj';
    const notif = await prisma.notification.create({
      data: {
        userId,
        title: 'Test Announcement - Automation',
        message: 'This is a seeded test announcement for automated checks.',
        type: 'ANNOUNCEMENT',
        isRead: false,
        link: '/admin/communication',
      },
    });
    console.log('Created notification:', notif.id);
  } catch (e) {
    console.error('Error creating notification:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
