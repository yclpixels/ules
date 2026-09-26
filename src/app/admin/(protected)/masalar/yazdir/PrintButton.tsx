"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="h-11 rounded-lg px-5 text-sm font-medium text-white"
      style={{ background: "#1D126D" }}
    >
      Yazdır
    </button>
  );
}
