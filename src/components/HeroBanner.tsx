import Image from "next/image";
import { Clock, Truck, Star } from "lucide-react";
import HeroSlideshow from "./HeroSlideshow";

export default function HeroBanner({ featuredCount, images }: { featuredCount: number; images: string[] }) {
  return (
    <section className="relative overflow-hidden border-b border-kooqs-border">
      {/* Blurry food-photo slideshow background */}
      <HeroSlideshow images={images} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start mb-4">
              <span className="text-xs font-bold text-kooqs-orange bg-kooqs-orange/10 border border-kooqs-orange/20 px-3 py-1 rounded-full">
                🔥 Now Taking Orders
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
              Fresh. Fast.
              <br />
              <span className="text-gradient-flame">Flavorful.</span>
            </h1>
            <p className="text-kooqs-text mt-4 text-base max-w-md">
              Jollof rice, fried rice, noodles, grilled tilapia & more — made fresh to order, ready in minutes. Call us: <span className="text-kooqs-orange font-semibold">059 996 6902</span>
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-8 justify-center md:justify-start">
              <div className="flex items-center gap-2 text-sm text-kooqs-text-dim">
                <Clock size={16} className="text-kooqs-red" />
                <span>25-35 min delivery</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-kooqs-text-dim">
                <Truck size={16} className="text-kooqs-red" />
                <span>Free delivery over GhC {process.env.NEXT_PUBLIC_FREE_DELIVERY_THRESHOLD ?? "150"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-kooqs-text-dim">
                <Star size={16} className="text-kooqs-red" />
                <span>{featuredCount}+ fan favorites</span>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-flame rounded-full blur-3xl opacity-25 scale-110" />
              <Image
                src="/logo.jpeg"
                alt="Kooqs.Takeout"
                width={200}
                height={200}
                className="relative rounded-full border-4 border-kooqs-red/40 shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
