"use client";

import Image from "next/image";
import { useState } from "react";
import { Plus, Flame, Leaf, Star } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import type { MenuItem } from "@/types";
import toast from "react-hot-toast";
import { useParticleBurst } from "@/components/MenuItemParticleBurst";

export default function MenuItemCard({ item }: { item: MenuItem }) {
  const { addItem, state } = useCart();
  const { canvasRef, trigger } = useParticleBurst();
  const [imgError, setImgError] = useState(false);

  const cartItem = state.items.find((i) => i.menuItem.id === item.id);

  function handleAdd() {
    addItem(item);
    toast.success(`${item.name} added to cart!`, { duration: 2000 });
  }

  if (!item.available) return null;

  return (
    <div className="card overflow-hidden group hover:border-kooqs-red/50 transition-all duration-300 hover:shadow-lg hover:shadow-kooqs-red/5 flex flex-col">
      {/* Image — tap triggers flame particle burst */}
      <div
        className="relative h-44 overflow-hidden bg-kooqs-muted cursor-pointer"
        onClick={trigger}
      >
        {item.image && !imgError ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
        )}

        {/* Flame particle burst canvas — overlays image on tap */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap z-20">
          {item.featured && (
            <span className="flex items-center gap-1 bg-kooqs-red text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              <Star size={9} /> Popular
            </span>
          )}
          {item.spicy && (
            <span className="flex items-center gap-1 bg-orange-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              <Flame size={9} /> Spicy
            </span>
          )}
          {item.vegetarian && (
            <span className="flex items-center gap-1 bg-green-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              <Leaf size={9} /> Veg
            </span>
          )}
        </div>

        {cartItem && (
          <div className="absolute top-2 right-2 bg-kooqs-red text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center z-20">
            {cartItem.quantity}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-white font-bold text-base leading-tight">{item.name}</h3>
        <p className="text-kooqs-text-dim text-xs mt-1.5 line-clamp-2 flex-1">{item.description}</p>
        {item.calories && (
          <p className="text-kooqs-text-dim text-xs mt-2">{item.calories} cal</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="text-kooqs-red font-black text-lg">{formatPrice(item.price)}</span>
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 bg-flame text-white font-bold text-sm px-3 py-2 rounded-xl hover:opacity-90 active:scale-95 transition-all duration-150"
          >
            <Plus size={15} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
