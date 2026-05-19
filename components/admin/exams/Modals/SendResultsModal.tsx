"use client";

import { useState } from "react";

export default function SendResultsModal({ onClose, onSend }: { onClose: () => void; onSend: (channel: "EMAIL" | "SMS" | "WHATSAPP" | "ALL") => void }) {
  const [channel, setChannel] = useState<"EMAIL" | "SMS" | "WHATSAPP" | "ALL">("ALL");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-slate-900">
        <h3 className="text-lg font-semibold">Send Results to Parents</h3>
        <select className="mt-4 w-full rounded-lg border px-3 py-2" value={channel} onChange={(e) => setChannel(e.target.value as "EMAIL" | "SMS" | "WHATSAPP" | "ALL")}>
          <option value="ALL">All Channels</option>
          <option value="EMAIL">Email</option>
          <option value="SMS">SMS</option>
          <option value="WHATSAPP">WhatsApp</option>
        </select>
        <div className="mt-6 flex justify-end gap-2">
          <button className="rounded-lg border px-4 py-2" onClick={onClose}>Cancel</button>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-white" onClick={() => onSend(channel)}>Send</button>
        </div>
      </div>
    </div>
  );
}
