import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { nextCookies } from "better-auth/next-js";
import bcryptjs from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/passwordResetEmail";

const appUrl =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

export const auth = betterAuth({
  baseURL: appUrl,
  secret:
    process.env.BETTER_AUTH_SECRET ||
    process.env.JWT_SECRET ||
    "fallback-secret-for-dev-only-replace-in-production",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
    transaction: true,
  }),
  user: {
    modelName: "user",
    fields: {
      emailVerified: "isVerified",
      image: "avatar",
    },
    additionalFields: {
      instituteId: {
        type: "string",
        required: false,
        input: false,
      },
      phone: {
        type: "string",
        required: false,
      },
      role: {
        type: ["SUPER_ADMIN", "TEACHER", "STUDENT", "PARENT"],
        required: false,
        defaultValue: "SUPER_ADMIN",
        input: false,
      },
      isActive: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
      },
      lastLogin: {
        type: "date",
        required: false,
        input: false,
      },
    },
  },
  session: {
    modelName: "session",
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    additionalFields: {
      instituteId: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
  account: {
    modelName: "account",
  },
  verification: {
    modelName: "verification",
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 8,
    maxPasswordLength: 100,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    password: {
      hash: (password) => bcryptjs.hash(password, 12),
      verify: ({ hash, password }) => bcryptjs.compare(password, hash),
    },
    sendResetPassword: async ({ user, token }) => {
      const resetUrl = new URL("/reset-password", appUrl);
      resetUrl.searchParams.set("token", token);

      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl: resetUrl.toString(),
      });
    },
    onPasswordReset: async ({ user }) => {
      await prisma.user.update({
        where: { id: user.id },
        data: { updatedAt: new Date() },
      });
    },
  },
  plugins: [nextCookies()],
});
