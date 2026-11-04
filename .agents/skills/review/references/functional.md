# Checklist — comportement fonctionnel

Périmètre : un dev server tourne **et** le ticket a quelque chose d'observable à rejouer. Sans dev server → `skip — no dev server` (le dire). Outils : MCP `playwright` (`browser_navigate`, actions, `browser_console_messages`, `browser_network_requests`) et MCP `next-devtools` (`nextjs_call` → `get_errors`).

Tu vérifies que le comportement **visible par l'utilisateur** correspond à ce qui a été spécifié. Tu es la seconde paire d'yeux : tu ne crois pas l'implémentation sur parole, tu rejoues.

## 1. Quoi rejouer

Dans l'ordre :
1. **Scénarios PO** (`S1`, `S2`, …) du commentaire `## Analyse PO` de l'epic parent.
2. **Ticket sans scénarios** (Task ou Bug standalone) — cas normal, pas une anomalie :
   1. la section **« Vérification du correctif (one-shot) »** du commentaire `## Analyse du bug` (ou `## Analyse architecte` pour une Task), rejouée **indépendamment** ;
   2. le **comportement attendu** décrit dans le body du ticket ;
   3. les **contrôles interactifs voisins du changement** — c'est là que se logent les régressions d'un correctif de mise en page : bouton devenu inatteignable, masqué, ou hors zone de clic.

**Ne rejoue jamais un parcours complet** pour un ticket de cette taille : cible les écrans touchés par le diff. Et **jamais de PASS vide** faute de scénario : s'il n'y a vraiment rien d'observable, dis-le et justifie-le.

## 2. Dev server

Sur le port du worktree (`3001 + index`, lu dans `packages/app/.env.local`), ou 3000 dans le dépôt principal. Le démarrer si besoin. Pages authentifiées : compte ProConnect de test + `[DEV] Remplir`.

## 3. Pour chaque scénario

1. `browser_navigate` vers la route d'entrée.
2. Exécuter les actions utilisateur (click, fill, submit…).
3. Asserter le résultat **observable** : texte visible, URL, toast, état d'un champ.
4. `browser_console_messages` → erreurs console ?
5. `browser_network_requests` → requêtes en échec ?

Puis `nextjs_call` (`get_errors`) pour les erreurs de compilation et de runtime.

## Sortie

```
Fonctionnel: PASS | RETRY | REFACTO
Scénarios: S1 ✓, S2 ✗, S3 ✓   (ou: Vérification du correctif ✓, contrôles voisins ✓)
Écarts: <scénario> — attendu <…>, observé <…>
```

- `PASS` — tous les scénarios OK, aucune erreur console, aucune requête en échec.
- `RETRY` — écart mineur corrigeable (mauvais texte, état manquant), décrit précisément.
- `REFACTO` — écart structurel (scénario impossible, logique cassée à plusieurs endroits).
- Après **2 RETRY** sur le même ticket → `REFACTO`.
