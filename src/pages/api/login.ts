import type { APIRoute } from "astro";
import { timingSafeEqual } from "node:crypto";
import { getDbPool } from "../../lib/db";
import { createSessionCookieValue, SESSION_COOKIE } from "../../lib/session";

export const prerender = false;

function safeCompare(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return new Response(JSON.stringify({ error: "Solicitud inválida." }), { status: 400 });
  }

  const { identifier, password } = (await request.json()) as {
    identifier?: string;
    password?: string;
  };

  if (!identifier || !password) {
    return new Response(
      JSON.stringify({ error: "Email o número de cliente, y contraseña, son obligatorios." }),
      { status: 400 }
    );
  }

  const trimmedIdentifier = identifier.trim();

  const pool = getDbPool();
  const [rows] = await pool.query(
    `SELECT VTMCLH_NROCTA, VTMCLH_NOMBRE, USR_VTMCLH_PORTAL
     FROM VTMCLH
     WHERE VTMCLH_DEBAJA = 'N'
       AND (USR_VTMCLH_FEMAIL = ? OR TRIM(VTMCLH_NROCTA) = ?)
     LIMIT 1`,
    [trimmedIdentifier, trimmedIdentifier]
  );

  const client = (rows as any[])[0];

  if (!client || !client.USR_VTMCLH_PORTAL || !safeCompare(client.USR_VTMCLH_PORTAL, password)) {
    return new Response(JSON.stringify({ error: "Datos de acceso incorrectos." }), {
      status: 401,
    });
  }

  const cookieValue = createSessionCookieValue({
    nrocta: String(client.VTMCLH_NROCTA).trim(),
    nombre: String(client.VTMCLH_NOMBRE).trim(),
  });

  cookies.set(SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
