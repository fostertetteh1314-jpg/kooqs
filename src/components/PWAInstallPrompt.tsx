"use client";
import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

const DISMISS_KEY = "kooqs_pwa_dismissed_at";
const DISMISS_DAYS = 14;

function isDismissed() {
  try {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    return Date.now() - Number(ts) < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function dismiss() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true;
}

export default function PWAInstallPrompt() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    if (isInStandalone() || isDismissed()) return;

    if (isIOS()) {
      setShowIOS(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowAndroid(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.finally(() => {
      setShowAndroid(false);
      setDeferredPrompt(null);
    });
  }

  function handleDismiss() {
    dismiss();
    setShowAndroid(false);
    setShowIOS(false);
  }

  if (showAndroid) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 card p-4 flex items-center gap-3 shadow-2xl border border-kooqs-border animate-in slide-in-from-bottom-4 duration-300">
        <div className="w-10 h-10 rounded-xl bg-kooqs-red/10 flex items-center justify-center flex-shrink-0">
          <Download size={20} className="text-kooqs-red" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">Install Kooqs</p>
          <p className="text-kooqs-text-dim text-xs">One-tap ordering on your home screen</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleInstall} className="btn-primary text-xs px-3 py-1.5">
            Install
          </button>
          <button onClick={handleDismiss} className="text-kooqs-text-dim hover:text-white p-1" aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  if (showIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 card p-4 flex items-start gap-3 shadow-2xl border border-kooqs-border animate-in slide-in-from-bottom-4 duration-300">
        <div className="w-10 h-10 rounded-xl bg-kooqs-red/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Share size={20} className="text-kooqs-red" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">Install Kooqs</p>
          <p className="text-kooqs-text-dim text-xs mt-0.5">
            Tap <strong className="text-white">Share</strong> then <strong className="text-white">Add to Home Screen</strong> for one-tap ordering
          </p>
        </div>
        <button onClick={handleDismiss} className="text-kooqs-text-dim hover:text-white p-1 flex-shrink-0" aria-label="Dismiss">
          <X size={16} />
        </button>
      </div>
    );
  }

  return null;
}
