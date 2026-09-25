"use client";

import { useState } from "react";

export default function EmailForm({ orderId }: { orderId: string }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);

  async function handleSend() {
    if (!email.trim()) {
      setStatus({ type: "error", text: "E-posta adresi girin" });
      return;
    }
    setSending(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/fis/${orderId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ type: "error", text: data.error || "Gönderilemedi" });
      } else if (data.mocked) {
        setStatus({
          type: "success",
          text: "Demo modu: e-posta gerçekten gönderilmedi (SMTP ayarlanmadı).",
        });
      } else {
        setStatus({ type: "success", text: "Fiş e-posta ile gönderildi." });
      }
    } catch {
      setStatus({ type: "error", text: "Bağlantı hatası" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-posta adresiniz"
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
        />
        <button
          onClick={handleSend}
          disabled={sending}
          className="text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #E0233A, #E0233A)" }}
        >
          {sending ? "..." : "Gönder"}
        </button>
      </div>
      {status && (
        <p
          className={`text-xs ${
            status.type === "error" ? "text-red-600" : "text-green-600"
          }`}
        >
          {status.text}
        </p>
      )}
    </div>
  );
}
