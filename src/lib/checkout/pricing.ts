export function moneyToCents(value: string | number) {
  const numberValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new Error("Valor monetário inválido.");
  }

  return Math.round(numberValue * 100);
}

export function centsToDecimal(cents: number) {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new Error("Valor em centavos inválido.");
  }

  return (cents / 100).toFixed(2);
}

export function effectiveUnitPriceCents(
  basePrice: string | number,
  promotionPercentages: Array<string | number>,
) {
  const baseCents = moneyToCents(basePrice);
  const percentage = Math.max(0, ...promotionPercentages.map(Number));

  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    throw new Error("Percentual de promoção inválido.");
  }

  return percentage ? Math.round(baseCents * (1 - percentage / 100)) : baseCents;
}
