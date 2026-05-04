# GitHub Artefact Hygiene

> **Used by**: `product-owner`, `architect`, `bug-analyst`, `code-dev` — tout agent qui poste sur GitHub (issue body/title, PR body/title, commentaires, commit messages, noms de branches).

Le repo **`SocialGouv/egapro` est public** (open-source). Tout artefact GitHub est **immédiatement lisible par n'importe qui**, indexé par les moteurs de recherche, et mirroré sur les forks/clones. Une fois posté, c'est très difficile à enlever proprement (l'historique Git et l'indexation persistent même après edit/delete).

**Avant de poster un artefact GitHub**, scrubber pour toute information sensible.

## Catégories à filtrer

| Catégorie | Exemples | Comment référencer à la place |
|---|---|---|
| **Credentials & secrets** | passwords, tokens, API keys, OAuth secrets, signing keys, DB password, env vars sensibles | Ne pas mentionner du tout. Si nécessaire : « la clé X stockée dans le secret K8s `pg-app` » |
| **Test credentials** | `test@fia1.fr` (ProConnect test), mots de passe dev | Référencer par description : « le compte ProConnect de test », « le mail de test du dev », « voir mémoire utilisateur » |
| **PII utilisateur** | emails réels, noms, téléphones, SIRENs de vraies entreprises | Redacter : `john.doe@company.fr` → `<email>`, `552100554` → `<SIREN>`, `0612345678` → `<phone>` |
| **Infrastructure interne** | namespace K8s avec hash (`egapro-feat-xyz-abc12`), pod names, IPs internes, dashboards Grafana / Sentry non publics | Référencer par rôle : « le pod backend de la review app », « le namespace de l'env de review » |
| **Output `kubectl logs`** | un dump brut peut contenir PII + URLs internes + stack traces tierces | Quoter seulement la ligne pertinente (type d'exception + message + fichier:ligne egapro). Pas de log block complet. |
| **Stack traces tierces** | chemins révélant Sentry/Datadog handles, container paths, infra path internes | Strip les préfixes, garder seulement les lignes du code egapro |

## Règle d'or

**Si tu hésites, demande à l'utilisateur** avant de poster. Mieux vaut un commentaire un peu plus abstrait qu'une fuite indélébile.

## Cas concrets par agent

- **`bug-analyst`** : la sous-stratégie env-specific manipule `kubectl logs` qui contient souvent du PII. **Toujours scrubber** avant de citer dans `## Analyse du bug`. Pour les screenshots de la review app, masquer/recadrer les emails et SIRENs visibles.
- **`architect`** (modes epic-* et task) : les exemples de scénarios doivent utiliser des données fictives (`SIREN 123456789`, `email@example.fr`, `Société Démo`). Les bodies de sub-issues qui citent des fichiers de migration ne doivent pas révéler des secrets stockés.
- **`product-owner`** : les scénarios `## Analyse PO` et exemples de cas limites doivent rester sur des données fictives. Vérifier que les `## Besoin métier` ne reprennent pas verbatim un échange Slack/email contenant des noms internes.
- **`code-dev`** : body de PR, commentaires de réponse aux reviewers, descriptions de commit. Les screenshots dev server (port `3001+`) sont inoffensifs s'ils n'affichent pas de données seedées avec du PII réel — vérifier la stack docker locale avant capture.

## Si une info sensible a été postée par erreur

1. **Ne pas paniquer** mais agir vite — l'indexation et les forks rendent la fuite difficile à effacer entièrement.
2. Éditer le commentaire/body pour redacter (`gh issue comment-edit`, `gh pr edit --body`, ou via UI).
3. Si la fuite est dans un **commit message** ou la **diff d'une PR** : avertir l'utilisateur immédiatement, **ne pas tenter un force-push correctif sans son accord** — c'est destructif et la fuite est déjà indexée.
4. Selon la gravité (clé API valide, PII massive) : signaler à l'utilisateur pour qu'il révoque/rotate la ressource concernée.

## Périmètre

Cette règle s'applique à **tout artefact GitHub** posté par un agent : issues, PRs, commentaires, threads de review, commit messages, titres et descriptions de branches. Elle complète `## Git hygiene` de `CLAUDE.md` (qui couvre les commits Git proprement dits) — les deux règles sont cumulatives.
