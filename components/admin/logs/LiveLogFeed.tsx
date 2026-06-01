"use client";

import { useEffect, useRef } from "react";
import type { ActivityLogRow } from "@/types/activityLog";

interface LiveLogFeedProps {
  enabled: boolean;
  onNewLogs: (logs: ActivityLogRow[]) => void;
}

export default function LiveLogFeed({ enabled, onNewLogs }: LiveLogFeedProps) {
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled) {
      abortRef.current?.abort();
      abortRef.current = null;
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    let since = new Date().toISOString();

    const run = async () => {
      while (!controller.signal.aborted) {
        try {
          const res = await fetch("/api/admin/logs/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ since }),
            credentials: "same-origin",
            signal: controller.signal,
          });

          if (!res.ok || !res.body) {
            await sleep(10_000);
            continue;
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (!controller.signal.aborted) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split("\n\n");
            buffer = parts.pop() ?? "";

            for (const part of parts) {
              const lines = part.split("\n");
              let event = "message";
              let dataLine = "";
              for (const line of lines) {
                if (line.startsWith("event: ")) event = line.slice(7);
                if (line.startsWith("data: ")) dataLine = line.slice(6);
              }
              if (!dataLine) continue;

              try {
                const payload = JSON.parse(dataLine) as {
                  logs?: ActivityLogRow[];
                  since?: string;
                };
                if (event === "logs" && payload.logs?.length) {
                  onNewLogs(payload.logs);
                  const newest = payload.logs[0]?.createdAt;
                  if (newest) since = newest;
                }
              } catch {
                /* ignore parse errors */
              }
            }
          }
        } catch {
          if (!controller.signal.aborted) {
            await sleep(10_000);
          }
        }
      }
    };

    void run();

    return () => {
      controller.abort();
    };
  }, [enabled, onNewLogs]);

  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
