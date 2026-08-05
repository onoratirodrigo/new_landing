import { useEffect, useMemo, useState } from "react";
import { formatMoneyAR } from "../lib/format";

export interface MovimientoRow {
  fechaMovimiento: string;
  fechaVencimiento: string;
  cndpag: string;
  codfor: string;
  nrofor: string;
  descripcionTipo: string;
  linkPdf: string | null;
  saldo: number;
  subtotal: number;
  isOverdue: boolean;
  tipoCode: string;
  tipoLabel: string;
}

interface Props {
  movimientos: MovimientoRow[];
}

type SortKey = "mov" | "venc";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 50;

const TIPO_BADGE_CLASSES: Record<string, string> = {
  FA: "bg-sky-100 text-sky-700",
  NCA: "bg-amber-100 text-amber-700",
};
const DEFAULT_BADGE_CLASS = "bg-ink-100 text-ink-700";

const TH_CLASS = "sticky top-0 z-10 bg-brand-600 px-4 py-3 font-semibold";

export default function EstadoCuentaTable({ movimientos }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("mov");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [tipo, setTipo] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const tiposDisponibles = useMemo(() => {
    const map = new Map<string, string>();
    movimientos.forEach((m) => map.set(m.tipoCode, m.tipoLabel));
    return Array.from(map.entries());
  }, [movimientos]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return movimientos.filter((m) => {
      if (desde && m.fechaMovimiento < desde) return false;
      if (hasta && m.fechaMovimiento > hasta) return false;
      if (tipo && m.tipoCode !== tipo) return false;
      if (
        q &&
        !m.nrofor.toLowerCase().includes(q) &&
        !m.codfor.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [movimientos, desde, hasta, tipo, busqueda]);

  const ordenados = useMemo(() => {
    const key = sortKey === "mov" ? "fechaMovimiento" : "fechaVencimiento";
    const copy = [...filtrados];
    copy.sort((a, b) => {
      const va = a[key];
      const vb = b[key];
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return copy;
  }, [filtrados, sortKey, sortDir]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [desde, hasta, tipo, busqueda]);

  const visibleRows = ordenados.slice(0, visibleCount);
  const hayMas = ordenados.length > visibleCount;

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function exportarCSV() {
    const headers = [
      "Fecha Movimiento",
      "Fecha Vencimiento",
      "Condición de Pago",
      "Comprobante",
      "Número de Comprobante",
      "Tipo",
      "Descripción",
      "Saldo",
      "Subtotal",
    ];
    const lines = [headers.join(";")];
    ordenados.forEach((m) => {
      lines.push(
        [
          m.fechaMovimiento,
          m.fechaVencimiento,
          m.cndpag,
          m.codfor,
          m.nrofor,
          m.tipoLabel,
          `"${m.descripcionTipo.replace(/"/g, '""')}"`,
          m.saldo.toFixed(2),
          m.subtotal.toFixed(2),
        ].join(";")
      );
    });
    const csv = "﻿" + lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "estado-de-cuenta.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3 print:hidden">
        <div>
          <label
            className="block text-xs font-medium text-ink-500"
            htmlFor="filtro-desde"
          >
            Desde
          </label>
          <input
            id="filtro-desde"
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="mt-1 rounded-lg border border-ink-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label
            className="block text-xs font-medium text-ink-500"
            htmlFor="filtro-hasta"
          >
            Hasta
          </label>
          <input
            id="filtro-hasta"
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="mt-1 rounded-lg border border-ink-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label
            className="block text-xs font-medium text-ink-500"
            htmlFor="filtro-tipo"
          >
            Tipo de comprobante
          </label>
          <select
            id="filtro-tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="mt-1 rounded-lg border border-ink-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Todos</option>
            {tiposDisponibles.map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px] flex-1">
          <label
            className="block text-xs font-medium text-ink-500"
            htmlFor="filtro-busqueda"
          >
            Buscar N.º de comprobante
          </label>
          <input
            id="filtro-busqueda"
            type="text"
            placeholder="Ej: 1704266"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <button type="button" onClick={exportarCSV} className="btn btn-ghost text-sm">
          Exportar CSV
        </button>
      </div>

      <p className="mb-2 text-xs text-ink-500">
        Mostrando {visibleRows.length} de {ordenados.length} movimiento
        {ordenados.length === 1 ? "" : "s"}
        {ordenados.length !== movimientos.length &&
          ` (filtrado de ${movimientos.length} en total)`}
      </p>

      <div className="overflow-x-auto rounded-lg border border-ink-100">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-white">
              <th className={TH_CLASS}>
                <button
                  type="button"
                  onClick={() => toggleSort("mov")}
                  className="inline-flex items-center gap-1 hover:text-white/80"
                >
                  Fecha Movimiento
                  <SortIcon active={sortKey === "mov"} dir={sortDir} />
                </button>
              </th>
              <th className={TH_CLASS}>
                <button
                  type="button"
                  onClick={() => toggleSort("venc")}
                  className="inline-flex items-center gap-1 hover:text-white/80"
                >
                  Fecha Vencimiento
                  <SortIcon active={sortKey === "venc"} dir={sortDir} />
                </button>
              </th>
              <th className={TH_CLASS}>Condición de Pago</th>
              <th className={TH_CLASS}>Comprobante</th>
              <th className={TH_CLASS}>Número de Comprobante</th>
              <th className={TH_CLASS}>Descripción</th>
              <th className={`${TH_CLASS} text-right`}>Saldo</th>
              <th className={`${TH_CLASS} text-right`}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-ink-400">
                  No hay movimientos que coincidan con el filtro.
                </td>
              </tr>
            )}
            {visibleRows.map((m, i) => (
              <tr
                key={`${m.codfor}-${m.nrofor}-${i}`}
                className={`border-t border-ink-100 transition-colors hover:bg-brand-50/60 ${
                  m.isOverdue ? "bg-red-50" : i % 2 === 1 ? "bg-ink-50/50" : ""
                }`}
              >
                <td className="px-4 py-3 whitespace-nowrap">{m.fechaMovimiento}</td>
                <td
                  className={`px-4 py-3 whitespace-nowrap ${
                    m.isOverdue ? "font-semibold text-red-700" : ""
                  }`}
                >
                  {m.fechaVencimiento}
                  {m.isOverdue && (
                    <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700">
                      Vencida
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{m.cndpag}</td>
                <td className="px-4 py-3 whitespace-nowrap">{m.codfor}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {m.linkPdf ? (
                    <a
                      href={m.linkPdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-brand-600 underline hover:text-brand-700"
                    >
                      <PdfIcon />
                      {m.nrofor}
                    </a>
                  ) : (
                    m.nrofor
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`mr-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      TIPO_BADGE_CLASSES[m.tipoCode] ?? DEFAULT_BADGE_CLASS
                    }`}
                  >
                    {m.tipoLabel}
                  </span>
                  {m.descripcionTipo}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {formatMoneyAR(m.saldo)}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {formatMoneyAR(m.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hayMas && (
        <div className="mt-4 flex justify-center print:hidden">
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="btn btn-ghost text-sm"
          >
            Mostrar más ({ordenados.length - visibleCount} restantes)
          </button>
        </div>
      )}
    </div>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg
      className={`transition-transform ${active ? "opacity-100" : "opacity-50"} ${
        active && dir === "desc" ? "rotate-180" : ""
      }`}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
