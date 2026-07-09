"use client";

import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";

const DELIVERY_FEE = parseFloat(process.env.NEXT_PUBLIC_DELIVERY_FEE ?? "2.99");
const FREE_THRESHOLD = parseFloat(process.env.NEXT_PUBLIC_FREE_DELIVERY_THRESHOLD ?? "30");

export default function CartDrawer() {
  const { state, removeItem, updateQuantity, setCartOpen, subtotal } = useCart();

  if (!state.isOpen) return null;

  const toFreeDelivery = Math.max(0, FREE_THRESHOLD - subtotal);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
        onClick={() => setCartOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-kooqs-card border-l border-kooqs-border z-50 flex flex-col animate-slide-up pt-[env(safe-area-inset-top)]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-kooqs-border">
          <div>
            <h2 className="text-white font-bold text-xl">Your Cart</h2>
            <p className="text-kooqs-text-dim text-sm">{state.items.length} item{state.items.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={() => setCartOpen(false)}
            className="p-2 rounded-lg hover:bg-kooqs-muted transition-colors text-kooqs-text-dim hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Free delivery progress */}
        {toFreeDelivery > 0 && (
          <div className="px-5 py-3 bg-kooqs-muted/50 border-b border-kooqs-border">
            <p className="text-xs text-kooqs-text-dim mb-2">
              Add <span className="text-kooqs-orange font-semibold">{formatPrice(toFreeDelivery)}</span> more for free delivery!
            </p>
            <div className="h-1.5 bg-kooqs-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-flame rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (subtotal / FREE_THRESHOLD) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {state.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <ShoppingBag size={48} className="text-kooqs-muted mb-4" />
              <p className="text-white font-semibold text-lg">Your cart is empty</p>
              <p className="text-kooqs-text-dim text-sm mt-1">Add some delicious items!</p>
              <button
                onClick={() => setCartOpen(false)}
                className="mt-6 btn-primary"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            state.items.map((item) => (
              <div key={item.menuItem.id} className="flex gap-4 bg-kooqs-muted/50 rounded-xl p-3">
                {item.menuItem.image && (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <Image src={item.menuItem.image} alt={item.menuItem.name} fill className="object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm line-clamp-1">{item.menuItem.name}</p>
                  <p className="text-kooqs-red font-bold text-sm mt-0.5">{formatPrice(item.menuItem.price)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-full bg-kooqs-card border border-kooqs-border flex items-center justify-center hover:border-kooqs-red transition-colors"
                    >
                      <Minus size={12} className="text-white" />
                    </button>
                    <span className="text-white font-bold text-sm w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-full bg-kooqs-card border border-kooqs-border flex items-center justify-center hover:border-kooqs-red transition-colors"
                    >
                      <Plus size={12} className="text-white" />
                    </button>
                    <button
                      onClick={() => removeItem(item.menuItem.id)}
                      className="ml-auto p-1 text-kooqs-text-dim hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {state.items.length > 0 && (
          <div className="border-t border-kooqs-border p-5 space-y-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <div className="flex justify-between text-sm">
              <span className="text-kooqs-text-dim">Subtotal</span>
              <span className="text-white font-semibold">{formatPrice(subtotal)}</span>
            </div>
            {subtotal < FREE_THRESHOLD && (
              <div className="flex justify-between text-sm">
                <span className="text-kooqs-text-dim">Delivery fee</span>
                <span className="text-white">{formatPrice(DELIVERY_FEE)}</span>
              </div>
            )}
            {subtotal >= FREE_THRESHOLD && (
              <div className="flex justify-between text-sm">
                <span className="text-kooqs-text-dim">Delivery fee</span>
                <span className="text-green-400 font-semibold">FREE 🎉</span>
              </div>
            )}
            <Link
              href="/checkout"
              onClick={() => setCartOpen(false)}
              className="btn-primary flex items-center justify-center gap-2 w-full"
            >
              Checkout — {formatPrice(subtotal + (subtotal < FREE_THRESHOLD ? DELIVERY_FEE : 0))}
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
