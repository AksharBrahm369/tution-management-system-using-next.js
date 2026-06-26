import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { nextCookies } from "better-auth/next-js";
import bcryptjs from "bcryptjs";
import { basePrisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/passwordResetEmail";

const appUrl =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

// Restrict CORS to known origins only – never wildcard in production
const trustedOrigins = [
  appUrl,
  "https://tution-management-system-using-next-nine.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
].filter(Boolean) as string[];

export const auth = betterAuth({
  baseURL: appUrl,
  trustedOrigins,
  secret:
    process.env.BETTER_AUTH_SECRET ||
    process.env.JWT_SECRET ||
    "fallback-secret-for-dev-only-replace-in-production",
  database: prismaAdapter(basePrisma, {
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
      await basePrisma.user.update({
        where: { id: user.id },
        data: { updatedAt: new Date() },
      });
    },
  },
  plugins: [nextCookies()],
});
