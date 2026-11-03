# Consultation publique EgaPro

La consultation publique expose les indicateurs dont la date de rendu public est atteinte : les six indicateurs de rémunération A à F et les écarts de représentation équilibrée (loi Rixain). L'indicateur G, les avis CSE et les données des déclarants ne sont jamais exposés.

La fiche entreprise présente ces deux familles dans deux onglets, `Rémunération` et `Représentation`, pour l'année choisie dans le sélecteur d'année. Chaque indicateur est une carte : la valeur, une barre femmes-hommes, une bulle d'aide expliquant la formule, et un dépliant « Détails des données » qui redonne les chiffres sous forme de tableau.

## Points d'accès

- interface : `/index-egapro/recherche` ;
- export filtrable des indicateurs de rémunération : `/api/public/declarations/export?format=json|csv|xlsx` ;
- documentation OpenAPI : `/api/public/docs` et `/api/public/openapi.json` ;
- flux RSS : `/index-egapro/actualites.xml`.

La représentation équilibrée n'est exposée par aucune API publique : elle se consulte sur la fiche entreprise et sur data.gouv.fr. Les jeux de données complets sont publiés sur data.gouv.fr : [index égalité professionnelle](https://www.data.gouv.fr/datasets/index-egalite-professionnelle-f-h-des-entreprises-de-50-salaries-ou-plus) et [représentation équilibrée](https://www.data.gouv.fr/datasets/representation-equilibree-f-h-dans-les-postes-de-direction-des-grandes-entreprises).

Les facettes `region`, `departement` et `naf` sont répétables — `?region=11&region=84` filtre sur l'une ou l'autre — et acceptent toujours la forme scalaire historique. `workforceRanges` filtre sur les tranches d'effectif de l'observatoire (`<50`, `50-99`, `100-249`, `250-999`, `1000+`), plusieurs tranches étant elles aussi combinées en « ou ».

L'accès anonyme est limité à 120 appels par minute et par adresse IP. Un jeton présent dans `EGAPRO_PUBLIC_API_TOKENS` peut être envoyé avec `Authorization: Bearer …` et porte le quota à 1 200 appels par minute. Valkey partage le compteur entre réplicas ; en son absence, un compteur mémoire conserve une protection locale.

## Données de démonstration

Après avoir démarré PostgreSQL et appliqué les migrations, charger le jeu de données de l'Observatoire depuis la racine du dépôt :

```bash
pnpm db:seed-observatory
```

La commande crée trente entreprises réservées aux tests (`998900001` à `998900030`), cinquante-cinq déclarations de rémunération sur quatre années et trente déclarations de représentation. Le jeu couvre trois pages de dix résultats et deux pages de vingt-cinq résultats, les filtres géographiques, NAF et effectif, des effectifs qui évoluent selon l'année, les historiques avec valeurs positives, négatives, nulles ou égales à zéro, une représentation non calculable, une entreprise non-diffusible, une entreprise étrangère et une entreprise sans historique.

- recherche et filtres : `http://localhost:3000/index-egapro/recherche` ;
- fiche entreprise et ses deux onglets : `http://localhost:3000/index-egapro/entreprise/998900001` ;
- confidentialité : `http://localhost:3000/index-egapro/entreprise/998900003`.

Une année de référence peut être choisie avec `pnpm db:seed-observatory -- --year=2025`. Pour supprimer uniquement les entreprises et déclarations de démonstration :

```bash
pnpm db:seed-observatory -- --clean
```

Les review apps éphémères de branche utilisent l'environnement `dev` : un Job Helm post-déploiement y exécute automatiquement le même seed, de façon idempotente. Le seed reste désactivé par défaut dans les valeurs communes et n'est donc pas exécuté en préproduction ou en production.

## Historique des SIREN de l'audit RGAA

Les dix SIREN `purpose: "rgaa"` de `packages/app/data/dedicated-test-sirens.json` sont de vraies entreprises, créées par l'import GIP du déploiement, qui n'importe que l'année de campagne courante. Sans historique, le sélecteur d'année, les courbes et l'onglet `Représentation` de leur fiche ne sont pas auditables. Le script suivant leur injecte les campagnes passées :

```bash
pnpm --filter app db:seed-rgaa-history -- --campaign-year=2026
```

`--campaign-year` est obligatoire et doit être l'année de campagne de l'environnement (celle de `EGAPRO_RECETTE_CAMPAIGN_YEAR` quand elle est épinglée) : un an d'écart écrirait l'historique sur l'année que les auditeurs déclarent. `--years=<N>` (3 par défaut, 10 au plus) fixe la profondeur, des années C-N à C-1. Pour une campagne C :

- une déclaration de rémunération publiée par entreprise et par année, de C-N à C-1, avec l'effectif EMA correspondant ;
- une déclaration de représentation pour les six entreprises de 1 000 salariés et plus, sur les années de référence C-N à C-2 — la référence C-1 relève de la campagne C, remplie par l'auditeur ;
- chaque année d'historique reçoit une date de rendu public passée ; une date nulle ou future est ramenée dans le passé, et l'année est listée.

L'année C, la référence C-1 et la table `app_company` ne sont jamais écrites. Le script refuse d'écrire si la base ne porte pas le jeu de démonstration de l'Observatoire (il n'existe qu'en environnement `dev`), ou si l'une des dix entreprises n'a pas encore été créée par l'import GIP. Il ne possède que ses propres lignes : une déclaration, une représentation ou une ligne GIP déjà présente est laissée intacte et listée. Chaque exécution commence par supprimer toutes ses lignes d'un run précédent, quels qu'aient été son année de campagne ou sa profondeur : deux exécutions identiques laissent la base identique, et `--clean` retire uniquement ses lignes. Si un auditeur a rattaché un fichier, un avis CSE ou des catégories d'emploi à une déclaration d'historique, cette suppression échoue et le script s'arrête sans rien écrire.

Effet de bord assumé : dans Mon espace, les années d'historique apparaissent parmi les démarches terminées, avec un récapitulatif téléchargeable, un PDF « données préremplies » limité à l'effectif et une page d'historique vide.

Sur `rgaa-persist`, depuis un poste ayant accès au cluster, la base est jointe par `port-forward` et l'URL reconstruite à partir du secret `pg-app` du namespace, sans jamais l'écrire ailleurs que dans la variable du processus :

```bash
kubectl -n egapro-rgaa-persist port-forward svc/pg-rw 15432:5432 &
DATABASE_URL=$(kubectl -n egapro-rgaa-persist get secret pg-app \
    -o jsonpath='{.data.DATABASE_URL}' | base64 -d \
    | sed "s|@[^/]*|@localhost:15432|") \
  pnpm --filter app db:seed-rgaa-history -- --campaign-year=2026
```

À relancer après chaque remise à zéro de la base `rgaa-persist`.

## Confidentialité

Pour une entreprise au statut INSEE non diffusible, les champs d'identité, de localisation et d'activité sont remplacés par `Non-diffusible`. Le SIREN, l'effectif EMA et les indicateurs restent affichés. Une entreprise étrangère diffusible affiche son pays à la place de la région et du département.

## Publication data.gouv.fr

Le CronJob `data-gouv-refresh-daily` met à jour chaque jour la ressource distante vers l'export CSV. Il est désactivé par défaut. Pour l'activer, renseigner `global.dataGouv.enabled`, `datasetId` et `resourceId`, puis créer le secret Kubernetes `data-gouv` contenant `DATA_GOUV_API_KEY`.
