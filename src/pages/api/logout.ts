import type { APIRoute } from "astro";
import { SESSION_COOKIE } from "../../lib/session";

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  cookies.delete(SESSION_COOKIE, { path: "/" });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
