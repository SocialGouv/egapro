# Hygiène des artefacts git

> **Toutes sessions.** S'applique à tout ce qu'on poste : body/titre d'issue ou de PR, commentaires, threads de review, messages de commit, noms de branches.

**`SocialGouv/egapro` est un dépôt public.** Tout artefact posté est immédiatement lisible, indexé par les moteurs de recherche et mirroré sur les forks. Un édit après coup ne l'efface ni de l'historique ni de l'indexation.

## Hard rule — secrets : zéro paste, jamais

Un secret leaké sur un dépôt public est **compromis dans les minutes qui suivent** (bots scanners, indexation, forks). L'éditer ne suffit **pas** : la valeur a été lue, elle doit être **révoquée et rotationnée à la source**.

Aucune de ces formes ne doit apparaître dans un artefact, même tronquée, même en exemple : tokens GitHub (`ghp_`, `ghs_`, `gho_`, `ghu_`, `github_pat_`), clés LLM (`sk-ant-`, `sk-proj-`, `sk-`), clés cloud (`AKIA…`, clés ed25519/RSA, service-account JSON), JWT (`eyJ…`), connection strings (`postgres://user:pwd@…`), valeurs de `.env`, output de `kubectl get secret` (base64 = lisible en une commande), headers `Authorization: Bearer …`, cookies de session, `client_secret`, mots de passe — y compris ceux de comptes de test.

Si tu croises une de ces valeurs en diagnostic : ne la copie nulle part, référence-la par **rôle** (« la clé stockée dans `STRIPE_SECRET_KEY` », « le token du secret K8s `gh-app-token` »). Si la fuite a déjà eu lieu — par toi ou par quelqu'un d'autre — **avertis l'utilisateur immédiatement et insiste sur la rotation** ; l'édit du commentaire est secondaire. Si la fuite est dans un message de commit ou une diff, ne tente **pas** de force-push correctif sans son accord.

Avant tout `gh issue comment` / `gh pr create` / `gh issue edit`, passer le payload au filtre :

```bash
echo "$BODY" | grep -E '(ghp_|ghs_|gho_|ghu_|github_pat_|sk-ant-|sk-proj-|AKIA[A-Z0-9]{16}|eyJ[A-Za-z0-9_=-]{20,}\.|postgres://[^@]+:[^@]+@|Bearer\s+[A-Za-z0-9._-]{20,})' && {
    echo "STOP: secret-shaped string detected in payload, refusing to post" >&2
    return 1
}
```

## Le reste à scrubber

| Catégorie | Référencer par |
|---|---|
| Credentials de test (`test@fia1.fr`, mots de passe dev) | une description : « le compte ProConnect de test » |
| PII (emails, noms, téléphones, SIRENs réels) | `<email>`, `<SIREN>`, `<phone>` |
| Infra interne (namespace K8s avec hash, noms de pods, IPs, dashboards Sentry/Grafana) | un rôle : « le pod backend de la review app » |
| Output `kubectl logs` brut | la seule ligne pertinente (exception + message + `fichier:ligne` egapro). **Jamais un bloc complet.** |
| Stack traces tierces | les lignes du code egapro uniquement |

Les données d'exemple sont fictives : `SIREN 123456789`, `email@example.fr`, `Société Démo`. Les screenshots (dev server, review app) ne doivent montrer que de la donnée seedée — vérifier avant capture, masquer ou recadrer les emails et SIRENs visibles.

**Si tu hésites, demande à l'utilisateur avant de poster.** Mieux vaut un commentaire un peu abstrait qu'une fuite indélébile.
