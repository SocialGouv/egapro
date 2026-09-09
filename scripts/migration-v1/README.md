# Kit de reprise des données V1

Ce répertoire est un kit autonome pour reprendre, à partir d'un dump
PostgreSQL V1 privé :

- les déclarations de représentation équilibrée ;
- l'annuaire complet des référents.

L'exploitation ne dépend ni de Node.js, ni de pnpm, ni d'un accès simultané
aux bases V1 et V2. Le dump est restauré dans un PostgreSQL 14.17 jetable, puis
transformé en un instantané CSV contrôlé avant toute connexion à la V2.

## Prérequis

- Bash 4 ou plus récent ;
- Docker pour créer l'instantané ;
- `psql` 14 ou plus récent pour la simulation et l'import ;
- `sha256sum` ou `shasum` ;
- un service libpq donnant accès à la V2 avec les droits de lecture et
  d'écriture sur les tables du jeu sélectionné : `app_company` et
  `app_representation_declaration` pour `repeq`, `app_referent` pour les
  référents.

Le kit est testé avec PostgreSQL 14.17. Un dump créé par une version plus
récente peut ne pas être lisible par `pg_restore` 14. Les deux tables reprises
n'utilisent pas d'extension pendant la restauration sélective ; les autres
objets du dump ne sont pas restaurés.

## Dump accepté

Le format recommandé est un dump custom d'une base V1, par exemple :

```bash
pg_dump --format=custom --no-owner --no-privileges --file=v1.dump NOM_BASE_V1
```

Un dump custom complet est accepté : seules les données des tables
`public.representation_equilibree` et `public.referent` sont restaurées dans un
schéma minimal maîtrisé par le kit.

Le format plain n'est accepté que s'il s'agit d'un dump `--data-only` limité à
une ou aux deux tables de reprise et produit au format `COPY` standard :

```bash
pg_dump --format=plain --data-only --no-owner --no-privileges \
  --table=public.representation_equilibree --table=public.referent \
  --file=v1-data.sql NOM_BASE_V1
```

Le fichier plain est analysé intégralement selon une liste blanche stricte. Le
kit n'exécute jamais le fichier fourni : il restaure un fichier intermédiaire
ne contenant que les blocs `COPY` attendus, avec les noms de tables et les
colonnes exactes de la V1. Toute autre instruction, commande psql, table,
colonne, duplication ou bloc tronqué est refusé. Les données situées à
l'intérieur d'un bloc `COPY` restent des données, même si leur texte ressemble
à du SQL.

Les dumps `pg_dumpall`, les dumps plain contenant du DDL et les archives
directory/tar ne sont pas pris en charge. Le format custom reste recommandé,
car il porte un catalogue que `pg_restore` peut filtrer explicitement. Le kit
n'essaie jamais de réécrire des rôles, propriétaires ou commandes SQL
arbitraires.

## Jeux de données

L'option `--dataset` accepte trois valeurs :

- `all` : représentations équilibrées et référents ;
- `repeq` : représentations équilibrées uniquement ;
- `referents` : référents uniquement.

Pour `export`, la valeur par défaut est `all`. Pour `dry-run` et `apply`, la
valeur par défaut est celle enregistrée dans l'instantané. Un instantané `all`
peut donc être appliqué en une fois ou en deux opérations séparées. Un
instantané limité à une partie ne peut pas servir à importer l'autre partie.

## 1. Créer l'instantané

Travailler dans un répertoire privé, hors du dépôt Git :

```bash
mkdir -m 700 reprise-egapro
cp -R /chemin/prive/migration-v1 reprise-egapro/
cp /chemin/prive/v1.dump reprise-egapro/
cd reprise-egapro

./migration-v1/migrate.sh export \
  --dump "$PWD/v1.dump" \
  --format custom \
  --out "$PWD/v1-snapshot"
```

Par défaut, toutes les déclarations du dump sont exportées. Une plage
optionnelle, dont la borne basse est incluse et la borne haute exclue, peut être
fixée avec des instants explicites :

```bash
./migration-v1/migrate.sh export \
  --dump "$PWD/v1.dump" \
  --format custom \
  --out "$PWD/v1-snapshot-2024" \
  --declared-at-gte '2024-01-01T00:00:00Z' \
  --declared-at-lt '2025-01-01T00:00:00Z'
```

Cette plage ne concerne que `representation_equilibree`. L'annuaire des
référents sélectionné est toujours exporté en totalité ; un annuaire vide est
refusé. Les bornes temporelles sont refusées avec `--dataset referents`.

Pour créer deux instantanés indépendants à partir du même dump :

