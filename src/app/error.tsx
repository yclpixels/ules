"use client";

import Logo from "@/components/Logo";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-3">
        <Logo className="w-10 h-10 mx-auto" />
        <p className="text-lg font-semibold">Bir şeyler ters gitti</p>
        <p className="text-sm text-gray-500">
          Lütfen tekrar deneyin; sorun sürerse personele haber verin.
        </p>
        <button
          onClick={reset}
          className="text-white rounded-lg px-4 py-2 text-sm font-medium shadow-md shadow-amber-600/20"
          style={{ background: "linear-gradient(135deg, #E0233A, #E0233A)" }}
        >
          Tekrar dene
        </button>
      </div>
    </div>
  );
}
