"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const SplashScreen = dynamic(() => import("./SplashScreen"), { ssr: false });

const SESSION_KEY = "kooqs_splash_shown";

export default function SplashGate({ children }: { children: React.ReactNode }) {
  // Start true so the dark overlay covers the initial render on first visit.
  // The effect immediately hides it on repeat same-session visits.
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) {
      setShowSplash(false);
    }
  }, []);

  function onComplete() {
    sessionStorage.setItem(SESSION_KEY, "1");
    setShowSplash(false);
  }

  return (
    <>
      {showSplash && <SplashScreen onComplete={onComplete} />}
      {children}
    </>
  );
}
