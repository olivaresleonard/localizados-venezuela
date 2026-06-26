import { detectCondicion } from "./excel-seed";

const HEADER_MAP: Record<string, string> = {
  nombre: "nombre",
  "apellidos y nombres": "nombre",
  "apellidos y nombre": "nombre",
  edad: "edad",
  cedula: "cedula",
  cédula: "cedula",
  direccion: "direccion",
  dirección: "direccion",
  procedencia: "direccion",
  "zona / municipio": "direccion",
  "obs.": "observaciones",
  obs: "observaciones",
  observaciones: "observaciones",
  nota: "observaciones",
  "naturaleza lesión": "observaciones",
  "naturaleza lesion": "observaciones",
  acompañante: "observaciones",
  acompanante: "observaciones",
};

export type OcrRow = {
  nombre: string;
  edad?: string;
  cedula?: string;
  direccion?: string;
  observaciones?: string;
  condicion: "vivo" | "fallecido" | "desconocido";
};

export type ParsedMdFile = {
  relativePath: string;
  url?: string;
  fecha?: string;
  lugarNombre: string;
  rows: OcrRow[];
  tablesFound: number;
  rowsSkipped: number;
};

function resolveField(header: string): string | null {
  const norm = header.trim().toLowerCase();
  if (HEADER_MAP[norm]) return HEADER_MAP[norm];
  if (norm.includes("apellido") && norm.includes("nombre")) return "nombre";
  if (norm.includes("cedula") || norm.includes("cédula")) return "cedula";
  if (norm.includes("direccion") || norm.includes("dirección")) return "direccion";
  if (norm.includes("procedencia")) return "direccion";
  if (norm.includes("municipio")) return "direccion";
  if (norm.includes("observacion") || norm === "obs." || norm === "obs") {
    return "observaciones";
  }
  if (norm === "nota") return "observaciones";
  if (norm.includes("lesion") || norm.includes("lesión")) return "observaciones";
  if (norm.includes("acompa")) return "observaciones";
  if (norm === "edad") return "edad";
  if (norm === "nombre") return "nombre";
  return null;
}

function parseTableLine(line: string): string[] {
  const trimmed = line.trim();
  const inner = trimmed.slice(1, trimmed.endsWith("|") ? -1 : undefined);
  return inner.split("|").map((c) => c.trim());
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((c) => /^:?-{1,}:?$/.test(c));
}

function cleanNombre(raw: string): string | null {
  let n = raw
    .replace(/\(\?\)/g, "")
    .replace(/\*+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!n) return null;
  if (n === "—" || n === "-" || n === "–") return null;
  if (/^sin identificar$/i.test(n)) return null;
  if (/en blanco/i.test(n)) return null;
  if (/^\(.*\)$/.test(n)) return null;

  return n;
}

function normalizeCedula(raw?: string): string | undefined {
  if (!raw) return undefined;
  const v = raw.trim();
  if (!v || v === "—" || v === "-") return undefined;
  return v;
}

function buildCondicion(obs?: string): OcrRow["condicion"] {
  if (obs?.includes("✚")) return "fallecido";
  return detectCondicion(obs);
}

function mapRow(cells: string[], fields: (string | null)[]): OcrRow | null {
  const mapped: Record<string, string> = {};
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    const value = cells[i]?.trim();
    if (!field || !value || value === "—" || value === "-") continue;
    if (mapped[field]) {
      mapped[field] = `${mapped[field]}; ${value}`;
    } else {
      mapped[field] = value;
    }
  }

  const nombre = cleanNombre(mapped.nombre ?? "");
  if (!nombre) return null;

  const observaciones = mapped.observaciones;
  return {
    nombre,
    edad: mapped.edad,
    cedula: normalizeCedula(mapped.cedula),
    direccion: mapped.direccion,
    observaciones,
    condicion: buildCondicion(observaciones),
  };
}

function parseTables(content: string): {
  tables: string[][];
  tablesFound: number;
} {
  const lines = content.split(/\r?\n/);
  const tables: string[][] = [];
  let current: string[] = [];

  const flush = () => {
    if (current.length >= 2) tables.push(current);
    current = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("|") && trimmed.includes("|")) {
      current.push(trimmed);
    } else if (current.length > 0) {
      flush();
    }
  }
  flush();

  return { tables, tablesFound: tables.length };
}

function parseSingleTable(tableLines: string[]): {
  rows: OcrRow[];
  skipped: number;
} {
  if (tableLines.length < 2) return { rows: [], skipped: 0 };

  const headerCells = parseTableLine(tableLines[0]);
  const fields = headerCells.map(resolveField);

  if (!fields.some((f) => f === "nombre")) {
    return { rows: [], skipped: 0 };
  }

  const rows: OcrRow[] = [];
  let skipped = 0;

  for (let i = 1; i < tableLines.length; i++) {
    const cells = parseTableLine(tableLines[i]);
    if (isSeparatorRow(cells)) continue;

    const row = mapRow(cells, fields);
    if (row) {
      rows.push(row);
    } else if (cells.some((c) => c.trim())) {
      skipped++;
    }
  }

  return { rows, skipped };
}

export function extractUrl(content: string): string | undefined {
  const match = content.match(/https?:\/\/[^\s)>\]]+/);
  return match?.[0];
}

export function extractFechaFromPath(relativePath: string): string | undefined {
  const match = relativePath.match(/(\d{4})(\d{2})(\d{2})/);
  if (!match) return undefined;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

export function parseMarkdownFile(
  content: string,
  relativePath: string,
  lugarNombre: string
): ParsedMdFile {
  const { tables, tablesFound } = parseTables(content);
  const rows: OcrRow[] = [];
  let rowsSkipped = 0;

  for (const table of tables) {
    const parsed = parseSingleTable(table);
    rows.push(...parsed.rows);
    rowsSkipped += parsed.skipped;
  }

  return {
    relativePath,
    url: extractUrl(content),
    fecha: extractFechaFromPath(relativePath),
    lugarNombre,
    rows,
    tablesFound,
    rowsSkipped,
  };
}
