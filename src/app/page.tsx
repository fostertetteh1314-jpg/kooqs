import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import MenuSection from "@/components/MenuSection";
import HeroBanner from "@/components/HeroBanner";
import SplashGate from "@/components/SplashGate";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, featuredItems] = await Promise.all([
    prisma.category.findMany({
      orderBy: { order: "asc" },
      include: {
        menuItems: {
          where: { available: true },
          orderBy: [{ featured: "desc" }, { createdAt: "asc" }],
        },
      },
    }),
    prisma.menuItem.findMany({
      where: { featured: true, available: true },
      include: { category: true },
      take: 8,
    }),
  ]);

  const slideshowImages = categories
    .flatMap((c) => c.menuItems.map((m) => m.image))
    .filter((img): img is string => !!img);

  return (
    <SplashGate>
      <div className="min-h-screen bg-kooqs-dark">
        <Navbar />
        <CartDrawer />
        <main>
          <HeroBanner featuredCount={featuredItems.length} images={slideshowImages} />
          <MenuSection categories={categories} />
        </main>
        <footer className="border-t border-kooqs-border mt-16 py-8 text-center text-kooqs-text-dim text-sm">
          <p>© {new Date().getFullYear()} <span className="text-gradient-flame font-bold">Kooqs.Takeout</span> · All Rights Reserved · 059 996 6902</p>
        </footer>
      </div>
    </SplashGate>
  );
}
