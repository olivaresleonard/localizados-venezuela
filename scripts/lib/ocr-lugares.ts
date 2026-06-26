/** Mapeo carpeta OCR → nombre canónico de lugar en MongoDB */
export const FOLDER_LUGAR_MAP: Record<string, string> = {
  Hosp_Perez_Carreño: "Hospital Miguel Pérez Carreño",
  Hosp_Domingo_Luciani: "Hospital Domingo Luciani",
  LaGuaira: "Periférico de Catia",
  Alcaldia_Chacao: "Alcaldía de Chacao",
};

export type LugarRef = {
  _id: import("mongoose").Types.ObjectId;
  slug: string;
  nombre: string;
  tipo: string;
};

export function normalizeLugarKey(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\bH\b/g, "HOSPITAL")
    .replace(/\bDR\b/g, "DOCTOR")
    .replace(/\bLG\b/g, "LA GUAIRA")
    .replace(/\bJM\b/g, "JOSE MARIA")
    .replace(/\s+/g, " ")
    .trim();
}

export function findLugarByNombre(
  lugares: LugarRef[],
  nombre: string
): LugarRef | undefined {
  const exact = lugares.find((l) => l.nombre === nombre);
  if (exact) return exact;

  const key = normalizeLugarKey(nombre);
  return lugares.find((l) => normalizeLugarKey(l.nombre) === key);
}

/** Extrae el nombre de carpeta de hospital desde la ruta relativa del .md */
export function resolveLugarNombre(relativePath: string): string | null {
  const parts = relativePath.replace(/\\/g, "/").split("/");
  // YYYYMMDD/Hosp_.../file.md
  const folder = parts.length >= 2 ? parts[parts.length - 2] : null;
  if (!folder || !FOLDER_LUGAR_MAP[folder]) return null;
  return FOLDER_LUGAR_MAP[folder];
}

export function inferLugarTipo(nombre: string): "hospital" | "recinto" {
  return /hospital|clinica|clínica|cruz roja|seguro social|periférico|periferico/i.test(
    nombre
  )
    ? "hospital"
    : "recinto";
}
