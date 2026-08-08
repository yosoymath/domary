export function digits(value: string, limit: number) {
  return value.replace(/\D/g, "").slice(0, limit);
}

export function formatPhone(value: string) {
  const valueDigits = digits(value, 11);
  if (!valueDigits) return "";
  if (valueDigits.length <= 2) return `(${valueDigits}`;

  const areaCode = valueDigits.slice(0, 2);
  const subscriber = valueDigits.slice(2);
  const firstPartLength = subscriber.length > 8 ? 5 : 4;
  const firstPart = subscriber.slice(0, firstPartLength);
  const secondPart = subscriber.slice(firstPartLength);
  return `(${areaCode}) ${firstPart}${secondPart ? `-${secondPart}` : ""}`;
}

export function formatCpf(value: string) {
  const valueDigits = digits(value, 11);
  return valueDigits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function formatPostalCode(value: string) {
  return digits(value, 8).replace(/^(\d{5})(\d)/, "$1-$2");
}

export function formatDateInput(value: string) {
  const valueDigits = digits(value, 8);
  return valueDigits.replace(/^(\d{2})(\d)/, "$1/$2").replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
}

export function isoToBrazilianDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
}

export function brazilianDateToIso(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}
