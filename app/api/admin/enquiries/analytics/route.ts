import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const sources = [
  "WALK_IN",
  "PHONE_CALL",
  "WHATSAPP",
  "WEBSITE",
  "SOCIAL_MEDIA",
  "REFERRAL",
  "NEWSPAPER",
  "PAMPHLET",
  "OTHER",
] as const;

function formatMonth(date: Date) {
  return date.toLocaleString("en-IN", { month: "short" });
}

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const now = new Date();
    const monthStarts = Array.from({ length: 6 }).map((_, index) => new Date(now.getFullYear(), now.getMonth() - (5 - index), 1));
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [sourceGroups, statusGroups, monthlyEnquiries, monthlyConversions] = await Promise.all([
      prisma.enquiry.groupBy({
        by: ["source"],
        _count: { _all: true },
      }),
      prisma.enquiry.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      Promise.all(
        monthStarts.map(async (start) => {
          const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
          const count = await prisma.enquiry.count({ where: { createdAt: { gte: start, lt: end } } });
          return { month: formatMonth(start), count, start };
        })
      ),
      Promise.all(
        monthStarts.map(async (start) => {
          const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
          const count = await prisma.enquiry.count({ where: { convertedAt: { gte: start, lt: end } } });
          return { month: formatMonth(start), count, start };
        })
      ),
    ]);

    const sourceAnalysis = sources.map((source) => ({
      name: source.replace(/_/g, " ").toLowerCase().replace(/(^|\s)\w/g, (letter) => letter.toUpperCase()),
      value: sourceGroups.find((group) => group.source === source)?._count._all ?? 0,
    }));

    const currentStatus = new Map(statusGroups.map((group) => [group.status, group._count._all]));
    const conversionFunnel = [
      { name: "New", value: currentStatus.get("NEW") ?? 0 },
      { name: "Contacted", value: currentStatus.get("CONTACTED") ?? 0 },
      { name: "Demo", value: (currentStatus.get("DEMO_SCHEDULED") ?? 0) + (currentStatus.get("DEMO_DONE") ?? 0) },
      { name: "Interested", value: currentStatus.get("INTERESTED") ?? 0 },
      { name: "Converted", value: currentStatus.get("CONVERTED") ?? 0 },
    ];

    const monthlyTrend = monthStarts.map((start, index) => ({
      month: formatMonth(start),
      enquiries: monthlyEnquiries[index]?.count ?? 0,
      conversions: monthlyConversions[index]?.count ?? 0,
    }));

    const withRates = monthStarts.map((start, index) => {
      const enquiries = monthlyEnquiries[index]?.count ?? 0;
      const conversions = monthlyConversions[index]?.count ?? 0;
      return {
        month: formatMonth(start),
        rate: enquiries > 0 ? (conversions / enquiries) * 100 : 0,
      };
    });

    const thisMonth = withRates[withRates.length - 1]?.rate ?? 0;
    const lastMonth = withRates[withRates.length - 2]?.rate ?? 0;
    const bestMonthEntry = withRates.reduce<{ month: string; rate: number }>((best, item) => (item.rate > best.rate ? item : best), withRates[0] ?? { month: "", rate: 0 });

    return NextResponse.json({
      sourceAnalysis,
      conversionFunnel,
      monthlyTrend,
      conversionRate: {
        thisMonth: Number(thisMonth.toFixed(1)),
        lastMonth: Number(lastMonth.toFixed(1)),
        bestMonth: Number(bestMonthEntry.rate.toFixed(1)),
        bestMonthName: bestMonthEntry.month,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
