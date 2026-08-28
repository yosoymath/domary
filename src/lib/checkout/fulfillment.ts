export const STORE_PICKUP_SNAPSHOT = {
  fulfillmentMethod: "STORE_PICKUP",
  label: "Retirada na loja",
} as const;

export function isStorePickupSnapshot(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return (value as Record<string, unknown>).fulfillmentMethod === STORE_PICKUP_SNAPSHOT.fulfillmentMethod;
}
