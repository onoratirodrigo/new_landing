import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_COOKIE = "etman_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

export interface SessionPayload {
  nrocta: string;
  nombre: string;
  exp: number;
}

function sign(value: string) {
  const secret = import.meta.env.SESSION_SECRET;
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createSessionCookieValue(payload: Omit<SessionPayload, "exp">) {
  const full: SessionPayload = { ...payload, exp: Date.now() + SESSION_TTL_MS };
  const body = Buffer.from(JSON.stringify(full)).toString("base64url");
  const signature = sign(body);
  return `${body}.${signature}`;
}

export function verifySessionCookieValue(cookieValue: string | undefined): SessionPayload | null {
  if (!cookieValue) return null;
  const [body, signature] = cookieValue.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8")) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE };
