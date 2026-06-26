import type { FlattenMaps } from "mongoose";
import type { LocalizadoDoc } from "@/lib/models/Localizado";
import type { LugarDoc } from "@/lib/models/Lugar";

export type LeanLugar = FlattenMaps<LugarDoc>;
export type LeanLocalizado = FlattenMaps<LocalizadoDoc>;

export type LugarSource = Pick<
  LeanLugar,
  "slug" | "nombre" | "tipo" | "direccion" | "ciudad" | "estado"
>;

export type LocalizadoSource = Pick<
  LeanLocalizado,
  | "slug"
  | "nombreCompleto"
  | "edad"
  | "cedula"
  | "telefono"
  | "direccion"
  | "observaciones"
  | "condicion"
  | "fuente"
  | "createdAt"
>;

export type LocalizadoWithLugar = LocalizadoSource & { lugar: LugarSource };