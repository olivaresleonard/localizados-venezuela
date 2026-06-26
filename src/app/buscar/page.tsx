export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { DesaparecidosLink } from "@/components/DesaparecidosLink";
import { LocalizadoCard } from "@/components/LocalizadoCard";
import { SearchForm } from "@/components/SearchForm";
import { SearchResultsTracker } from "@/components/SearchResultsTracker";
import { ShareButtons } from "@/components/ShareButtons";
import {
  coerceCondicion,
  coerceEdad,
  coerceTipo,
  searchLocalizados,
} from "@/lib/queries";
import { shareBusqueda } from "@/lib/share";

export const metadata = {
  title: "Buscar localizados",
};

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    condicion?: string;
    tipo?: string;
    edadMin?: string;
    edadMax?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const q = params.q ?? "";
  const condicion = coerceCondicion(params.condicion);
  const tipo = coerceTipo(params.tipo);
  const edadMin = coerceEdad(params.edadMin);
  const edadMax = coerceEdad(params.edadMax);
  const page = Number(params.page ?? "1");

  const hasFilters = Boolean(condicion || tipo || edadMin != null || edadMax != null);
  const hasQuery = Boolean(q || hasFilters);

  const result = hasQuery
    ? await searchLocalizados({
        q: q || undefined,
        condicion,
        tipo,
        edadMin,
        edadMax,
        page,
        limit: 20,
      })
    : { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Buscar localizados</h1>
        <p className="mt-2 text-slate-600">
          Busca por nombre, cédula u observación en registros publicados.
        </p>
      </div>

      <Suspense>
        <SearchForm initialQ={q} showFilters />
      </Suspense>

      {hasQuery && (
        <>
          {q && <SearchResultsTracker query={q} total={result.meta.total} />}
          <p className="text-sm text-slate-500">
            {result.meta.total} resultado{result.meta.total === 1 ? "" : "s"}
            {q ? <> para &ldquo;{q}&rdquo;</> : " con los filtros aplicados"}
          </p>
          {q && (
            <ShareButtons
              variant="full"
              {...shareBusqueda(q)}
              label="Compartir esta búsqueda"
              contentType="search"
            />
          )}
        </>
      )}

      <div className="grid gap-3">
        {result.data.map((item) => (
          <LocalizadoCard key={item.slug} item={item} />
        ))}
        {hasQuery && result.data.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
            No hay resultados publicados. Si la persona está <strong>localizada</strong>
            , puedes{" "}
            <a href="/contribuir" className="text-brand-600 underline">
              contribuir
            </a>
            . Si buscas reportar un <strong>desaparecido</strong>, usa{" "}
            <DesaparecidosLink className="text-brand-600 underline" />.
          </p>
        )}
      </div>
    </div>
  );
}
