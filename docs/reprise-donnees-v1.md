# Reprise des données V1

La reprise de production des déclarations de représentation équilibrée et de
l'annuaire des référents s'effectue depuis un dump PostgreSQL V1 privé. Elle est
découpée en trois phases indépendantes :

1. restauration isolée du dump et création d'un instantané à un instant T ;
2. contrôle de l'intégrité et simulation sur la V2 ;
3. import transactionnel du même instantané dans la V2.

Le kit autonome, ses prérequis et toutes les commandes opérateur sont décrits
dans [`scripts/migration-v1/README.md`](../scripts/migration-v1/README.md). Il
utilise Bash, Docker et les outils PostgreSQL standards ; aucune installation
des dépendances de l'application ni connexion simultanée aux deux productions
n'est nécessaire. Les deux jeux de données peuvent être exportés et importés
ensemble ou séparément.

Le script historique `pnpm --filter app import:v1-representation`, déjà présent
sur `alpha`, reste un outil développeur pour une lecture directe de deux bases.
Il ne constitue pas la procédure de reprise de production.

Le dump, l'instantané, les journaux et les paramètres de connexion contiennent
ou donnent accès à des données privées. Ils doivent être transférés par un canal
sécurisé et ne doivent jamais être ajoutés à ce dépôt public ou aux artefacts de
CI.
