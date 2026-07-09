"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, MapPin, Phone, Package } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function Navbar() {
  const { itemCount, toggleCart } = useCart();

  return (
    <header className="sticky top-0 z-40 glass border-b border-kooqs-border pt-[env(safe-area-inset-top)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.jpeg" alt="Kooqs" width={40} height={40} className="rounded-full" />
            <div className="hidden sm:block">
              <span className="text-white font-black text-lg tracking-tight">Kooqs</span>
              <span className="text-gradient-flame font-black text-lg">.Takeout</span>
            </div>
          </Link>

          {/* Center info */}
          <div className="hidden md:flex items-center gap-6 text-xs text-kooqs-text-dim">
            <div className="flex items-center gap-1.5">
              <MapPin size={13} className="text-kooqs-red" />
              <span>{process.env.NEXT_PUBLIC_RESTAURANT_ADDRESS ?? "123 Flavor Street"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone size={13} className="text-kooqs-red" />
              <span>{process.env.NEXT_PUBLIC_RESTAURANT_PHONE ?? "+1 (555) 123-4567"}</span>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Track Order */}
            <Link
              href="/track"
              className="flex items-center gap-1.5 bg-kooqs-card border border-kooqs-border hover:border-kooqs-red px-3 py-2 rounded-xl transition-all duration-200 group text-kooqs-text-dim hover:text-white"
            >
              <Package size={16} className="group-hover:text-kooqs-red transition-colors" />
              <span className="hidden sm:block text-sm font-semibold">Track Order</span>
            </Link>

            {/* Cart */}
            <button
              onClick={toggleCart}
              className="relative flex items-center gap-2 bg-kooqs-card border border-kooqs-border hover:border-kooqs-red px-4 py-2 rounded-xl transition-all duration-200 group"
            >
              <ShoppingCart size={18} className="text-white group-hover:text-kooqs-red transition-colors" />
              <span className="text-white font-semibold text-sm hidden sm:block">Cart</span>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-flame text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
