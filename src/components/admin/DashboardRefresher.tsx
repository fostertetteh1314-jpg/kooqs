"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardRefresher() {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 10_000);
    return () => clearInterval(id);
  }, [router]);

  return null;
}
