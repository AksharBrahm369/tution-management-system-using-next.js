import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function main() {
  const hash = await bcrypt.hash("Darshan@369", 12);
  const result = await prisma.user.updateMany({
    where: { role: "SUPER_ADMIN" },
    data: {
      email: "darshanzala369@gmail.com",
      password: hash,
      name: "Darshan Zala",
      isActive: true,
      isVerified: true,
    },
  });

  if (result.count === 0) {
    await prisma.user.create({
      data: {
        name: "Darshan Zala",
        email: "darshanzala369@gmail.com",
        password: hash,
        role: "SUPER_ADMIN",
        isActive: true,
        isVerified: true,
      },
    });
    console.log("Created super admin: darshanzala369@gmail.com");
    return;
  }

  console.log(`Updated ${result.count} super admin user(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
