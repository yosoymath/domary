export const CART_STORAGE_KEY = "domary-cart-v1";
export const CART_UPDATED_EVENT = "domary:cart-updated";

export type CartItem = {
  productId: string;
  productSlug: string;
  variantId: string;
  name: string;
  variantLabel: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  stockQuantity: number;
};

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CartItem>;

  return typeof item.productId === "string"
    && typeof item.productSlug === "string"
    && typeof item.variantId === "string"
    && typeof item.name === "string"
    && typeof item.variantLabel === "string"
    && typeof item.unitPrice === "number"
    && Number.isFinite(item.unitPrice)
    && typeof item.quantity === "number"
    && Number.isInteger(item.quantity)
    && item.quantity > 0
    && typeof item.stockQuantity === "number"
    && Number.isInteger(item.stockQuantity)
    && item.stockQuantity >= 0;
}

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) ?? "[]");
    return Array.isArray(stored) ? stored.filter(isCartItem) : [];
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function cartItemCount(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}
