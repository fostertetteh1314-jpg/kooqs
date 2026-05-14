import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const isOrderNumber = params.id.startsWith("KOOQS-");

  if (isOrderNumber) {
    // Require phone match to prevent sequential-ID enumeration of customer PII
    const phone = request.nextUrl.searchParams.get("phone")?.trim();
    if (!phone) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const order = await prisma.order.findFirst({
      where: { orderNumber: params.id },
      include: { items: { include: { menuItem: { select: { name: true, image: true } } } } },
    });
    if (!order || order.phone.replace(/\s/g, "") !== phone.replace(/\s/g, "")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(order);
  }

  // cuid path — used by the order confirmation page redirect (unguessable)
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: { include: { menuItem: { select: { name: true, image: true } } } } },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { status, estimatedTime } = body;

  const order = await prisma.order.update({
    where: { id: params.id },
    data: {
      ...(status && { status }),
      ...(estimatedTime !== undefined && { estimatedTime }),
    },
    include: { items: true },
  });

  return NextResponse.json(order);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.order.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
