import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const HEADERS = {
  "Content-Type": "text/plain",
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new NextResponse("ok", { status: 200, headers: HEADERS });
  } catch {
    return new NextResponse("db error", { status: 503, headers: HEADERS });
  }
}

export async function HEAD() {
  return new NextResponse(null, { status: 200, headers: HEADERS });
}
