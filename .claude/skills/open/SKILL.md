---
name: open
description: "Recreate a worktree for a given PR to test it locally — useful after /epic auto-cleaned the worktree. Usage: /open <PR>"
---

# /open <PR>

Recreate the egapro worktree associated with a PR — typically one that was auto-cleaned by `/epic` after the sub-agent returned `validated`. Use this to **test the PR's code locally** : run the dev server, exercise the feature, debug issues before merging.

## Arguments

`$ARGUMENTS` — PR number (`#3341`, `3341`). Required.

---

## Ton rôle

Tu es **un thin wrapper**. Toute la logique est dans `scripts/orchestration/open_worktree.sh`. Tu dois :

1. Valider que l'argument est un nombre de PR
2. Lancer le script
3. Relayer son output à l'utilisateur (path + URLs)

```bash
PR=$ARGUMENTS  # strip leading #
PR=${PR#\#}

if ! [[ "$PR" =~ ^[0-9]+$ ]]; then
    echo "ERROR: argument must be a PR number"
    exit 1
fi

bash scripts/orchestration/open_worktree.sh "$PR"
```

Le script :
- Résout la branche head + le ticket linked + l'epic parent
- Choisit le premier slot libre dans `[0, EPIC_MAX_PARALLEL[`
- Recrée le worktree (idempotent : réutilise s'il existe)
- Lance `setup-worktree.sh` si `.env.local` est manquant (pnpm install + docker stack + migrations)
- Affiche le path + les URLs (dev server, maildev, minio, postgres)

---

## Cas d'usage typiques

- **Tester une PR ouverte** avant de la merger : `/open 3341` → worktree recréé, dev server prêt sur `http://localhost:3001` (ou autre selon le slot)
- **Reprendre un debug** sur une PR rejetée par CI : `/open <PR>` puis `cd <path>` et bidouiller
- **Reproduire un bug** sur le code d'une PR mergée mais qui pose problème en preprod : `/open <PR>` même après merge — la branche reste sur le remote

---

## Limitations

- Si tous les slots `[0, EPIC_MAX_PARALLEL[` sont occupés (par d'autres worktrees actifs), le script retourne une erreur. Libérer un slot via `git worktree remove ../egapro-epic*-tXXX` ou augmenter `EPIC_MAX_PARALLEL`.
- Si la PR a été créée hors de la pipeline `/epic` (pas de ticket lié, pas d'epic parent), le script échoue. Cas limite — créer le worktree à la main dans ce cas.

---

## Référence

- Script : `scripts/orchestration/open_worktree.sh`
- Setup docker : `scripts/setup-worktree.sh`
- Cleanup auto par la pipeline : `scripts/orchestration/cleanup_terminal_worktrees.sh` (appelé à chaque tick par `epic_loop.sh`)
