import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Clock, MapPin, Phone, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getStatusInfo, formatPrice } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import CopyOrderNumber from "@/components/CopyOrderNumber";

const STATUS_STEPS = ["pending", "confirmed", "preparing", "ready", "delivered"];

export default async function OrderPage({ params }: { params: { id: string } }) {
  // Protect against sequential orderNumber enumeration — require phone verification via /track
  if (params.id.startsWith("KOOQS-")) {
    redirect(`/track?order=${encodeURIComponent(params.id)}`);
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: { include: { menuItem: { select: { image: true } } } } },
  });

  if (!order) notFound();

  const statusInfo = getStatusInfo(order.status);
  const currentStep = STATUS_STEPS.indexOf(order.status === "out_for_delivery" ? "ready" : order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="min-h-screen bg-kooqs-dark">
      <Navbar />
      <CartDrawer />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-kooqs-text-dim hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to menu
        </Link>

        {/* Success header */}
        <div className="card p-8 text-center mb-6">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-400" />
          </div>
          <h1 className="text-white font-black text-2xl">Order Placed! 🎉</h1>
          <p className="text-kooqs-text-dim mt-2">We&apos;ve received your order. We&apos;ll call you on <strong className="text-white">{order.phone}</strong> to confirm.</p>
          <CopyOrderNumber orderNumber={order.orderNumber} />
          {order.estimatedTime && (
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <Clock size={14} className="text-kooqs-orange" />
              <span className="text-kooqs-orange font-semibold text-sm">~{order.estimatedTime} min {order.orderType === "delivery" ? "delivery" : "pickup"}</span>
            </div>
          )}
        </div>

        {/* Status tracker */}
        {!isCancelled && (
          <div className="card p-6 mb-6">
            <h2 className="text-white font-bold mb-5">Order Status</h2>
            <div className="relative">
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-kooqs-muted" />
              <div
                className="absolute top-4 left-4 h-0.5 bg-flame transition-all duration-700"
                style={{ width: `${currentStep >= 0 ? Math.min(100, (currentStep / (STATUS_STEPS.length - 1)) * 100) : 0}%`, right: "auto" }}
              />
              <div className="relative flex justify-between">
                {STATUS_STEPS.map((step, i) => {
                  const done = i <= currentStep;
                  return (
                    <div key={step} className="flex flex-col items-center gap-2">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-300 ${
                        done ? "bg-flame border-transparent" : "bg-kooqs-card border-kooqs-border"
                      }`}>
                        {done ? <CheckCircle2 size={14} className="text-white" /> : <div className="w-2 h-2 rounded-full bg-kooqs-muted" />}
                      </div>
                      <span className={`text-xs font-medium text-center capitalize ${done ? "text-white" : "text-kooqs-text-dim"}`}>
                        {step.replace("_", " ")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className={`mt-5 flex items-center justify-center gap-2 py-2 px-4 rounded-full text-sm font-bold ${statusInfo.color}`}>
              <span>{statusInfo.label}</span>
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="card p-4 mb-6 border-red-500/20">
            <p className="text-red-400 font-bold text-center">This order has been cancelled.</p>
          </div>
        )}

        {/* Order details */}
        <div className="card p-6 mb-6">
          <h2 className="text-white font-bold mb-4">Order Details</h2>
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-kooqs-text-dim">Order type</span>
              <span className="text-white">{order.orderType === "delivery" ? "🚗 Delivery" : "🏃 Pickup"}</span>
            </div>
            {order.address && (
              <div className="flex justify-between gap-4">
                <span className="text-kooqs-text-dim flex items-center gap-1"><MapPin size={13} /> Address</span>
                <span className="text-white text-right">{order.address}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-kooqs-text-dim flex items-center gap-1"><Phone size={13} /> Phone</span>
              <span className="text-white">{order.phone}</span>
            </div>
          </div>

          <div className="border-t border-kooqs-border pt-4 space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-3 items-center">
                {item.menuItem.image && (
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                    <Image src={item.menuItem.image} alt={item.name} fill className="object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{item.name}</p>
                  <p className="text-kooqs-text-dim text-xs">x{item.quantity} · {formatPrice(item.price)} each</p>
                </div>
                <span className="text-white font-semibold text-sm">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-kooqs-border pt-4 mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-kooqs-text-dim">Subtotal</span>
              <span className="text-white">{formatPrice(order.subtotal)}</span>
            </div>
            {order.deliveryFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-kooqs-text-dim">Delivery Fee</span>
                <span className="text-white">{formatPrice(order.deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-lg">
              <span className="text-white">Total</span>
              <span className="text-kooqs-red">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link href="/" className="btn-primary inline-flex items-center gap-2">
            Order More Food
          </Link>
        </div>
      </main>
    </div>
  );
}
