import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Hosting healthcheck'i (Railway/Fly/Docker) — DB'ye de dokunur. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "db" }, { status: 503 });
  }
}
