import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Menü ve fiyatlar";

/**
 * Restoranın herkese açık menüsü paylaşıldığında (WhatsApp, Instagram,
 * X) çıkan kart: restoranın adı öne çıkar, genel Üleş görseli yerine.
 * Kategori ve ürün sayısı küçük bilgi olarak yazılır.
 */
export default async function MenuOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const branch = await prisma.branch.findUnique({
    where: { menuSlug: slug },
    select: {
      name: true,
      _count: { select: { products: { where: { isAvailable: true } } } },
      categories: { select: { name: true }, orderBy: { sortOrder: "asc" }, take: 4 },
    },
  });
  const logo = await readFile(path.join(process.cwd(), "public", "logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  const name = branch?.name ?? "Menü";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 88px",
          background:
            "radial-gradient(70% 90% at 90% 0%, rgba(124,108,255,0.4), rgba(0,0,0,0) 60%), #1D126D",
          color: "#F4F3FF",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, color: "rgba(244,243,255,0.7)" }}>
          Menü ve fiyatlar
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: name.length > 22 ? 72 : 96,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            {name}
          </div>
          {branch && branch.categories.length > 0 && (
            <div style={{ display: "flex", marginTop: 28, fontSize: 28, color: "#FFC857" }}>
              {branch.categories.map((c) => c.name).join(" · ")}
              {branch._count.products > 0 ? ` — ${branch._count.products} ürün` : ""}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} height={40} alt="" />
          </div>
          <div style={{ fontSize: 24, color: "rgba(244,243,255,0.7)" }}>
            QR menü ile hazırlandı
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
