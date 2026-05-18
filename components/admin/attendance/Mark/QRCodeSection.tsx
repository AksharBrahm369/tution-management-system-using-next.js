"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Clock3, X, Copy } from "lucide-react";

export default function QRCodeSection({ batchId, date }: { batchId: string; date: string }) {
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState<{ qrCode: string; qrToken: string; expiresAt: string; sessionId?: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [presentCount, setPresentCount] = useState<number | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!qrData) return;

    // compute initial timeLeft
    const expires = new Date(qrData.expiresAt).getTime();
    const update = () => setTimeLeft(Math.max(0, Math.floor((expires - Date.now()) / 1000)));
    update();
    const ti = setInterval(update, 1000);

    // connect to SSE if we have sessionId
    if (qrData.sessionId) {
      try {
        const url = `/api/admin/attendance/live/${qrData.sessionId}`;
        const es = new EventSource(url);
        eventSourceRef.current = es;
        es.onmessage = (ev) => {
          try {
            const payload = JSON.parse(ev.data);
            if (payload.type === "attendance_marked") {
              setPresentCount(payload.totalPresent ?? null);
            }
            if (payload.type === "qr_deactivated") {
              // close
              es.close();
            }
          } catch (e) {
            // ignore
          }
        };
        es.onerror = () => {
          es.close();
        };
      } catch (e) {
        // ignore
      }
    }

    return () => {
      clearInterval(ti);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [qrData]);

  const generateQR = async () => {
    if (!batchId) return;
    setLoading(true);
    setQrData(null);
    setPresentCount(null);

    try {
      // Format date as ISO datetime if it's just a date string (YYYY-MM-DD)
      const formattedDate = date && !date.includes("T") ? `${date}T00:00:00.000Z` : date;

      const res = await fetch("/api/admin/attendance/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId, date: formattedDate }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || data?.error || "Failed to generate QR");

      setQrData(data.data ?? data);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const deactivate = async () => {
    if (!batchId) return;
    try {
      await fetch("/api/admin/attendance/qr/deactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId }),
      });
      setQrData(null);
      setPresentCount(null);
    } catch (e) {
      console.error(e);
    }
  };

  const copyToken = async () => {
    if (!qrData?.qrToken) return;
    try {
      await navigator.clipboard.writeText(qrData.qrToken);
      // small feedback
      // eslint-disable-next-line no-alert
      alert("QR token copied to clipboard");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">QR Attendance</CardTitle>
        <CardDescription>Generate a QR code for students to mark attendance.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-start gap-3">
          <div className="flex items-center gap-2">
            <Button onClick={generateQR} disabled={!batchId || loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Generate QR'}
            </Button>
            {qrData ? (
              <Button variant="outline" onClick={deactivate}>
                <X className="mr-2 h-4 w-4" /> Deactivate
              </Button>
            ) : null}
          </div>

          {qrData ? (
            <div className="w-full max-w-xs">
              <img src={qrData.qrCode} alt="QR code" className="w-full rounded-md border" />
              <div className="mt-2 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4" />
                  <span>{timeLeft}s</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Present: {presentCount ?? '-'}</span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Button variant="ghost" onClick={copyToken}>
                  <Copy className="mr-2 h-4 w-4" /> Copy Token
                </Button>
                <div className="text-xs text-slate-500">Expires at: {new Date(qrData.expiresAt).toLocaleString()}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-600 dark:text-slate-300">No active QR. Generate to start a live session.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
