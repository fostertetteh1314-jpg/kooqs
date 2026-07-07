"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, ShoppingBag, Loader2, ChevronRight, Phone, CheckCircle, Copy } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";

const DELIVERY_FEE = parseFloat(process.env.NEXT_PUBLIC_DELIVERY_FEE ?? "2.99");
const FREE_THRESHOLD = parseFloat(process.env.NEXT_PUBLIC_FREE_DELIVERY_THRESHOLD ?? "30");

const MOMO_NUMBERS = [
  { network: "MTN", number: process.env.NEXT_PUBLIC_MOMO_MTN_NUMBER ?? "055 090 7888", color: "bg-yellow-500" },
  { network: "Vodafone", number: process.env.NEXT_PUBLIC_MOMO_VODAFONE_NUMBER ?? "055 470 4380", color: "bg-red-500" },
];

type OrderType = "pickup" | "delivery";
type PayStep = "form" | "confirming" | "creating";

export default function CheckoutPage() {
  const router = useRouter();
  const { state, subtotal, clearCart } = useCart();
  const [orderType, setOrderType] = useState<OrderType>("pickup");
  const [payStep, setPayStep] = useState<PayStep>("form");
  const [orderRef] = useState(() => `KOOQS_${Date.now()}`);

  const [form, setForm] = useState({
    customerName: "", phone: "", address: "", notes: "",
  });

  const deliveryFee = orderType === "delivery" && subtotal < FREE_THRESHOLD ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-kooqs-dark flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <ShoppingBag size={48} className="text-kooqs-muted" />
          <p className="text-white font-bold text-xl">Your cart is empty</p>
          <Link href="/" className="btn-primary">Browse Menu</Link>
        </div>
      </div>
    );
  }

  async function createOrder() {
    setPayStep("creating");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName,
          phone: form.phone,
          orderType,
          address: form.address || undefined,
          notes: form.notes || undefined,
          paystackRef: orderRef,
          items: state.items.map((i) => ({
            menuItemId: i.menuItem.id,
            quantity: i.quantity,
            notes: i.notes,
          })),
        }),
      });

      if (!res.ok) throw new Error("Order failed");
      const order = await res.json();
      clearCart();
      router.push(`/order/${order.id}`);
    } catch {
      toast.error("Order failed. Please call us directly.");
      setPayStep("confirming");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (orderType === "delivery" && !form.address.trim()) {
      toast.error("Please enter your delivery address.");
      return;
    }
    setPayStep("confirming");
  }

  function copyNumber(num: string) {
    navigator.clipboard.writeText(num.replace(/\s/g, ""));
    toast.success("Number copied!");
  }

  if (payStep === "confirming" || payStep === "creating") {
    return (
      <div className="min-h-screen bg-kooqs-dark">
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-10 text-center">
          <div className="card p-7">
            <div className="w-14 h-14 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone size={28} className="text-yellow-400" />
            </div>
            <h2 className="text-white font-black text-2xl mb-1">Send Mobile Money</h2>
            <p className="text-kooqs-text-dim text-sm mb-5">
              Send exactly <span className="text-kooqs-red font-bold">{formatPrice(total)}</span> to any number below, then tap <strong className="text-white">Place My Order</strong>.
            </p>

            <div className="space-y-3 mb-5">
              {MOMO_NUMBERS.filter(m => m.number).map((m) => (
                <div key={m.network} className="flex items-center justify-between bg-kooqs-surface rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${m.color}`} />
                    <div className="text-left">
                      <p className="text-kooqs-text-dim text-xs">{m.network} MoMo</p>
                      <p className="text-white font-bold">{m.number}</p>
                    </div>
                  </div>
                  <button onClick={() => copyNumber(m.number)} className="text-kooqs-text-dim hover:text-white transition-colors">
                    <Copy size={15} />
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-kooqs-surface rounded-xl p-4 mb-6 text-left space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-kooqs-text-dim">Amount</span>
                <span className="text-white font-black">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-kooqs-text-dim">Your name as reference</span>
                <span className="text-white font-semibold">{form.customerName.split(" ")[0]}</span>
              </div>
            </div>

            <button
              onClick={createOrder}
              disabled={payStep === "creating"}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {payStep === "creating" ? (
                <><Loader2 size={16} className="animate-spin" /> Placing your order…</>
              ) : (
                <><CheckCircle size={16} /> I&apos;ve sent the payment — Place My Order</>
              )}
            </button>

            <button
              onClick={() => setPayStep("form")}
              disabled={payStep === "creating"}
              className="mt-4 text-kooqs-text-dim text-sm hover:text-white transition-colors block w-full"
            >
              Go back and edit
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kooqs-dark">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-kooqs-text-dim hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to menu
        </Link>

        <h1 className="text-white font-black text-3xl mb-8">Checkout</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            {/* Order type */}
            <div className="card p-5">
              <h2 className="text-white font-bold text-lg mb-4">How would you like your order?</h2>
              <div className="grid grid-cols-2 gap-3">
                {(["pickup", "delivery"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setOrderType(type)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      orderType === type
                        ? "border-kooqs-red bg-kooqs-red/5"
                        : "border-kooqs-border hover:border-kooqs-border/80"
                    }`}
                  >
                    <div className="text-2xl mb-1">{type === "pickup" ? "🏃" : "🚗"}</div>
                    <div className="text-white font-bold capitalize">{type}</div>
                    <div className="text-kooqs-text-dim text-xs mt-0.5">
                      {type === "pickup"
                        ? "Ready in ~15 min"
                        : `${subtotal >= FREE_THRESHOLD ? "Free!" : formatPrice(DELIVERY_FEE)} delivery`}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Contact info */}
            <div className="card p-5">
              <h2 className="text-white font-bold text-lg mb-4">Your Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-kooqs-text-dim text-sm font-medium block mb-1.5">Full Name *</label>
                  <input
                    required
                    type="text"
                    value={form.customerName}
                    onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                    placeholder="John Doe"
                    className="input"
                  />
                </div>
                <div>
                  <label className="text-kooqs-text-dim text-sm font-medium block mb-1.5">Phone Number *</label>
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="055 000 0000"
                    className="input"
                  />
                </div>
                {orderType === "delivery" && (
                  <div>
                    <label className="text-kooqs-text-dim text-sm font-medium block mb-1.5 flex items-center gap-1.5">
                      <MapPin size={13} className="text-kooqs-red" /> Delivery Address *
                    </label>
                    <input
                      required
                      type="text"
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                      placeholder="House no., Street, Area"
                      className="input"
                    />
                  </div>
                )}
                <div>
                  <label className="text-kooqs-text-dim text-sm font-medium block mb-1.5">Special Instructions (optional)</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Allergies, preferences, delivery instructions…"
                    className="input resize-none h-24"
                  />
                </div>
              </div>
            </div>

            {/* Payment info */}
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <Phone size={20} className="text-kooqs-red" />
                <h2 className="text-white font-bold text-lg">Payment — Mobile Money</h2>
              </div>
              <p className="text-kooqs-text-dim text-sm leading-relaxed">
                After reviewing your order, you&apos;ll be shown our MoMo numbers to send{" "}
                <span className="text-kooqs-red font-bold">{formatPrice(total)}</span>. We&apos;ll confirm and start preparing once payment is received.
              </p>
              <div className="flex items-center gap-4 mt-4">
                <span className="flex items-center gap-1.5 text-xs text-kooqs-text-dim">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" /> MTN MoMo
                </span>
                <span className="flex items-center gap-1.5 text-xs text-kooqs-text-dim">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> Vodafone Cash
                </span>
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-2">
            <div className="card p-5 sticky top-20">
              <h2 className="text-white font-bold text-lg mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                {state.items.map((item) => (
                  <div key={item.menuItem.id} className="flex gap-3 items-center">
                    {item.menuItem.image && (
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                        <Image src={item.menuItem.image} alt={item.menuItem.name} fill className="object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium line-clamp-1">{item.menuItem.name}</p>
                      <p className="text-kooqs-text-dim text-xs">x{item.quantity}</p>
                    </div>
                    <span className="text-white text-sm font-semibold">
                      {formatPrice(item.menuItem.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-kooqs-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-kooqs-text-dim">Subtotal</span>
                  <span className="text-white">{formatPrice(subtotal)}</span>
                </div>
                {orderType === "delivery" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-kooqs-text-dim">Delivery</span>
                    <span className={deliveryFee === 0 ? "text-green-400 font-semibold" : "text-white"}>
                      {deliveryFee === 0 ? "FREE 🎉" : formatPrice(deliveryFee)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-black text-lg pt-2 border-t border-kooqs-border">
                  <span className="text-white">Total</span>
                  <span className="text-kooqs-red">{formatPrice(total)}</span>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full mt-5 flex items-center justify-center gap-2"
              >
                <Phone size={16} /> Continue to Payment <ChevronRight size={16} />
              </button>
              <p className="text-kooqs-text-dim text-xs text-center mt-3">
                MTN MoMo &amp; Vodafone Cash accepted
              </p>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
