"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-3">
        <p className="text-lg font-semibold">Bir şeyler ters gitti</p>
        <p className="text-sm text-gray-500">
          Lütfen tekrar deneyin; sorun sürerse personele haber verin.
        </p>
        <button
          onClick={reset}
          className="bg-black text-white rounded-lg px-4 py-2 text-sm"
        >
          Tekrar dene
        </button>
      </div>
    </div>
  );
}