```bash
./migration-v1/migrate.sh export \
  --dump "$PWD/v1.dump" \
  --format custom \
  --dataset repeq \
  --out "$PWD/v1-snapshot-repeq"

./migration-v1/migrate.sh export \
  --dump "$PWD/v1.dump" \
  --format custom \
  --dataset referents \
  --out "$PWD/v1-snapshot-referents"
```

Avec un dump custom, seule la table sélectionnée est restaurée. Avec un dump
plain, le fichier peut contenir une ou les deux tables ; les données non
sélectionnées sont ignorées.

Le répertoire créé contient exactement :

- `manifest.txt` : version du format, jeu de données, date, bornes, compteurs et
  empreinte du dump ;
- `representations.csv` et `referents.csv` : données privées ;
- `SHA256SUMS` : empreintes des trois fichiers précédents.

Les quatre fichiers sont toujours présents. Dans un instantané limité à une
partie, le CSV de la partie omise contient uniquement son en-tête et son
compteur vaut zéro. Le kit accepte aussi les instantanés de format 1 comme des
instantanés combinés ; les nouveaux exports utilisent le format 2.

Les sommes de contrôle détectent une modification accidentelle ou ultérieure,
mais ne prouvent pas l'origine des fichiers. Le conteneur PostgreSQL temporaire
n'expose aucun port et est supprimé en cas de succès comme d'échec.

## 2. Vérifier le transfert

Après chaque copie de l'instantané :

```bash
./migration-v1/migrate.sh verify --snapshot "$PWD/v1-snapshot"
```

La commande refuse un lien symbolique, un fichier supplémentaire, un manifeste
inconnu ou une somme incorrecte. Ne jamais déposer le dump, l'instantané ou les
journaux dans GitHub, dans une CI publique ou dans un canal non homologué pour
ces données.

## 3. Configurer l'accès V2

Utiliser un service libpq, sans mot de passe dans la ligne de commande. Exemple
de `pg_service.conf` :

```ini
[egapro-v2-production]
host=HOTE_V2
port=5432
dbname=NOM_BASE_V2
user=ROLE_REPRISE
sslmode=require
```

Le mot de passe peut être placé dans un fichier pgpass privé :

```text
HOTE_V2:5432:NOM_BASE_V2:ROLE_REPRISE:MOT_DE_PASSE
```

```bash
chmod 600 "$PWD/pgpass"
export PGSERVICEFILE="$PWD/pg_service.conf"
```

Les certificats et options libpq propres à l'infrastructure peuvent être
ajoutés au service. Aucun secret n'est écrit dans l'instantané ou dans le
rapport standard.

## 4. Répéter puis simuler

Effectuer d'abord la procédure complète sur une base V2 jetable ou une copie de
préproduction. Sur la cible choisie :

```bash
./migration-v1/migrate.sh dry-run \
  --snapshot "$PWD/v1-snapshot" \
  --service egapro-v2-production \
  --pgpass "$PWD/pgpass"
```

Le rapport ne contient que des compteurs :

```text
mode=dry-run
dataset=all
representations.read=...
representations.insert=...
representations.update=...
representations.skip_native=...
representations.skip_unchanged=...
companies.insert=...
representations.unresolved_region=...
representations.unresolved_department=...
referents.read=...
referents.before=...
referents.delete_without_source=...
referents.replace=true|false
```

La simulation charge seulement des tables temporaires et ne modifie aucune
donnée persistante. Elle valide aussi le schéma cible, les types, les codes et
les longueurs. Son résultat reste indicatif : l'état V2 peut changer avant
l'import réel, qui recalcule donc le plan sous verrou.

Pour simuler séparément les deux parties depuis l'instantané combiné :

```bash
./migration-v1/migrate.sh dry-run \
  --snapshot "$PWD/v1-snapshot" \
  --dataset repeq \
  --service egapro-v2-production \
  --pgpass "$PWD/pgpass"

./migration-v1/migrate.sh dry-run \
  --snapshot "$PWD/v1-snapshot" \
  --dataset referents \
  --service egapro-v2-production \
  --pgpass "$PWD/pgpass"
```

Le rapport indique `dataset=all|repeq|referents` et ne présente que les
compteurs de la partie effectivement sélectionnée. Les compteurs
`unresolved_region` et `unresolved_department` recensent les codes V1 non vides
qui ne figurent pas dans les référentiels du kit. La migration reste possible :
le libellé et, pour la région, le code V2 restent alors nuls afin de ne pas
inventer de correspondance.

