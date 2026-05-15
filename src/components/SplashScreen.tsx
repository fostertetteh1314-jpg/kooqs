"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface Props {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: Props) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const doneRef = useRef(false);

  function dismiss() {
    if (doneRef.current) return;
    doneRef.current = true;
    setExiting(true);
    setTimeout(onComplete, 400);
  }

  useEffect(() => {
    const t0 = setTimeout(() => setVisible(true), 30);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t1 = setTimeout(dismiss, reducedMotion ? 500 : 1200);
    return () => { clearTimeout(t0); clearTimeout(t1); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[100] bg-[#0A0A0A] flex flex-col items-center justify-center cursor-pointer transition-opacity duration-400 ${
        exiting ? "opacity-0" : visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={dismiss}
    >
      {/* Glow ring behind logo */}
      <div className={`relative flex items-center justify-center transition-all duration-700 ${visible ? "scale-100 opacity-100" : "scale-90 opacity-0"}`}>
        <div className="absolute w-44 h-44 rounded-full bg-kooqs-red/25 blur-3xl animate-pulse" />
        <Image
          src="/logo.jpeg"
          alt="Kooqs"
          width={110}
          height={110}
          className="relative rounded-full border-2 border-kooqs-red/50 shadow-2xl"
          priority
        />
      </div>

      {/* Brand name + tagline */}
      <div className={`mt-7 text-center transition-all duration-700 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
          <span className="text-white">Kooqs</span>
          <span className="text-gradient-flame">.Takeout</span>
        </h1>
        <p className="text-kooqs-text-dim mt-3 text-sm font-medium tracking-widest uppercase">
          Fresh · Fast · Flavorful
        </p>
        <p className="text-kooqs-text-dim text-xs mt-1 opacity-60">055 090 7888</p>
      </div>
    </div>
  );
}
