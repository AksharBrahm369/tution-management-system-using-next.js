// Script to check and fix Hiren's admin login
// Run with: node scratch/fix-hiren-login.js

const fs = require('fs');
const path = require('path');

// Load .env manually BEFORE importing Prisma
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
  console.log('✅ Loaded .env, DATABASE_URL present:', !!process.env.DATABASE_URL);
}

const { PrismaClient } = require('../node_modules/@prisma/client');
const bcrypt = require('../node_modules/bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'hiren@gmail.com';
  const newPassword = 'Hiren@369';

  console.log('\n=== Checking user:', email, '===');
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.log('❌ User not found in database. Creating...');
    
    const institute = await prisma.institute.findFirst();
    if (!institute) {
      console.log('❌ No institute found. Cannot create user.');
      return;
    }
    
    const hash = await bcrypt.hash(newPassword, 12);
    const newUser = await prisma.user.create({
      data: {
        name: 'Hiren',
        email,
        password: hash,
        role: 'SUPER_ADMIN',
        isActive: true,
        isVerified: true,
        instituteId: institute.id,
      },
    });
    
    await prisma.account.create({
      data: {
        accountId: newUser.id,
        providerId: 'credential',
        userId: newUser.id,
        password: hash,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    
    console.log('✅ User created successfully:', newUser.id);
    return;
  }

  console.log('✅ User found:', user.id);
  console.log('   role:', user.role);
  console.log('   isActive:', user.isActive);
  console.log('   isVerified:', user.isVerified);
  console.log('   instituteId:', user.instituteId);
  console.log('   hasPassword:', !!user.password);

  const account = await prisma.account.findFirst({
    where: { userId: user.id, providerId: 'credential' },
  });
  
  console.log('\n=== BetterAuth Account ===');
  if (!account) {
    console.log('❌ No credential account found. Creating with new hash...');
    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.account.create({
      data: {
        accountId: user.id,
        providerId: 'credential',
        userId: user.id,
        password: hash,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    await prisma.user.update({ where: { id: user.id }, data: { password: hash } });
    console.log('✅ Account created and password set to Hiren@369');
  } else {
    console.log('✅ Account found:', account.id);
    console.log('   hasPassword:', !!account.password);
    
    if (account.password) {
      const match = await bcrypt.compare(newPassword, account.password);
      console.log('   password matches "Hiren@369":', match);
      
      if (!match) {
        console.log('❌ Password mismatch → resetting...');
        const newHash = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({ where: { id: user.id }, data: { password: newHash } });
        await prisma.account.update({ where: { id: account.id }, data: { password: newHash } });
        console.log('✅ Password reset to Hiren@369');
      } else {
        console.log('✅ Password is correct!');
      }
    } else {
      console.log('❌ Account has no password → setting...');
      const newHash = await bcrypt.hash(newPassword, 12);
      await prisma.account.update({ where: { id: account.id }, data: { password: newHash } });
      await prisma.user.update({ where: { id: user.id }, data: { password: newHash } });
      console.log('✅ Password set to Hiren@369');
    }
  }

  if (!user.isActive || !user.instituteId) {
    const institute = await prisma.institute.findFirst();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: true,
        isVerified: true,
        role: 'SUPER_ADMIN',
        ...((!user.instituteId && institute) ? { instituteId: institute.id } : {}),
      },
    });
    console.log('✅ User activated and assigned institute.');
  }

  console.log('\n✅ Done. Try logging in with hiren@gmail.com / Hiren@369');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
