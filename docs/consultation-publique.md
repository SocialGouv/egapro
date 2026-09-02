# Consultation publique EgaPro

La consultation publique expose les indicateurs dont la date de rendu public est atteinte : les six indicateurs de rémunération A à F et les écarts de représentation équilibrée (loi Rixain). L'indicateur G, les avis CSE et les données des déclarants ne sont jamais exposés.

La fiche entreprise présente ces deux familles dans deux onglets, `Rémunération` et `Représentation`, pour l'année choisie dans le sélecteur d'année. Chaque indicateur est une carte : la valeur, une barre femmes-hommes, une bulle d'aide expliquant la formule, et un dépliant « Détails des données » qui redonne les chiffres sous forme de tableau.

## Points d'accès

- interface : `/index-egapro/recherche` ;
- API de recherche : `/api/public/declarations` ;
- historique d'un SIREN : `/api/public/declarations/{siren}` ;
- représentation équilibrée : `/api/public/representations` et `/api/public/representations/{siren}` ;
- exports filtrables : `/api/public/declarations/export?format=json|csv|xlsx` ;
- export représentation : `/api/public/representations/export?format=csv|xlsx` ;
- documentation OpenAPI : `/api/public/docs` et `/api/public/openapi.json` ;
- flux RSS : `/index-egapro/actualites.xml`.

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

## Confidentialité

Pour une entreprise au statut INSEE non diffusible, les champs d'identité, de localisation et d'activité sont remplacés par `Non-diffusible`. Le SIREN, l'effectif EMA et les indicateurs restent affichés. Une entreprise étrangère diffusible affiche son pays à la place de la région et du département.

## Publication data.gouv.fr

Le CronJob `data-gouv-refresh-daily` met à jour chaque jour la ressource distante vers l'export CSV. Il est désactivé par défaut. Pour l'activer, renseigner `global.dataGouv.enabled`, `datasetId` et `resourceId`, puis créer le secret Kubernetes `data-gouv` contenant `DATA_GOUV_API_KEY`.
