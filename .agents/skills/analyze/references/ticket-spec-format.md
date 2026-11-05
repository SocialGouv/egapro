# Format de spec d'un ticket

> Écrit par la phase **analyze** (body d'une sous-issue d'epic, ou commentaire `## Analyse architecte` sur une Task). Lu par **implement** : c'est sa précondition d'exécution et la source de sa section `## Scénarios de test`. Le gabarit du `## Analyse du bug` vit dans [`bug-analysis.md`](bug-analysis.md).

## Où vit le spec

| Type d'issue | Source du spec |
|---|---|
| **Feature** (sous-issue d'epic, type Task) | **Body** de la sous-issue |
| **Task** autonome | Body = demande originale de l'utilisateur (**intacte**) + commentaire **`## Analyse architecte`** |
| **Bug** | Body = rapport de bug (**intact**) + commentaire **`## Analyse du bug`** |

Si le spec attendu est absent, implement s'arrête et renvoie vers `/analyze <N>`. Il n'improvise pas.

---

## Ce qu'un spec doit porter

Un spec dit **quoi obtenir et sous quelles contraintes**, pas comment taper le code. Décrire les signatures, les imports et la forme du retour n'aide pas : ça contraint le dev à une solution devinée sans le fichier sous les yeux, et ça vieillit dès que le code bouge.

```markdown
## Contexte

<1 à 3 phrases : à quelle feature ce ticket appartient, le « pourquoi » métier.
Référencer l'epic parent : "Issue #NNN".>

## Fichiers impactés

<Les points d'entrée, pour démarrer au bon endroit. Liste INDICATIVE, pas un
périmètre fermé ni un plan de frappe : le dev en découvrira d'autres, c'est normal,
et il a le droit de les toucher.>

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
(`?node-id=…`) : implement construit depuis ce node et mesure le rendu contre lui.
Une URL de fichier sans node-id rend le ticket non validable visuellement.

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

<Services docker-compose en plus du core (db, minio, minio-init, mailpit, valkey). Un par ligne :

- clamavd  (antivirus — upload de fichiers)

Omettre s'il n'y a besoin que du core.>

## Complexité

**Taille : M (3 pts)** — <justification en une ligne, cf. complexity-estimation.md>
```

## Règles de rédaction

- **Un ticket = une unité cohérente.** Au-delà de ~8 critères d'acceptation, découper et exprimer le lien via `Depends on`.
- **Pas de décision architecturale rouverte** dans le ticket : l'analyse a tranché, et elle écrit *pourquoi* — un dev qui comprend la raison sait quoi faire quand la réalité du code diverge du plan.
- **Les fichiers à lire sont nommés.** « Voir le code pour comprendre » n'est pas un spec.
- **`Depends on` fixe l'ordre d'exécution.** Implement traite un sous-ticket seulement quand chacun de ses `Depends on` est squash-mergé dans `epic/<N>` (signal canonique : la branche `ticket/<T1>-*` a disparu d'origin). L'exécution n'attend jamais la review humaine d'une PR de sous-ticket.
- **Pas de cycle** dans les `Depends on`.
- **Le parent issue GitHub sert à pointer l'epic**, jamais à exprimer une dépendance entre tickets — c'est `Depends on` qui le fait.
- **Le label `complexe`** (seule définition) : plus de 5 fichiers, refacto multi-modules, perf critique ou algorithme non trivial. Le poser pour ça, pas par précaution : `/implement` le lit pour conseiller un modèle frontier et `--subagents`.
- **Données fictives** dans les exemples (`SIREN 123456789`, `email@example.fr`, « Société Démo »). Voir AGENTS.md § Hygiène git.
