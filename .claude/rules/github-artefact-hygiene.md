# GitHub Artefact Hygiene

> **Used by**: `product-owner`, `architect`, `bug-analyst`, `code-dev` — tout agent qui poste sur GitHub (issue body/title, PR body/title, commentaires, commit messages, noms de branches).

Le repo **`SocialGouv/egapro` est public** (open-source). Tout artefact GitHub est **immédiatement lisible par n'importe qui**, indexé par les moteurs de recherche, et mirroré sur les forks/clones. Une fois posté, c'est très difficile à enlever proprement (l'historique Git et l'indexation persistent même après edit/delete).

**Avant de poster un artefact GitHub**, scrubber pour toute information sensible.

---

## ⚠️ Hard rule — secrets / tokens : zéro paste, jamais

Un secret leaké sur un repo public est **considéré comme compromis dans les minutes qui suivent** (bots scanners, indexation GitHub, forks). L'éditer après-coup ne suffit **pas** — la valeur a été lue, elle doit être **révoquée et rotationnée à la source**.

**Aucun de ces formats ne doit jamais apparaître dans un artefact GitHub posté par un agent**, même partiellement, même tronqué, même en exemple :

- **GitHub tokens** : `ghp_...`, `ghs_...`, `gho_...`, `ghu_...`, `github_pat_...`
- **OpenAI / Anthropic / clés LLM** : `sk-ant-...`, `sk-proj-...`, `sk-...`
- **AWS / GCP / cloud** : `AKIA...`, clés ed25519/RSA, JSON service-account, `arn:aws:...`
- **JWTs** : tout ce qui ressemble à `eyJ...` (header.payload.signature en base64url)
- **Connection strings** : `postgres://user:password@host:5432/db`, `mongodb+srv://...`, `mysql://...`
- **`.env` values** : `SOMETHING_SECRET=...`, `STRIPE_SECRET_KEY=...`, `NEXTAUTH_SECRET=...`, `DATABASE_URL=...` côté server
- **`kubectl get secret -o yaml` output** : les valeurs sont base64 (lisible en 1 commande)
- **Headers `Authorization: Bearer ...`**, cookies de session, refresh tokens, OAuth `client_secret`
- **Mots de passe / passphrases**, même de comptes test (`test@fia1.fr` est référencé par description, pas avec son mot de passe)

**Si tu rencontres une de ces valeurs en cours de diagnostic** (logs k8s, stack trace, fichier `.env` ouvert) :
1. Ne **jamais** la copier dans un commentaire / body / commit
2. La référencer par **rôle** : « la clé Stripe stockée dans `STRIPE_SECRET_KEY` », « le token d'admin du secret K8s `gh-app-token` »
3. Si la fuite a déjà eu lieu (toi ou un autre agent / un humain) : **avertir l'utilisateur immédiatement et insister sur la rotation**, l'édit du commentaire est secondaire

**Auto-detection minimale avant tout `gh issue comment` / `gh pr create` / `gh issue edit`** : grep le texte que tu vas poster contre les patterns suivants — si match, **stop, redacter, demander à l'utilisateur** :

```bash
echo "$BODY" | grep -E '(ghp_|ghs_|gho_|ghu_|github_pat_|sk-ant-|sk-proj-|AKIA[A-Z0-9]{16}|eyJ[A-Za-z0-9_=-]{20,}\.|postgres://[^@]+:[^@]+@|Bearer\s+[A-Za-z0-9._-]{20,})' && {
    echo "STOP: secret-shaped string detected in payload, refusing to post" >&2
    return 1
}
```

---

## Autres catégories à filtrer

| Catégorie | Exemples | Comment référencer à la place |
|---|---|---|
| **Test credentials** | `test@fia1.fr` (ProConnect test), mots de passe dev | Référencer par description : « le compte ProConnect de test », « le mail de test du dev », « voir mémoire utilisateur » |
| **PII utilisateur** | emails réels, noms, téléphones, SIRENs de vraies entreprises | Redacter : `john.doe@company.fr` → `<email>`, `552100554` → `<SIREN>`, `0612345678` → `<phone>` |
| **Infrastructure interne** | namespace K8s avec hash (`egapro-feat-xyz-abc12`), pod names, IPs internes, dashboards Grafana / Sentry non publics | Référencer par rôle : « le pod backend de la review app », « le namespace de l'env de review » |
| **Output `kubectl logs`** | un dump brut peut contenir PII + URLs internes + tokens dans des headers `Authorization` + stack traces tierces | Quoter seulement la ligne pertinente (type d'exception + message + fichier:ligne egapro). **Jamais de log block complet copié-collé.** |
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
2. **Si c'est un secret / token / credential actif** : avertir l'utilisateur **immédiatement** pour qu'il **révoque et rotate** la valeur. L'édit du commentaire est **secondaire** — la valeur a déjà été scrappée par les bots scanners de GitHub dans les minutes après le push. Une rotation est obligatoire.
3. Éditer le commentaire/body pour redacter (`gh issue comment-edit`, `gh pr edit --body`, ou via UI). Important pour ne pas re-fuiter à de nouveaux lecteurs, mais ne suffit **pas** à régler une fuite de secret active.
4. Si la fuite est dans un **commit message** ou la **diff d'une PR** : avertir l'utilisateur immédiatement, **ne pas tenter un force-push correctif sans son accord** — c'est destructif et la fuite est déjà indexée.
5. Selon la gravité (clé API valide, PII massive) : signaler à l'utilisateur pour qu'il révoque/rotate la ressource concernée et — si pertinent — qu'il déclenche un audit log de l'usage de la clé entre le moment du leak et celui de la rotation.

## Périmètre

Cette règle s'applique à **tout artefact GitHub** posté par un agent : issues, PRs, commentaires, threads de review, commit messages, titres et descriptions de branches. Elle complète `## Git hygiene` de `CLAUDE.md` (qui couvre les commits Git proprement dits) — les deux règles sont cumulatives.
