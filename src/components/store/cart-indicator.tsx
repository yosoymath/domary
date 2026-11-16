"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CART_STORAGE_KEY, CART_UPDATED_EVENT, cartItemCount, readCart } from "@/lib/cart";

function BagIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <path d="M6 8h12l1 13H5L6 8Zm3 0V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

export function CartIndicator() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const updateCount = () => setCount(cartItemCount(readCart()));
    const handleStorage = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY) updateCount();
    };

    updateCount();
    window.addEventListener(CART_UPDATED_EVENT, updateCount);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, updateCount);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const label = count === 1 ? "Carrinho com 1 item" : `Carrinho com ${count} itens`;

  return (
    <Link className="focus-ring relative grid size-10 place-items-center rounded-md hover:bg-black/5" href="/carrinho" aria-label={label}>
      <BagIcon />
      {count > 0 ? <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-domary-yellow px-1 text-[10px] font-semibold text-[#111111]">{count > 99 ? "99+" : count}</span> : null}
    </Link>
  );
}
