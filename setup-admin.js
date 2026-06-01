const { prisma } = require("./.next/server/app/api/auth/login/route.js") || require("./lib/prisma");
const bcrypt = require("bcryptjs");

async function main() {
  // Clear all users
  await prisma.user.deleteMany({});
  console.log("All existing users cleared.");

  // Create the requested Super Admin
  const hashedPassword = await bcrypt.hash("Darshan@369", 12);
  const user = await prisma.user.create({
    data: {
      name: "Darshan Zala",
      email: "darshanzala369@gmail.com",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      isActive: true,
      isVerified: true
    }
  });

  console.log("Super admin created:", user.email);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
