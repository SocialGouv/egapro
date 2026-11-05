# Option `--subagents`

**Seulement si l'argument du skill contient `--subagents`.** Sans le flag, tu fais tout dans ta session et tu ne lances aucun sous-agent. Le flag se transmet : `/implement <N> --subagents` lance la revue de l'étape 6 avec `--subagents`.

Le but : garder ta session légère sur un gros diff. Le prix : chaque sous-agent recharge `AGENTS.md` (~8 k tokens). Ça vaut le coup à partir d'environ 10 fichiers ou 3 checklists, pas sur un petit correctif.

## Ce qui se délègue, et rien d'autre

| Skill | Tâche déléguée | Un sous-agent par |
|---|---|---|
| `/review gates` (et l'étape 6 de `/implement`) | les checklists **structure**, **sécurité**, **accessibilité** retenues à l'étape 3 | checklist |
| `/analyze` | une question d'exploration du code : où vit une règle, qui appelle une fonction, quels fichiers un changement touche | question |

**Jamais délégué** :
- écrire ou modifier du code, des tests, des E2E ;
- `pnpm verify` : il tourne dans ta session, avant tout sous-agent, et `FAIL` arrête tout ;
- les checklists **fidélité Figma** et **fonctionnel** : elles pilotent un navigateur partagé, elles restent dans ta session, après les autres ;
- toute écriture GitHub (issue, commentaire, PR, board), toute question à l'utilisateur, toute décision métier.

## Comment

- Le sous-agent **générique** de ton outil (Claude Code : outil Agent, type `general-purpose` ; OpenCode : sous-agent `general`). Aucun fichier d'agent propre au dépôt.
- Lance-les **tous dans le même message**, pour qu'ils tournent en parallèle.
- Ton outil n'a pas de sous-agents → exécute chaque brief toi-même, l'un après l'autre. Le rapport final est le même.
- **Recopie le brief tel quel** et remplis seulement les `<…>`. N'ajoute pas ton avis sur ce qu'il va trouver.

### Brief : une checklist de revue

```
Revue en lecture seule. Ne modifie aucun fichier ; aucun commit, push, ni commande gh qui écrit.
Dépôt : <chemin absolu du worktree>. Base : <BASE>.
Fichiers du diff : <liste de l'étape 1>.
Ticket : <#N ou « aucun »> (gh issue view <N> --comments si la checklist a besoin du spec).

1. Lis en entier <chemin de la référence, ex. .agents/skills/review/references/security.md>.
2. Applique-la aux fichiers du diff uniquement : git diff $(git merge-base HEAD <BASE>) -- <fichier>. Lis le code autour si besoin.
3. Rends EXACTEMENT, rien d'autre :
Gate: <nom> — <verdict selon la référence>
- [SÉVÉRITÉ] fichier:ligne — description → correctif
Risques résiduels: <liste ou « aucun »>

Pas de fichier:ligne vérifiable = pas de constat. Ne recopie pas de code, pas de résumé.
```

### Brief : une question d'exploration

```
Recherche en lecture seule. Ne modifie aucun fichier.
Dépôt : <chemin absolu>. Question : <une seule question, précise>.
Rends au plus 10 lignes ; chaque affirmation porte un fichier:ligne.
Pas trouvé → écris « introuvable » et ce que tu as cherché. Ne recopie pas le contenu des fichiers.
```

## Agrégation

- **Vérifie toi-même chaque constat bloquant** (ERROR, NEEDS WORK, VULNERABLE) en ouvrant son `fichier:ligne` avant de le garder : un sous-agent se trompe aussi. Constat introuvable → écarté, et noté « écarté : non vérifiable » sous le rapport.
- Réponse hors format → relance ce sous-agent une fois ; toujours hors format → fais la checklist toi-même.
- Reporte les constats retenus tels quels dans le gabarit de rapport de `SKILL.md`. Le verdict global suit la règle habituelle.
- Exploration : la réponse est une piste, pas une preuve. Ouvre le `fichier:ligne` avant de l'écrire dans un spec.
