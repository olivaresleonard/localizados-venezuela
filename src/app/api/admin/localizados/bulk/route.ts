import { jsonResponse } from "@/lib/api";
import { withErrorHandler } from "@/lib/api-middleware";
import { requireAdmin } from "@/lib/admin-auth";
import {
  moveLocalizados,
  restoreLocalizados,
  softDeleteLocalizados,
  updateLocalizado,
} from "@/lib/admin-localizado";
import { safeJsonParseBody } from "@/lib/safe-json";
import { ValidationError } from "@/lib/errors";

export const POST = withErrorHandler(async (req: Request) => {
  const denied = await requireAdmin();
  if (denied) return denied;

  const bodyText = await req.text();
  const parsed = safeJsonParseBody<{
    ids?: string[];
    action?: string;
    lugarId?: string;
  }>(bodyText);
  if (!parsed.ok) {
    return jsonResponse({ error: "JSON inválido" }, { status: 400 });
  }

  const ids = parsed.data.ids?.filter(Boolean) as string[] | undefined;
  if (!ids?.length) {
    return jsonResponse({ error: "ids requerido" }, { status: 400 });
  }

  const body = parsed.data;

  switch (body.action) {
    case "delete": {
      const n = await softDeleteLocalizados(ids);
      return jsonResponse({ ok: true, affected: n });
    }
    case "restore": {
      const n = await restoreLocalizados(ids);
      return jsonResponse({ ok: true, affected: n });
    }
    case "move": {
      if (!body.lugarId) {
        return jsonResponse({ error: "lugarId requerido" }, { status: 400 });
      }
      const n = await moveLocalizados(ids, body.lugarId);
      return jsonResponse({ ok: true, affected: n });
    }
    case "publish": {
      const results: { id: string; ok: boolean; error?: string }[] = [];
      for (const id of ids) {
        try {
          await updateLocalizado(id, { estado: "published" });
          results.push({ id, ok: true });
        } catch (err) {
          results.push({
            id,
            ok: false,
            error: err instanceof Error ? err.message : "Error",
          });
        }
      }
      const okCount = results.filter((r) => r.ok).length;
      return jsonResponse({
        ok: true,
        affected: okCount,
        total: ids.length,
        results,
      });
    }
    case "reject": {
      const results: { id: string; ok: boolean; error?: string }[] = [];
      for (const id of ids) {
        try {
          await updateLocalizado(id, { estado: "rejected" });
          results.push({ id, ok: true });
        } catch (err) {
          results.push({
            id,
            ok: false,
            error: err instanceof Error ? err.message : "Error",
          });
        }
      }
      const okCount = results.filter((r) => r.ok).length;
      return jsonResponse({
        ok: true,
        affected: okCount,
        total: ids.length,
        results,
      });
    }
    default:
      throw new ValidationError("action inválida");
  }
});
