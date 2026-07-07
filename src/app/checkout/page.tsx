"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, ShoppingBag, Loader2, ChevronRight, Phone, CheckCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";

const DELIVERY_FEE = parseFloat(process.env.NEXT_PUBLIC_DELIVERY_FEE ?? "2.99");
const FREE_THRESHOLD = parseFloat(process.env.NEXT_PUBLIC_FREE_DELIVERY_THRESHOLD ?? "30");

type OrderType = "pickup" | "delivery";
type PayStep = "form" | "sending" | "pending" | "creating";

export default function CheckoutPage() {
  const router = useRouter();
  const { state, subtotal, clearCart } = useCart();
  const [orderType, setOrderType] = useState<OrderType>("pickup");
  const [payStep, setPayStep] = useState<PayStep>("form");
  const [moolreRef, setMoolreRef] = useState("");

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

  async function initiatePayment() {
    setPayStep("sending");
    const ref = `KOOQS_${Date.now()}`;
    setMoolreRef(ref);

    try {
      const res = await fetch("/api/payment/moolre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          phone: form.phone,
          externalRef: ref,
          sessionId: ref,
        }),
      });

      const data = await res.json();

      if (data.status === 1 || data.code === "TR099" || data.code === "TP14") {
        setPayStep("pending");
        toast.success("Check your phone and enter your MoMo PIN.");
      } else {
        toast.error(data.message || "Payment failed. Please try again.");
        setPayStep("form");
      }
    } catch {
      toast.error("Network error. Please try again.");
      setPayStep("form");
    }
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
          paystackRef: moolreRef,
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
      toast.error(`Order failed. Call us with ref: ${moolreRef}`);
      setPayStep("pending");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (orderType === "delivery" && !form.address.trim()) {
      toast.error("Please enter your delivery address.");
      return;
    }
    initiatePayment();
  }

  if (payStep === "sending" || payStep === "creating") {
    return (
      <div className="min-h-screen bg-kooqs-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="text-kooqs-red animate-spin mx-auto mb-4" />
          <p className="text-white font-bold text-lg">
            {payStep === "sending" ? "Sending payment prompt…" : "Placing your order…"}
          </p>
        </div>
      </div>
    );
  }

  if (payStep === "pending") {
    return (
      <div className="min-h-screen bg-kooqs-dark">
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-10 text-center">
          <div className="card p-7">
            <div className="w-14 h-14 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone size={28} className="text-yellow-400" />
            </div>
            <h2 className="text-white font-black text-2xl mb-2">Enter Your MoMo PIN</h2>
            <p className="text-kooqs-text-dim text-sm mb-5">
              A payment prompt has been sent to{" "}
              <span className="text-kooqs-red font-bold">{form.phone}</span>.
              Open it on your phone and enter your MoMo PIN to approve{" "}
              <span className="text-white font-bold">{formatPrice(total)}</span>.
            </p>

            <div className="bg-kooqs-surface rounded-xl p-4 mb-6 text-left space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-kooqs-text-dim">Amount</span>
                <span className="text-white font-black">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-kooqs-text-dim">Phone</span>
                <span className="text-white">{form.phone}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-kooqs-text-dim">Reference</span>
                <span className="text-white font-mono text-xs">{moolreRef}</span>
              </div>
            </div>

            <button
              onClick={createOrder}
              className="btn-primary w-full flex items-center justify-center gap-2 mb-3"
            >
              <CheckCircle size={16} /> I&apos;ve entered my PIN — Place Order
            </button>

            <button
              onClick={() => { setMoolreRef(""); setPayStep("form"); }}
              className="text-kooqs-text-dim text-sm hover:text-white transition-colors block w-full"
            >
              Cancel and go back
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
                  <label className="text-kooqs-text-dim text-sm font-medium block mb-1.5">MTN MoMo Number *</label>
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="055 000 0000"
                    className="input"
                  />
                  <p className="text-kooqs-text-dim text-xs mt-1">A MoMo PIN prompt will be sent to this number.</p>
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

            <div className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <Phone size={20} className="text-kooqs-red" />
                <h2 className="text-white font-bold text-lg">Payment — MTN Mobile Money</h2>
              </div>
              <p className="text-kooqs-text-dim text-sm leading-relaxed">
                Enter your MTN number and you&apos;ll receive a prompt to enter your MoMo PIN to approve the{" "}
                <span className="text-kooqs-red font-bold">{formatPrice(total)}</span> payment.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <span className="text-xs text-kooqs-text-dim">🔒 Secured by</span>
                <span className="text-xs font-bold text-white">Moolre</span>
              </div>
            </div>
          </div>

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
                <Phone size={16} /> Pay {formatPrice(total)} via MoMo <ChevronRight size={16} />
              </button>
              <p className="text-kooqs-text-dim text-xs text-center mt-3">
                🔒 Secured by Moolre
              </p>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
