import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "react-hot-toast";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

export const metadata: Metadata = {
  title: "Kooqs.Takeout — Fresh. Fast. Flavorful.",
  description: "Order fresh, handcrafted food online for pickup or delivery from Kooqs.Takeout.",
  manifest: "/manifest.webmanifest",
  applicationName: "Kooqs",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kooqs",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-icon.png",
    shortcut: "/favicon.png",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          {children}
          <PWAInstallPrompt />
          <ServiceWorkerRegister />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#1a1a1a",
                color: "#ffffff",
                border: "1px solid #333",
                borderRadius: "12px",
                fontSize: "14px",
              },
              success: { iconTheme: { primary: "#DC1A17", secondary: "#fff" } },
            }}
          />
        </CartProvider>
      </body>
    </html>
  );
}
