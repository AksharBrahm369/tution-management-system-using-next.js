import { NextRequest } from "next/server";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { serializeActivityLog } from "@/lib/activityLogQuery";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const body = await request.json().catch(() => ({}));
    const since =
      typeof body.since === "string" && body.since
        ? new Date(body.since)
        : new Date(Date.now() - 10_000);

    const encoder = new TextEncoder();
    let closed = false;

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          if (closed) return;
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        send("connected", { since: since.toISOString() });

        const poll = async () => {
          while (!closed) {
            try {
              const logs = await prisma.activityLog.findMany({
                where: { createdAt: { gt: since } },
                orderBy: { createdAt: "desc" },
                take: 20,
              });

              if (logs.length) {
                const newest = logs[0].createdAt;
                since.setTime(newest.getTime());
                send("logs", { logs: logs.map(serializeActivityLog) });
              }

              await new Promise((r) => setTimeout(r, 10_000));
            } catch (err) {
              send("error", {
                message: err instanceof Error ? err.message : "Stream error",
              });
              await new Promise((r) => setTimeout(r, 10_000));
            }
          }
        };

        void poll();

        request.signal.addEventListener("abort", () => {
          closed = true;
          controller.close();
        });
      },
      cancel() {
        closed = true;
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return new Response(JSON.stringify({ error: message }), {
      status: message.startsWith("Unauthorized") ? 401 : 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
