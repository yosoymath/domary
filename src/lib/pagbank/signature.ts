import { createHash, timingSafeEqual } from "node:crypto";

export function createPagBankSignature(rawBody: string, token: string) {
  return createHash("sha256").update(`${token}-${rawBody}`, "utf8").digest("hex");
}

export function verifyPagBankSignature(rawBody: string, token: string, receivedSignature: string) {
  const normalizedSignature = receivedSignature.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalizedSignature)) return false;

  const expected = Buffer.from(createPagBankSignature(rawBody, token), "hex");
  const received = Buffer.from(normalizedSignature, "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}
