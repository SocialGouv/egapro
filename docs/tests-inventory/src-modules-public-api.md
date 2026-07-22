# Inventaire des tests — src/modules/public-api

> Fichier généré — ne pas éditer à la main. Régénérer avec `pnpm test:inventory` (depuis `packages/app/`) ou le skill `/test-inventory`. [← Retour à l'index](../tests-inventory.md)

_Généré le 2026-07-22 — 3 fichier(s), 51 test(s)._

- **`src/modules/public-api/declarationsBySirenService.test.ts`** — 10 test(s)
  - getPublicDeclarationBySirenYear > returns null when the declaration does not exist
  - getPublicDeclarationBySirenYear > returns null when the declaration exists but is not yet released
  - getPublicDeclarationBySirenYear > returns null when the year has no release date set
  - getPublicDeclarationBySirenYear > returns the projected DTO for a released declaration
  - getPublicDeclarationsBySiren > applies the limit after the release filter
  - getPublicDeclarationsBySiren > coerces nullable join columns to null
  - getPublicDeclarationsBySiren > filters out declarations whose year is not yet publicly released
  - getPublicDeclarationsBySiren > masks company identity when the address proxy is null (non-diffusible)
  - getPublicDeclarationsBySiren > returns an empty array when no declaration exists for the siren
  - getPublicDeclarationsBySiren > returns projected DTOs for released declarations
- **`src/modules/public-api/openapi.test.ts`** — 20 test(s)
  - publicOpenApiSpec > by-siren endpoint > declares the by-siren operation returning an array
  - publicOpenApiSpec > by-siren endpoint > requires the siren path parameter with a 9-digit pattern
  - publicOpenApiSpec > by-siren-and-year endpoint > declares the operation and both required path parameters
  - publicOpenApiSpec > by-siren-and-year endpoint > documents a 404 for a not-yet-public or missing declaration
  - publicOpenApiSpec > cross-cutting documentation > documents the public-release date gate in the top-level description
  - publicOpenApiSpec > cross-cutting documentation > documents the raw-data model, the G exclusion and the diffusion masking in the top-level description
  - publicOpenApiSpec > cross-cutting documentation > references the date gate in each endpoint description
  - publicOpenApiSpec > documents the four public endpoints
  - publicOpenApiSpec > export endpoint > declares the export operation with a json/csv format enum
  - publicOpenApiSpec > export endpoint > documents both a json and a csv 200 response
  - publicOpenApiSpec > exposes the three reusable component schemas
  - publicOpenApiSpec > is a valid OpenAPI 3.1 document
  - publicOpenApiSpec > PublicDeclaration schema — data-model guarantees > documents every field of the public declaration DTO
  - publicOpenApiSpec > PublicDeclaration schema — data-model guarantees > excludes indicator G — no category-G key is documented
  - publicOpenApiSpec > PublicDeclaration schema — data-model guarantees > exposes raw data only — no score, /100 index or note key (S6)
  - publicOpenApiSpec > PublicDeclaration schema — data-model guarantees > marks the identity fields nullable for non-diffusible companies
  - publicOpenApiSpec > PublicDeclaration schema — data-model guarantees > only requires year and siren
  - publicOpenApiSpec > search endpoint > declares every filter, pagination and their bounds
  - publicOpenApiSpec > search endpoint > declares the search operation
  - publicOpenApiSpec > search endpoint > returns a PublicSearchResult on 200 and documents 400/500
- **`src/modules/public-api/projection.test.ts`** — 21 test(s)
  - isCompanyDiffusible > returns false when the statut is 'N'
  - isCompanyDiffusible > returns true for any other statut value
  - isCompanyDiffusible > returns true when the statut is 'O'
  - isCompanyDiffusible > returns true when the statut is null
  - publicSearchInputSchema > accepts the optional filters
  - publicSearchInputSchema > applies default limit and offset
  - publicSearchInputSchema > rejects a limit above 100
  - publicSearchInputSchema > rejects a limit below 1
  - publicSearchInputSchema > rejects a negative offset
  - publicSearchInputSchema > rejects an empty q filter
  - toPublicDeclaration > converts numeric string gaps to numbers and preserves year and counts
  - toPublicDeclaration > derives diffusibility from a non-null address when statutDiffusion is null
  - toPublicDeclaration > exposes exactly the DTO whitelist and nothing else
  - toPublicDeclaration > exposes the full company whitelist for a diffusible company
  - toPublicDeclaration > keeps siren, year, workforceEma and every indicator for a non-diffusible company
  - toPublicDeclaration > maps non-numeric strings to null
  - toPublicDeclaration > maps null numeric inputs to null
  - toPublicDeclaration > masks company identity fields when the company is non-diffusible
  - toPublicDeclaration > masks company identity when statutDiffusion is null and the address is null
  - toPublicDeclaration > never leaks scores, the global /100 index, or indicator G data
  - toPublicDeclaration > passes through null integer counts
