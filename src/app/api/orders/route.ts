import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";
import { sendAdminOrderNotificationEmail } from "@/lib/email";
import { sendSMS, buildOrderConfirmationSMS } from "@/lib/sms";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const page = parseInt(searchParams.get("page") ?? "1");

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: { include: { menuItem: { select: { name: true, image: true } } } } },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ orders, total, page, limit });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { customerName, phone, email, orderType, address, items, notes, paystackRef } = body;

  if (!customerName || !phone || !items?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const DELIVERY_FEE = parseFloat(process.env.NEXT_PUBLIC_DELIVERY_FEE ?? "2.99");
  const FREE_THRESHOLD = parseFloat(process.env.NEXT_PUBLIC_FREE_DELIVERY_THRESHOLD ?? "30");

  const menuItemIds = items.map((i: { menuItemId: string }) => i.menuItemId);
  const menuItems = await prisma.menuItem.findMany({ where: { id: { in: menuItemIds } } });

  const orderItems = items.map((item: { menuItemId: string; quantity: number; notes?: string }) => {
    const mi = menuItems.find((m) => m.id === item.menuItemId);
    if (!mi) throw new Error(`Menu item ${item.menuItemId} not found`);
    return { menuItemId: mi.id, name: mi.name, price: mi.price, quantity: item.quantity, notes: item.notes };
  });

  const subtotal = orderItems.reduce((sum: number, i: { price: number; quantity: number }) => sum + i.price * i.quantity, 0);
  const deliveryFee = orderType === "delivery" && subtotal < FREE_THRESHOLD ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;
  const orderCount = await prisma.order.count();
  const orderNumber = generateOrderNumber(orderCount + 1);

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerName,
      phone,
      orderType,
      address: orderType === "delivery" ? address : null,
      status: "pending",
      subtotal,
      deliveryFee,
      total,
      notes: notes || null,
      estimatedTime: 25,
      email: email || null,
      paystackRef: paystackRef || null,
      items: { create: orderItems },
    },
    include: { items: true },
  });

  const emailData = {
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    phone: order.phone,
    orderType: order.orderType,
    address: order.address,
    items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    total: order.total,
    notes: order.notes,
    estimatedTime: order.estimatedTime,
  };

  sendAdminOrderNotificationEmail(emailData).catch(console.error);

  const smsText = buildOrderConfirmationSMS({
    customerName: order.customerName,
    orderNumber: order.orderNumber,
    total: order.total,
    orderType: order.orderType,
    estimatedTime: order.estimatedTime,
    phone: order.phone,
  });
  sendSMS(order.phone, smsText, order.orderNumber).catch(console.error);

  return NextResponse.json(order, { status: 201 });
}
