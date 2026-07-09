"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BellRing, BellOff, X } from "lucide-react";
import Link from "next/link";
import type { Order } from "@/types";

export default function AdminOrderWatcher() {
  const [unlocked, setUnlocked] = useState(false);
  const [newOrder, setNewOrder] = useState<Order | null>(null);
  const lastSeenIdRef = useRef<string | null>(null);
  const seedDoneRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sirenIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopSiren = useCallback(() => {
    if (sirenIntervalRef.current) {
      clearInterval(sirenIntervalRef.current);
      sirenIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch { /* ignore */ }
      audioCtxRef.current = null;
    }
  }, []);

  const playTone = useCallback((ctx: AudioContext, freq: number, duration: number) => {
    // Two square-wave oscillators an octave apart through a compressor,
    // driven at full gain — as loud as the browser allows.
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-6, ctx.currentTime);
    compressor.ratio.setValueAtTime(20, ctx.currentTime);
    compressor.connect(ctx.destination);

    const secs = duration / 1000;
    for (const f of [freq, freq * 2]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(compressor);
      osc.type = "square";
      osc.frequency.setValueAtTime(f, ctx.currentTime);
      gain.gain.setValueAtTime(1.0, ctx.currentTime);
      gain.gain.setValueAtTime(1.0, ctx.currentTime + secs * 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + secs);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + secs);
    }
  }, []);

  const startSiren = useCallback(() => {
    if (typeof window === "undefined") return;
    stopSiren();
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    audioCtxRef.current = ctx;
    let high = true;
    playTone(ctx, 880, 450);
    if (navigator.vibrate) navigator.vibrate([400, 100, 400, 100, 400]);
    sirenIntervalRef.current = setInterval(() => {
      if (!audioCtxRef.current) return;
      playTone(audioCtxRef.current, high ? 660 : 950, 450);
      if (navigator.vibrate) navigator.vibrate(400);
      high = !high;
    }, 480);
  }, [stopSiren, playTone]);

  const dismiss = useCallback(() => {
    stopSiren();
    setNewOrder(null);
  }, [stopSiren]);

  // Poll for newest order every 5s
  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch("/api/orders?limit=5");
        if (!res.ok) return;
        const data = await res.json();
        const orders: Order[] = data.orders ?? [];
        if (orders.length === 0) return;

        if (!seedDoneRef.current) {
          lastSeenIdRef.current = orders[0].id;
          seedDoneRef.current = true;
          return;
        }

        if (orders[0].id !== lastSeenIdRef.current) {
          lastSeenIdRef.current = orders[0].id;
          setNewOrder(orders[0]);
        }
      } catch { /* ignore network errors */ }
    }

    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);

  // Start/stop siren based on alarm + unlock state
  useEffect(() => {
    if (newOrder && unlocked) {
      startSiren();
    } else if (!newOrder) {
      stopSiren();
    }
  }, [newOrder, unlocked, startSiren, stopSiren]);

  useEffect(() => () => stopSiren(), [stopSiren]);

  function unlock() {
    if (typeof window === "undefined") return;
    // Play a silent tone to satisfy browser autoplay policy
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
    setTimeout(() => ctx.close(), 200);
    setUnlocked(true);
  }

  return (
    <>
      {/* Sound enable button — fixed in corner until unlocked */}
      {!unlocked && !newOrder && (
        <button
          onClick={unlock}
          title="Enable sound alerts for new orders"
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-xl bg-kooqs-card border border-kooqs-border hover:border-yellow-500 transition-colors text-kooqs-text-dim hover:text-yellow-400 text-xs font-medium shadow-lg"
        >
          <BellOff size={14} /> Enable alerts
        </button>
      )}

      {/* New order floating banner */}
      {newOrder && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-kooqs-red bg-kooqs-dark/95 backdrop-blur shadow-2xl px-4 py-4 animate-bounce">
            <div className="flex items-center gap-3 min-w-0">
              <BellRing
                size={22}
                className="text-kooqs-red flex-shrink-0 animate-spin"
                style={{ animationDuration: "0.6s" }}
              />
              <div className="min-w-0">
                <p className="text-white font-black text-sm">New Order!</p>
                <p className="text-white text-xs font-bold truncate">
                  {newOrder.orderNumber} — {newOrder.customerName}
                </p>
                <p className="text-kooqs-text-dim text-xs truncate">
                  {newOrder.phone} · {newOrder.orderType}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!unlocked && (
                <button
                  onClick={unlock}
                  className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2 py-1.5 rounded-lg hover:bg-yellow-500/30 transition-colors whitespace-nowrap"
                >
                  Sound
                </button>
              )}
              <Link
                href="/admin/orders"
                onClick={dismiss}
                className="bg-kooqs-red text-white text-xs font-black px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
              >
                View
              </Link>
              <button
                onClick={dismiss}
                className="text-kooqs-text-dim hover:text-white transition-colors p-0.5"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
