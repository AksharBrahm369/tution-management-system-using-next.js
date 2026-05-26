import prisma from '../lib/prisma';

async function main(){
  const info = await prisma.$queryRaw`SELECT column_name, column_default, is_nullable FROM information_schema.columns WHERE table_name = 'announcements'`;
  console.log(info);
  await prisma.$disconnect();
}

main();
