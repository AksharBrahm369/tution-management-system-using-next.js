import prisma from '../lib/prisma';

async function main() {
  try {
    const cols: any = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'announcements'`;
    console.log(cols);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
