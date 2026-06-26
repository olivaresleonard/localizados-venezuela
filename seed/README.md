# Seed de desarrollo

Datos iniciales en JSON para arrancar **sin el Excel**.

## Archivos

| Archivo            | Descripción                                                       |
| ------------------ | ----------------------------------------------------------------- |
| `sample/`          | Subset pequeño (3 lugares, 12 personas) — **incluido en el repo** |
| `lugares.json`     | Dataset completo de lugares (generar con `seed:export`)           |
| `localizados.json` | Dataset completo de personas (generar con `seed:export`)          |
| `manifest.json`    | Metadatos y estado del seed                                       |

## Importar

```bash
npm run seed:sample   # rápido — recomendado al clonar
npm run seed          # completo si existen lugares.json + localizados.json
```

## Regenerar dataset completo (mantenedores)

Si tienes el Excel fuente localmente:

```bash
npm run seed:export
git add seed/lugares.json seed/localizados.json seed/manifest.json
```

Luego fusiona duplicados antes de commitear, si aplica:

```bash
npm run merge -- --apply
```

## Listas OCR (Markdown)

Transcripciones en el repo externo [OCR-data_Terremoto_Venezuela_24062026](https://github.com/ecrespo/OCR-data_Terremoto_Venezuela_24062026). No van en `seed/` — se importan directo a MongoDB:

```bash
npm run seed:ocr -- --dry-run
npm run seed:ocr
```

Ver la sección **Importar listas OCR** en el [README principal](../README.md).
