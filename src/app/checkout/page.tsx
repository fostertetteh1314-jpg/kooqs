"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, ShoppingBag, Loader2, ChevronRight, Phone, CheckCircle, KeyRound, Smartphone } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";

const DELIVERY_FEE = parseFloat(process.env.NEXT_PUBLIC_DELIVERY_FEE ?? "2.99");
const FREE_THRESHOLD = parseFloat(process.env.NEXT_PUBLIC_FREE_DELIVERY_THRESHOLD ?? "30");

const NETWORKS = [
  { id: "13", name: "MTN MoMo", emoji: "💛" },
  { id: "6", name: "Telecel Cash", emoji: "❤️" },
  { id: "7", name: "AT Money", emoji: "💙" },
] as const;

type OrderType = "pickup" | "delivery";
type PayStep = "form" | "sending" | "otp" | "verifying" | "prompt" | "creating";

export default function CheckoutPage() {
  const router = useRouter();
  const { state, subtotal, clearCart } = useCart();
  const [orderType, setOrderType] = useState<OrderType>("pickup");
  const [payStep, setPayStep] = useState<PayStep>("form");
  const [channel, setChannel] = useState<string>("13");
  const [otp, setOtp] = useState("");
  const [checking, setChecking] = useState(false);
  const refRef = useRef(`KOOQS_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const orderCreatedRef = useRef(false);

  const [form, setForm] = useState({
    customerName: "", phone: "", address: "", notes: "",
  });

  const deliveryFee = orderType === "delivery" && subtotal < FREE_THRESHOLD ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  const createOrder = useCallback(async () => {
    if (orderCreatedRef.current) return;
    orderCreatedRef.current = true;
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
          paystackRef: refRef.current,
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
      orderCreatedRef.current = false;
      toast.error(`Payment received but order failed. Call us with ref: ${refRef.current}`);
      setPayStep("prompt");
    }
  }, [form, orderType, state.items, clearCart, router]);

  const checkStatus = useCallback(async (silent = true) => {
    try {
      const res = await fetch("/api/payment/moolre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status", externalRef: refRef.current }),
      });
      const data = await res.json();
      const tx = data?.data;
      if (data.status === 1 && tx && Number(tx.txstatus) === 1) {
        if (pollRef.current) clearInterval(pollRef.current);
        toast.success("Payment received! 🎉");
        await createOrder();
        return true;
      }
      if (!silent) toast("Payment not confirmed yet. Approve the prompt on your phone.", { icon: "⏳" });
      return false;
    } catch {
      if (!silent) toast.error("Could not check payment status.");
      return false;
    }
  }, [createOrder]);

  // Poll payment status while on the prompt screen
  useEffect(() => {
    if (payStep === "prompt") {
      pollRef.current = setInterval(() => { checkStatus(true); }, 5000);
      return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }
  }, [payStep, checkStatus]);

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

  async function callMoolre(action: "initiate" | "verify", otpCode?: string) {
    const res = await fetch("/api/payment/moolre", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        amount: total.toFixed(2),
        phone: form.phone,
        channel,
        externalRef: refRef.current,
        ...(otpCode ? { otpCode } : {}),
      }),
    });
    return res.json();
  }

  async function initiatePayment() {
    setPayStep("sending");
    try {
      const data = await callMoolre("initiate");
      if (data.code === "TR099") {
        setPayStep("prompt");
        toast.success("Payment prompt sent! Check your phone.");
      } else if (data.code === "TP14") {
        setPayStep("otp");
        toast.success("Verification code sent to your phone via SMS.");
      } else {
        toast.error(data.message || "Payment failed. Please try again.");
        setPayStep("form");
      }
    } catch {
      toast.error("Network error. Please try again.");
      setPayStep("form");
    }
  }

  async function verifyOtp() {
    if (!otp.trim()) { toast.error("Please enter the code."); return; }
    setPayStep("verifying");
    try {
      const data = await callMoolre("verify", otp.trim());
      if (data.code === "TP17" || data.status === 1) {
        // Verified — re-initiate to trigger the PIN prompt
        const pay = await callMoolre("initiate");
        if (pay.code === "TR099") {
          setPayStep("prompt");
          toast.success("Now check your phone and enter your MoMo PIN.");
        } else if (pay.code === "TP14") {
          setOtp("");
          setPayStep("otp");
          toast("Another code was sent. Please enter it.", { icon: "📩" });
        } else {
          toast.error(pay.message || "Payment failed. Please try again.");
          setPayStep("form");
        }
      } else {
        toast.error(data.message || "Incorrect code. Please try again.");
        setOtp("");
        setPayStep("otp");
      }
    } catch {
      toast.error("Network error. Please try again.");
      setPayStep("otp");
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

  const netName = NETWORKS.find((n) => n.id === channel)?.name ?? "Mobile Money";

  if (payStep === "sending" || payStep === "verifying" || payStep === "creating") {
    const msg: Record<string, string> = {
      sending: "Contacting your network…",
      verifying: "Verifying code…",
      creating: "Placing your order…",
    };
    return (
      <div className="min-h-screen bg-kooqs-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="text-kooqs-red animate-spin mx-auto mb-4" />
          <p className="text-white font-bold text-lg">{msg[payStep]}</p>
        </div>
      </div>
    );
  }

  if (payStep === "otp") {
    return (
      <div className="min-h-screen bg-kooqs-dark">
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-10 text-center">
          <div className="card p-7">
            <div className="w-14 h-14 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound size={28} className="text-yellow-400" />
            </div>
            <h2 className="text-white font-black text-2xl mb-2">Verify Your Number</h2>
            <p className="text-kooqs-text-dim text-sm mb-5">
              First time paying with this number — a one-time code was sent by SMS to{" "}
              <span className="text-kooqs-red font-bold">{form.phone}</span>. Enter it below.
            </p>

            <input
              type="number"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter code"
              className="input text-center text-2xl tracking-widest mb-5 font-bold"
              autoFocus
            />

            <button
              onClick={verifyOtp}
              className="btn-primary w-full flex items-center justify-center gap-2 mb-3"
            >
              <CheckCircle size={16} /> Verify &amp; Continue
            </button>

            <button
              onClick={() => { setOtp(""); initiatePayment(); }}
              className="text-kooqs-text-dim text-sm hover:text-white transition-colors block w-full mb-2"
            >
              Resend code
            </button>

            <button
              onClick={() => { setOtp(""); setPayStep("form"); }}
              className="text-kooqs-text-dim text-sm hover:text-white transition-colors block w-full"
            >
              Cancel and go back
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (payStep === "prompt") {
    return (
      <div className="min-h-screen bg-kooqs-dark">
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-10 text-center">
          <div className="card p-7">
            <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Smartphone size={28} className="text-green-400" />
            </div>
            <h2 className="text-white font-black text-2xl mb-2">Check Your Phone 📲</h2>
            <p className="text-kooqs-text-dim text-sm mb-5">
              A payment prompt has been sent to{" "}
              <span className="text-kooqs-red font-bold">{form.phone}</span>.
              Enter your <span className="text-white font-bold">{netName} PIN</span> to approve{" "}
              <span className="text-white font-bold">{formatPrice(total)}</span>.
            </p>

            <div className="bg-kooqs-surface rounded-xl p-4 mb-5 text-left space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-kooqs-text-dim">Amount</span>
                <span className="text-white font-black">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-kooqs-text-dim">Network</span>
                <span className="text-white">{netName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-kooqs-text-dim">Reference</span>
                <span className="text-white font-mono text-xs">{refRef.current}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-kooqs-text-dim text-sm mb-5">
              <Loader2 size={15} className="animate-spin" />
              Waiting for your approval…
            </div>

            <button
              onClick={async () => { setChecking(true); await checkStatus(false); setChecking(false); }}
              disabled={checking}
              className="btn-primary w-full flex items-center justify-center gap-2 mb-3"
            >
              {checking
                ? <><Loader2 size={16} className="animate-spin" /> Checking…</>
                : <><CheckCircle size={16} /> I&apos;ve approved — Check now</>}
            </button>

            <button
              onClick={() => initiatePayment()}
              className="text-kooqs-text-dim text-sm hover:text-white transition-colors block w-full mb-2"
            >
              Didn&apos;t get the prompt? Resend
            </button>

            <button
              onClick={() => setPayStep("form")}
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
                  <label className="text-kooqs-text-dim text-sm font-medium block mb-1.5">Mobile Money Network *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {NETWORKS.map((net) => (
                      <button
                        key={net.id}
                        type="button"
                        onClick={() => setChannel(net.id)}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 text-center ${
                          channel === net.id
                            ? "border-kooqs-red bg-kooqs-red/5"
                            : "border-kooqs-border hover:border-kooqs-border/80"
                        }`}
                      >
                        <div className="text-xl mb-0.5">{net.emoji}</div>
                        <div className="text-white text-xs font-bold">{net.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-kooqs-text-dim text-sm font-medium block mb-1.5">{netName} Number *</label>
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="055 000 0000"
                    className="input"
                  />
                  <p className="text-kooqs-text-dim text-xs mt-1">A payment prompt will be sent to this number.</p>
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
                <h2 className="text-white font-bold text-lg">Payment — Mobile Money</h2>
              </div>
              <p className="text-kooqs-text-dim text-sm leading-relaxed">
                A payment prompt will appear on your phone. Enter your MoMo PIN to approve the{" "}
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
                <Phone size={16} /> Pay {formatPrice(total)} <ChevronRight size={16} />
              </button>
              <p className="text-kooqs-text-dim text-xs text-center mt-3">
                🔒 Secured by Moolre · MTN · Telecel · AT
              </p>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
