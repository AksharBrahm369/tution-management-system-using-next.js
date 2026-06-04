"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

function QRScanContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processing your attendance...");
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No QR token found in the URL. Please scan the QR code again.");
      return;
    }

    if (hasProcessed) return;

    const markAttendance = async () => {
      try {
        setHasProcessed(true);
        setStatus("loading");
        setMessage("Processing your attendance...");
        
        const res = await fetch("/api/attendance/qr/scan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ qrToken: token }),
        });

        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          if (res.ok && data.success) {
            setStatus("success");
            setMessage("Your attendance has been marked successfully!");
          } else {
            setStatus("error");
            setMessage(data.error || data.message || "Failed to mark attendance. The QR code may be invalid or expired.");
          }
        } else {
          // Response is HTML or plain text (e.g. 500 error page or a redirect)
          const text = await res.text();
          console.error("Non-JSON response received from /api/attendance/qr/scan:", text);
          
          setStatus("error");
          if (res.status === 401 || res.status === 403 || text.includes("login") || text.includes("SignIn") || text.includes("Sign In")) {
            setMessage("You are not logged in. Please sign in to your student account first, then scan the QR code again.");
          } else {
            setMessage(`Server error (${res.status}). Please make sure you are logged in and try again.`);
          }
        }
      } catch (error) {
        console.error("Error during attendance QR scan fetch:", error);
        setStatus("error");
        setMessage("An unexpected error occurred while marking attendance.");
      }
    };

    markAttendance();
  }, [token, hasProcessed]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Attendance Marking</CardTitle>
          <CardDescription>QR Code Scan</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-6 py-6 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
              <p className="text-lg font-medium text-slate-700 dark:text-slate-300">{message}</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="h-16 w-16 text-emerald-500" />
              <p className="text-lg font-medium text-emerald-600 dark:text-emerald-400">{message}</p>
              <button 
                onClick={() => router.push("/student/dashboard")}
                className="mt-4 rounded-xl bg-slate-900 px-6 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Go to Dashboard
              </button>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-16 w-16 text-rose-500" />
              <p className="text-lg font-medium text-rose-600 dark:text-rose-400">{message}</p>
              <button 
                onClick={() => router.push("/student/dashboard")}
                className="mt-4 rounded-xl border border-slate-200 px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Return to Dashboard
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function QRScanPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
          <p className="text-slate-500">Loading scanner...</p>
        </div>
      </div>
    }>
      <QRScanContent />
    </Suspense>
  );
}
