import { encodeHexLowerCase } from "@oslojs/encoding";
import { INTERNAL_API_SECRET } from "$env/static/private";

const TICKET_TTL_MS = 60_000;
const encoder = new TextEncoder();

let keyPromise: Promise<CryptoKey> | null = null;
function getKey(): Promise<CryptoKey> {
  if (!keyPromise) {
    keyPromise = crypto.subtle.importKey(
      "raw",
      encoder.encode(INTERNAL_API_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );
  }
  return keyPromise;
}

async function sign(payload: string): Promise<string> {
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return encodeHexLowerCase(new Uint8Array(sig));
}

export async function issueTicket(
  userId: number,
  username: string,
): Promise<string> {
  if (username.includes(".")) throw new Error("username cannot contain '.'");
  const expiresAt = Date.now() + TICKET_TTL_MS;
  const payload = `${userId}.${username}.${expiresAt}`;
  const sig = await sign(payload);
  return `${payload}.${sig}`;
}

export async function verifyTicket(
  ticket: string,
): Promise<{ userId: number; username: string } | null> {
  const parts = ticket.split(".");
  if (parts.length !== 4) return null;
  const [userIdStr, username, expiresAtStr, sig] = parts;
  const expected = await sign(`${userIdStr}.${username}.${expiresAtStr}`);
  if (sig.length !== expected.length) return null;
  let mismatch = 0;
  for (let i = 0; i < sig.length; i++) {
    mismatch |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (mismatch !== 0) return null;
  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;
  const userId = Number(userIdStr);
  if (!Number.isInteger(userId)) return null;
  return { userId, username };
}
