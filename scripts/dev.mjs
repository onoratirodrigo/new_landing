#!/usr/bin/env node
// Antes de levantar Astro, se asegura de que el túnel SSH hacia la base de
// datos esté activo. Si ya está corriendo, no hace nada; si no, lo abre en
// segundo plano y espera a que esté listo antes de arrancar el servidor de
// dev. La configuración del túnel se lee de ".env" (ver ".env.example").
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");

function loadEnvFile(filePath) {
  const env = {};
  let contents;
  try {
    contents = readFileSync(filePath, "utf-8");
  } catch {
    return env;
  }
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

const fileEnv = loadEnvFile(path.join(projectRoot, ".env"));
function envVar(key) {
  return process.env[key] ?? fileEnv[key];
}

const TUNNEL_HOST = "127.0.0.1";
const TUNNEL_PORT = Number(envVar("DB_PORT") ?? 3306);
const TUNNEL_REMOTE = envVar("DB_TUNNEL_REMOTE");
const TUNNEL_SSH_HOST = envVar("DB_TUNNEL_SSH_HOST");

function checkPort(host, port, timeout = 800) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const done = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeout);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
    socket.connect(port, host);
  });
}

async function ensureTunnel() {
  if (await checkPort(TUNNEL_HOST, TUNNEL_PORT)) {
    console.log(`[db-tunnel] Ya estaba activo (puerto ${TUNNEL_PORT}).`);
    return;
  }

  if (!TUNNEL_REMOTE || !TUNNEL_SSH_HOST) {
    console.warn(
      "[db-tunnel] Faltan DB_TUNNEL_REMOTE / DB_TUNNEL_SSH_HOST en .env — no se puede abrir el túnel automáticamente.\n" +
        "             Completá esas variables (ver .env.example) o abrí el túnel manualmente."
    );
    return;
  }

  console.log(`[db-tunnel] Abriendo túnel SSH hacia la base de datos ("${TUNNEL_SSH_HOST}")...`);
  const child = spawn(
    "ssh",
    [
      "-N",
      "-L",
      `${TUNNEL_PORT}:${TUNNEL_REMOTE}`,
      "-o",
      "ExitOnForwardFailure=yes",
      "-o",
      "ConnectTimeout=10",
      "-o",
      "StrictHostKeyChecking=accept-new",
      TUNNEL_SSH_HOST,
    ],
    {
      stdio: "ignore",
      detached: true,
      windowsHide: true,
    }
  );
  child.unref();

  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 500));
    if (await checkPort(TUNNEL_HOST, TUNNEL_PORT)) {
      console.log("[db-tunnel] Listo.");
      return;
    }
  }
  console.warn(
    "[db-tunnel] No se pudo confirmar el túnel después de varios intentos.\n" +
      `             El login puede fallar hasta que se conecte. Revisá tu acceso SSH a "${TUNNEL_SSH_HOST}"\n` +
      `             (por ejemplo corriendo manualmente: ssh ${TUNNEL_SSH_HOST}).`
  );
}

await ensureTunnel();

const astroBin = path.join(projectRoot, "node_modules", "astro", "astro.js");

const astro = spawn(process.execPath, [astroBin, "dev"], {
  stdio: "inherit",
  cwd: projectRoot,
});
astro.on("exit", (code) => process.exit(code ?? 0));
