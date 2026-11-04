# Checklist — sécurité (OWASP Top 10 + RGS)

Périmètre : fichiers du diff sous `src/server/**`, `src/server/api/routers/**`, tRPC, `src/app/api/**/route.ts`, l'auth. Aucun de ces fichiers → `skip — no server files`.

Tu rapportes des vulnérabilités **confirmées**, avec un `fichier:ligne` exact — jamais une inquiétude générique. Le référentiel est l'OWASP Top 10 plus le RGS (plateforme de l'État). Ce fichier dit ce qui, **dans ce projet**, décide si un contrôle est présent : les vraies vulnérabilités sont dans l'écart entre le mécanisme prévu et le code qui l'oublie.

## Les mécanismes du projet

| Sujet | Le mécanisme prévu | La vulnérabilité, c'est |
|---|---|---|
| **Autorisation** (A01) | `protectedProcedure` + le `userId` de la **session** | un `publicProcedure` sur une donnée non publique ; une mutation qui autorise depuis un identifiant fourni par le client (IDOR) ; une route handler qui traite avant de vérifier la session ; un contrôle fait uniquement côté client |
| **Propriété** (A01) | chaque mutation vérifie que la ressource appartient à l'utilisateur | une mutation qui écrit sur un SIREN ou une déclaration sans ce contrôle |
| **Secrets** (A02) | `~/env.js` (typé, validé) ; seules les `NEXT_PUBLIC_*` atteignent le client | un `process.env` direct ; un secret dans du code client ; une valeur sensible en `localStorage` ou en cookie hors session ; un secret dans un message d'erreur ou un log |
| **Injection** (A03) | query builder Drizzle uniquement | du SQL brut ; de la concaténation dans un template `sql` ; un paramètre d'URL utilisé sans passer par Zod ; un chemin de fichier non validé (`../`) ; `dangerouslySetInnerHTML` sans DOMPurify ; `eval` / `new Function` |
| **Validation** (A08) | schéma Zod de `~/modules/{domaine}/schemas.ts` sur chaque `.input()` | une procédure sans `.input()` typé ; une valeur critique calculée côté client et acceptée telle quelle au lieu d'être recalculée au serveur |
| **Atomicité** (A08) | `db.transaction()` | des écritures multiples, ou une lecture-puis-écriture conditionnelle, hors transaction |
| **Auth** (A07) | ProConnect via NextAuth, flux OAuth avec PKCE | un flux qui contourne NextAuth ; une donnée sensible ajoutée au payload JWT ; une déconnexion qui n'invalide pas la session |
| **Journalisation** (A09) | `audit.action_log` via `PROCEDURE_TO_ACTION` / `withAuditedRoute` / `logAction` (`../../implement/references/conventions/audit-logging.md`) | une mutation ou une query sensible non câblée — l'action est silencieusement perdue ; du PII ou une IP dans le `metadata` jsonb (il y a une colonne `ip_address` dédiée) |
| **SSRF** (A10) | — | une URL contrôlée par l'utilisateur passée à un fetch serveur ou à une redirection sans validation ni allowlist |
| **RGS / RGPD** | hébergement France/UE, ProConnect comme identité souveraine, rétention CNIL (`read_sensitive` → 180 j, le reste → 365 j) | une collecte de données personnelles non nécessaire ; une catégorie d'audit qui met une donnée sensible dans le mauvais bucket de rétention |

## Méthode

1. Pour chaque procédure tRPC ou route handler **ajoutée ou modifiée** : lis-la en entier et coche chaque ligne du tableau ci-dessus.
2. Pour une mutation : remonte d'où vient chaque identifiant écrit (session ou input client ?).
3. Pour une query qui renvoie du PII, des données GIP ou des données d'entreprise : vérifie la catégorie d'audit `read_sensitive`.

## Ce que tu ne fais pas

- Signaler ce que `check-patterns.sh` bloque déjà (`process.env`, `: any`, `dangerouslySetInnerHTML`) — **sauf** si tu le trouves réellement dans le code : il est alors arrivé hors garde-fou, et c'est un vrai constat.
- L'accessibilité (→ `a11y.md`), la structure (→ `structural.md`), la performance.
- Auditer les dépendances : Dependabot et Sonar s'en chargent. Une dépendance ne se signale que si le code l'utilise dangereusement.

## Sortie

```
[CRITICAL|HIGH|MEDIUM|LOW] OWASP-{id} fichier:ligne — description → correctif
```

`CRITICAL` exploitable, correction immédiate · `HIGH` risque significatif, avant déploiement · `MEDIUM` à corriger quand possible · `LOW` bonne pratique.

Verdict : `SECURE` · `VULNERABLE` (au moins un CRITICAL ou HIGH) · `HARDENING NEEDED` (que des MEDIUM/LOW).
