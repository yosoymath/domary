"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { writeCart } from "@/lib/cart";

export function PaymentReturnStatus({ clearCart, refresh }: { clearCart: boolean; refresh: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (clearCart) {
      writeCart([]);
      return;
    }

    if (!refresh) return;
    const timer = window.setInterval(() => router.refresh(), 3_000);
    return () => window.clearInterval(timer);
  }, [clearCart, refresh, router]);

  return null;
}