`referents.delete_without_source` indique le nombre de référents présents en
V2 dont l'identifiant n'existe pas dans l'instantané V1. Il faut faire valider
explicitement ce compteur avant de remplacer l'annuaire.

## 5. Importer en production

Avant l'import :

1. disposer d'une sauvegarde V2 récente et d'une procédure de restauration
   testée ;
2. faire valider les compteurs du dry-run ;
3. suspendre les écritures de représentation équilibrée et d'administration
   des référents pendant la fenêtre de reprise.

Puis exécuter exactement le même instantané :

```bash
./migration-v1/migrate.sh apply \
  --snapshot "$PWD/v1-snapshot" \
  --service egapro-v2-production \
  --pgpass "$PWD/pgpass"
```

Si `referents.delete_without_source` est supérieur à zéro, l'import incluant
les référents s'arrête sans aucune écriture. Après vérification que ces lignes
V2 doivent bien être supprimées, relancer avec l'accord destructif explicite :

```bash
./migration-v1/migrate.sh apply \
  --snapshot "$PWD/v1-snapshot" \
  --service egapro-v2-production \
  --pgpass "$PWD/pgpass" \
  --allow-referent-deletions
```

L'option ne s'applique qu'à `apply`; le dry-run affiche toujours le compteur
sans exiger d'option.

L'import peut également être séparé :

```bash
./migration-v1/migrate.sh apply \
  --snapshot "$PWD/v1-snapshot" \
  --dataset repeq \
  --service egapro-v2-production \
  --pgpass "$PWD/pgpass"

./migration-v1/migrate.sh apply \
  --snapshot "$PWD/v1-snapshot" \
  --dataset referents \
  --service egapro-v2-production \
  --pgpass "$PWD/pgpass"
```

Chaque invocation utilise une seule transaction et ne verrouille que la table
du jeu sélectionné. Le mode `all` verrouille les déclarations de représentation
puis les référents et garantit un rollback commun. Deux imports séparés ont
deux transactions indépendantes : le succès du premier n'est pas annulé si le
second échoue. La table des entreprises n'est jamais verrouillée en totalité.
Une attente de verrou supérieure à dix secondes interrompt l'opération.

Les entreprises absentes sont créées sans modifier les entreprises existantes.
Une déclaration saisie nativement en V2 (`imported_from_v1_at IS NULL`) n'est
jamais écrasée. Une déclaration déjà reprise n'est mise à jour que si son
`modified_at` V1 est plus récent que son `updated_at` V2. L'annuaire des
référents est remplacé en totalité seulement si son contenu diffère et si les
éventuelles suppressions de lignes propres à la V2 ont été acceptées. Un code
département vide d'un référent V1 est normalisé en `NULL`.

Une représentation soumise doit fournir les deux pourcentages de chaque
catégorie ou un motif de non-calculabilité. Son année V1, l'année portée dans
le JSON et l'année de fin de période doivent coïncider. Les périodes se
terminant un 29 février commencent le 1er mars de l'année précédente, ce qui
forme douze mois consécutifs valides en V2. Les e-mails et URL invalides sont
refusés plutôt que corrigés implicitement.

En mode `all`, une erreur, même pendant la dernière insertion, annule les
changements des deux jeux de données. En mode séparé, elle annule uniquement
l'invocation en cours. La commande n'annonce le succès qu'après réception du
`COMMIT`. Si la connexion tombe pendant ce `COMMIT`, le résultat est
indéterminé : vérifier les compteurs en relançant `dry-run`, puis relancer le
même `apply` si nécessaire. La relance d'un instantané identique est
idempotente.

Il n'existe pas de commande d'annulation automatique après un import validé :
la restauration relève de la procédure de sauvegarde V2 préparée avant la
bascule.

## Diagnostics et nettoyage

En cas d'échec ou d'interruption de l'export, le répertoire privé
`.partial.*` est supprimé automatiquement. En cas d'échec V2, un fichier
`migration-v1-*-failure-*.log`, en mode 600, est écrit à côté de l'instantané.
Ces diagnostics restent privés et peuvent contenir des détails PostgreSQL ; ils
ne doivent pas être joints à une issue ou une PR publique. Le dump,
l'instantané et leurs diagnostics doivent rester dans le répertoire privé hors
du dépôt Git indiqué au début de cette procédure.

Après validation fonctionnelle et expiration de la durée de conservation
convenue, supprimer le dump, les instantanés, les journaux, le fichier pgpass et
les éventuels répertoires `.partial.*` résiduels par la procédure sécurisée de
l'organisation. Avant la production, répéter l'ensemble du scénario avec un
dump représentatif, y compris le dry-run, l'import, les compteurs métier et une
relance idempotente.
