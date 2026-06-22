import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const EMAIL = "hiren@gmail.com";
const PASSWORD = "Hiren@369";
const NAME = "Hiren";

async function main() {
  console.log("=== Fixing Hiren admin login ===\n");

  let user = await prisma.user.findUnique({ where: { email: EMAIL } });
  const newHash = await bcrypt.hash(PASSWORD, 12);

  if (!user) {
    console.log("❌ User not found. Creating...");
    const institute = await prisma.institute.findFirst();
    if (!institute) {
      console.error("❌ No institute found in DB. Cannot create user.");
      return;
    }
    user = await prisma.user.create({
      data: {
        name: NAME,
        email: EMAIL,
        password: newHash,
        role: "SUPER_ADMIN",
        isActive: true,
        isVerified: true,
        instituteId: institute.id,
      },
    });
    console.log("✅ User created:", user.id);
  } else {
    console.log("✅ User found:", user.id);
    console.log("   role:", user.role);
    console.log("   isActive:", user.isActive);
    console.log("   instituteId:", user.instituteId);

    // Ensure user is active and is SUPER_ADMIN
    const institute = user.instituteId ? null : await prisma.institute.findFirst();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: newHash,
        isActive: true,
        isVerified: true,
        role: "SUPER_ADMIN",
        ...(institute ? { instituteId: institute.id } : {}),
      },
    });
    console.log("✅ User updated (password reset, isActive=true, role=SUPER_ADMIN)");
  }

  // Fix BetterAuth credential account
  const account = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
  });

  if (!account) {
    console.log("❌ No BetterAuth account found. Creating...");
    await prisma.account.create({
      data: {
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: newHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log("✅ Account created.");
  } else {
    const wasMatch = account.password ? await bcrypt.compare(PASSWORD, account.password) : false;
    console.log(`   Account password was correct: ${wasMatch}`);
    await prisma.account.update({
      where: { id: account.id },
      data: { password: newHash, updatedAt: new Date() },
    });
    console.log("✅ Account password synced.");
  }

  console.log(`\n✅ Done! Login: ${EMAIL} / ${PASSWORD}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
