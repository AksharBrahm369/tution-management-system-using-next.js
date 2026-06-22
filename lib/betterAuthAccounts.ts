import { prisma } from "@/lib/prisma";

export async function upsertCredentialAccount(
  userId: string,
  passwordHash: string
) {
  await prisma.account.upsert({
    where: {
      providerId_accountId: {
        providerId: "credential",
        accountId: userId,
      },
    },
    update: {
      password: passwordHash,
    },
    create: {
      userId,
      accountId: userId,
      providerId: "credential",
      password: passwordHash,
    },
  });
}

export async function ensureCredentialAccount(
  userId: string,
  passwordHash: string
) {
  const account = await prisma.account.findUnique({
    where: {
      providerId_accountId: {
        providerId: "credential",
        accountId: userId,
      },
    },
    select: { id: true },
  });

  if (account) return;
  await upsertCredentialAccount(userId, passwordHash);
}
