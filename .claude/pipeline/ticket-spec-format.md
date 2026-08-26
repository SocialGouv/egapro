# Format de spec d'un ticket

> **Pipeline only.** Écrit par `architect` (body en mode epic-*, commentaire `## Analyse architecte` en mode task). Lu par `code-dev` (précondition d'exécution, et source de sa section `## Scénarios de test`) et le skill `/analyse`. Le gabarit du `## Analyse du bug` de `bug-analyst` n'est pas ici — il vit dans son propre AGENT.md ; seule la table ci-dessous, qui dit où trouver le spec selon le type d'issue, le concerne.

Selon le type d'issue, le spec ne vit pas au même endroit :

| Type d'issue | Source du spec |
|---|---|
| **Feature** (sub-issue d'epic) | **Body** de la sub-issue, écrit par l'architect en mode epic-* |
| **Task** | Body = demande originale de l'utilisateur (intacte) + commentaire **`## Analyse architecte`** |
| **Bug** | Body = rapport de bug (intact) + commentaire **`## Analyse du bug`** (root cause + fix proposé ; le protocole `rules/bug-fix-workflow.md` prend le relais) |

Si le spec attendu est absent, `code-dev` remet le ticket en **To Do** avec la liste des manques. Il n'improvise pas.

---

## Ce qu'un spec doit porter

Un spec dit **quoi obtenir et sous quelles contraintes**, pas comment taper le code. Décrire les signatures, les imports et la forme du retour n'aide pas un dev capable — ça le contraint à une solution que l'architecte a devinée sans avoir le fichier sous les yeux, et ça vieillit dès que le code bouge.

```markdown
## Contexte

<1 à 3 phrases : à quelle feature ce ticket appartient, le « pourquoi » métier.
Référencer l'epic parent : "Issue #NNN".>

## Fichiers impactés

<Les points d'entrée, pour que le dev démarre au bon endroit — pas un plan de frappe exhaustif.
Il en découvrira d'autres, c'est normal.>

- `~/modules/<feature>/<Name>.tsx` (création)
- `~/server/api/routers/<name>.ts` (modification)

## Changement attendu

<Le comportement visé et ses limites : ce que l'utilisateur doit pouvoir faire, les
cas de bord qui comptent, les invariants métier à respecter, les décisions
d'architecture déjà tranchées (et pourquoi). Ce qui est laissé au dev est laissé
explicitement.>

## Scénarios de test

<Les scénarios PO de l'epic par identifiant (`S1`, `S2`), plus ceux propres au
ticket en Gherkin simplifié :

- **Étant donné** … (état initial)
- **Quand** … (action utilisateur)
- **Alors** … (résultat observable)>

## Référence Figma

<Obligatoire dès que le ticket touche de l'UI. Une entrée = **un node précis**
(`?node-id=…`) : `code-dev` construit depuis ce node et `design-validator` mesure
le rendu contre lui. Une URL de fichier sans node-id rend le ticket non validable
visuellement.

- Écran principal : <URL avec node-id>
- État vide / erreur / mobile : <URL avec node-id>

Si pas d'UI : "N/A".>

## Critères d'acceptation

<Uniquement ce qui est **propre à ce ticket** et vérifiable. Typecheck, tests, lint
et rejeu des scénarios sont garantis par les gates sur *tous* les tickets — les
recopier ici ne les rend pas plus vrais.>

- [ ] <critère observable 1>
- [ ] <critère observable 2>

## Depends on

<Tickets dont le code ou le schéma doit exister avant celui-ci. Un par ligne :

- #<N1>

Omettre la section s'il n'y a aucune dépendance.>

## Requires services

<Services docker-compose en plus du core (db, minio, maildev, valkey). Un par ligne :

- clamavd  (antivirus — upload de fichiers)

Omettre s'il n'y a besoin que du core.>
```

## Règles de rédaction

- **Un ticket = une unité cohérente.** Au-delà de ~8 critères d'acceptation, découper et exprimer le lien via `Depends on`.
- **Pas de décision architecturale rouverte** dans le ticket : l'architecte a tranché, et il écrit *pourquoi* — un dev qui comprend la raison sait quoi faire quand la réalité du code diverge du plan.
- **Les fichiers à lire sont nommés.** « Voir le code pour comprendre » n'est pas un spec.
- **`Depends on` gate le dispatch.** `dispatch_plan.sh` parse cette section : `T2` part dès que `T1` est squash-mergé dans `epic/<N>` (signal canonique : la branche `ticket/<T1>-*` a disparu d'origin). L'exécution n'attend jamais la review humaine d'une PR de sous-ticket.
- **Le parent issue GitHub sert à pointer l'epic**, jamais à exprimer une dépendance entre tickets — c'est `Depends on` qui le fait.
- **Le label `complexe`** bascule `code-dev` sur Opus. Le poser quand le ticket demande un raisonnement multi-étapes non trivial (refacto transverse, perf critique, algo), pas par précaution.
