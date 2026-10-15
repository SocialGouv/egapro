# Montée de version PostgreSQL EgaPro V2 — procédure de préparation

> **Statut : procédure à compléter avant toute intervention.** Les décisions d’exploitation ci-dessous ne sont pas validées : elles constituent des critères de no-go. La commande de contrôle de #4844 est disponible dans le dépôt. Ne pas appliquer une procédure V1 à la V2. Ne consigner ici ni secret, ni URL de connexion, ni dump, ni donnée personnelle.

## 1. Décisions à valider avant toute intervention

L’exploitation et l’équipe applicative remplissent et approuvent cette fiche sur la Feature #4824. Un champ vide ou marqué « À déterminer » impose **no-go**.

| Décision | Valeur approuvée / preuve | Responsable |
| --- | --- | --- |
| Environnements V2 concernés et ordre de passage | **À déterminer** ; V2 observée sur `egapro-alpha` uniquement, V1 en production hors périmètre | Exploitation |
| Pour chaque environnement : instance, base logique, hébergement, version effective `SHOW server_version`, extensions et volume | **À déterminer** ; `ovh-dev/egapro-alpha` exécutait PostgreSQL 14.18 le 15 octobre 2026 avec une image CloudNativePG/PostGIS 14 ; bases logiques, extensions et volume restent à inventorier | Exploitation |
| Base pg-boss : dédiée, partagée avec l’application ou hors périmètre, pour chaque environnement | **À déterminer** ; absence de `pg-notifications` constatée uniquement dans le namespace de développement | Exploitation + application |
| Version majeure cible, disponibilité de l’image/offre et horizon de support | **À déterminer** ; les essais locaux PostgreSQL 17/18 ne valent pas choix de cible | Exploitation + architecture |
| Méthode de montée majeure adaptée à l’hébergement réel, aux extensions, à la volumétrie et à la durée d’arrêt | **À déterminer** ; procédure plateforme approuvée requise | Exploitation |
| Responsables nommés : décision go/no-go, sauvegarde, restauration, migration, bascule applicative, recette, communication | **À déterminer** | Responsable d’intervention |
| Fenêtre, durée maximale d’indisponibilité, RPO/RTO, seuil de retour arrière et canal de communication | **À déterminer** | Responsable d’intervention + métier |
| Procédure de mise en pause et de reprise de tous les producteurs d’écritures et jobs | **À déterminer et tester** : application, worker de notifications, CronJobs de purge/import/export, jobs externes/API | Exploitation + application |
| Type de sauvegarde, emplacement privé, horodatage, rétention, vérification et restauration indépendante | **À déterminer et répéter** | Exploitation |
| Critères de recette, jeux de données fictifs et représentants métier | **À déterminer** | Application + métier |

La décision finale doit référencer la procédure officielle de la plateforme concernée. Ne pas déduire l’hébergement V2 de la migration V1 vers OVH ; ne pas changer seulement une image PostgreSQL pour une montée majeure.

## 2. Registre d’intervention

Créer un enregistrement privé par **environnement et périmètre de contrôle**, avec : identifiant d’intervention, date et heure, commit et version applicative, responsables, inventaire approuvé, méthode plateforme, version initiale et cible, numéro de sauvegarde, preuve de restauration, identifiants des captures, résultat de comparaison, résultats de recette, décision signée et heure de reprise. Utiliser un UUID opaque stable pour les deux captures d’un même périmètre ; créer un autre UUID pour les notifications, même si elles partagent la base physique de l’application, et pour chaque autre environnement. Ne pas utiliser nom d’hôte, compte, entreprise ou chaîne de connexion comme identifiant.

Conserver les rapports de contrôle dans un stockage privé selon la politique d’exploitation. Les fichiers sont créés en mode privé par la commande et ne sont jamais écrasés. Ne joindre aucun dump ni journal contenant une connexion au ticket GitHub.

## 3. Préparation et répétition sur un environnement représentatif

1. **Réunir les preuves du périmètre.** Confirmer les bases réellement utilisées, la version serveur effective, les extensions et la topologie des clients. Déterminer si pg-boss partage la base applicative ou possède une base distincte. Vérifier la compatibilité des migrations Drizzle, des clients, de pg-boss/PostGIS le cas échéant, et de la méthode plateforme. Prévoir l’espace, la durée et la capacité de retour arrière.
2. **Approuver le gel des écritures.** Identifier tous les producteurs. Tester la procédure de pause et de reprise, y compris les traitements programmés et les intégrations externes. Attendre la fin ou traiter explicitement les travaux en cours ; éviter double traitement des notifications après reprise. Prévenir les utilisateurs selon la fenêtre approuvée.
3. **Sauvegarder.** Exécuter la sauvegarde avec l’outil de la plateforme validée ; consigner son identifiant, l’heure, le périmètre, la cohérence et le résultat de vérification. Les sauvegardes d’une base applicative et d’une base pg-boss distincte doivent correspondre au même point de gel logique si leurs traitements sont liés. Ne pas poursuivre sur une sauvegarde incomplète ou invérifiable.
4. **Restaurer à blanc.** Restaurer la sauvegarde sur une cible isolée et non exposée. Vérifier que le serveur démarre, que les schémas et extensions attendus sont présents, que l’application peut lire les données de test, et que le temps de restauration respecte le RTO approuvé. Faire la répétition complète du retour arrière et de la redirection applicative sur cet environnement, puis consigner les preuves. Aucune restauration de données réelles vers un environnement non autorisé.
5. **Capturer avant.** Avec les écritures et jobs réellement arrêtés, exécuter les commandes du §4. Vérifier un code de sortie nul et archiver les rapports privés. Une capture incomplète ou une table/journal absent impose no-go.
6. **Répéter la montée majeure.** L’exploitation suit sa procédure plateforme approuvée, avec ses contrôles d’extensions, de disponibilité et de version. Cette étape ne peut pas être remplacée par une modification de `docker-compose.yml` ou d’une image de conteneur.
7. **Capturer et comparer après**, avant toute reprise des écritures. Exiger un code de sortie nul pour chaque base du périmètre. Tout écart de structure, de journal de migrations ou de comptage impose l’arrêt et l’analyse. Les comptages et empreintes ne prouvent pas à eux seuls l’intégrité exhaustive : compléter par la restauration et la recette.
8. **Recetter**, puis documenter l’ajustement de la méthode, du temps et du seuil de retour arrière. La bascule d’un autre environnement reste no-go sans répétition concluante et approuvée.

## 4. Contrôles #4844

Utiliser la version fusionnée de `pnpm --filter app check:postgres-upgrade`. La commande `capture` ouvre une transaction en lecture seule et produit uniquement version, présence/empreinte des tables critiques, journal de migrations et comptages agrégés ; elle ne réalise aucune sauvegarde. `compare` lit les deux fichiers hors connexion. Elle refuse tout écart de structure, de migrations ou de comptage pendant le gel des écritures, ainsi qu’un périmètre différent ; la version majeure après intervention doit égaler la cible approuvée.

Exemple à adapter **uniquement après validation des décisions du §1**. Les variables `APPLICATION_SCOPE_UUID` et `APPLICATION_TARGET_MAJOR` doivent être définies par l’opérateur à partir de la fiche approuvée ; le même UUID est réutilisé avant/après. Les lignes `:` vérifient leur présence : arrêter la séquence si l’une échoue. Exécuter chaque étape séparément et vérifier son code de sortie avant la suivante. La connexion `DATABASE_URL` est injectée par le mécanisme de secrets de la plateforme, jamais passée en argument ou écrite dans le document.

**Avant la montée majeure, sous gel des écritures :**

```sh
umask 077
mkdir -p ./postgres-upgrade-evidence
: "${APPLICATION_SCOPE_UUID:?UUID du périmètre applicatif requis}"
: "${APPLICATION_TARGET_MAJOR:?version majeure approuvée requise}"
pnpm --filter app check:postgres-upgrade capture --database application --scope "$APPLICATION_SCOPE_UUID" --writes-stopped --output ./postgres-upgrade-evidence/application-before.json
```

Le schéma pg-boss est contrôlé dans un second passage **uniquement après inclusion explicite dans l’inventaire approuvé**, que sa base physique soit distincte ou partagée avec l’application. `NOTIFICATIONS_DATABASE_URL` doit être fournie explicitement par le gestionnaire de secrets. Si pg-boss partage la base principale, cette variable pointe vers la même base physique approuvée ; aucun repli automatique depuis `DATABASE_URL` n’est effectué. Utiliser un UUID opaque **distinct** de celui de la capture applicative, mais stable avant/après, et confirmer que la sauvegarde couvre ce schéma. **Avant la montée majeure**, si le schéma pg-boss est inclus :

```sh
: "${NOTIFICATIONS_SCOPE_UUID:?UUID du périmètre pg-boss requis}"
: "${NOTIFICATIONS_TARGET_MAJOR:?version majeure approuvée requise}"
pnpm --filter app check:postgres-upgrade capture --database notifications --notifications-confirmed --scope "$NOTIFICATIONS_SCOPE_UUID" --writes-stopped --output ./postgres-upgrade-evidence/notifications-before.json
```

**Après l’intervention de l’exploitation selon la méthode approuvée**, maintenir le gel de tous les producteurs. Capturer les deux périmètres inclus **avant** de comparer et de reprendre les écritures :

```sh
pnpm --filter app check:postgres-upgrade capture --database application --scope "$APPLICATION_SCOPE_UUID" --writes-stopped --output ./postgres-upgrade-evidence/application-after.json
# Ligne suivante seulement si le schéma pg-boss est inclus dans l'inventaire approuvé.
pnpm --filter app check:postgres-upgrade capture --database notifications --notifications-confirmed --scope "$NOTIFICATIONS_SCOPE_UUID" --writes-stopped --output ./postgres-upgrade-evidence/notifications-after.json
```

**Comparer**, puis exiger un code de sortie nul pour chaque commande exécutée :

```sh
pnpm --filter app check:postgres-upgrade compare --before ./postgres-upgrade-evidence/application-before.json --after ./postgres-upgrade-evidence/application-after.json --expected-major "$APPLICATION_TARGET_MAJOR"
# Ligne suivante seulement si le schéma pg-boss est inclus dans l'inventaire approuvé.
pnpm --filter app check:postgres-upgrade compare --before ./postgres-upgrade-evidence/notifications-before.json --after ./postgres-upgrade-evidence/notifications-after.json --expected-major "$NOTIFICATIONS_TARGET_MAJOR"
```

Dans le cas partagé, la même base physique est donc inspectée deux fois, une fois pour les tables applicatives et une fois pour le schéma pg-boss. Le gel des écritures doit couvrir les deux usages pendant chaque capture ; la preuve d’inventaire doit établir que les deux connexions désignent bien la même base approuvée.

## 5. Déroulement de la bascule par environnement

| Étape | Responsable à nommer | Preuve exigée / décision |
| --- | --- | --- |
| Ouverture de la fenêtre et communication | Responsable d’intervention | Périmètre et contact d’astreinte connus ; go initial signé |
| Gel des écritures et des jobs | Exploitation + application | Tous les producteurs arrêtés, travaux en cours traités ; heure du gel enregistrée |
| Sauvegarde cohérente | Exploitation | Sauvegarde vérifiée et restauration répétée ; go sauvegarde signé |
| Captures `before` | Application + exploitation | Code de sortie nul sur chaque base approuvée ; fichiers privés conservés |
| Montée majeure et redirection technique | Exploitation | Procédure plateforme approuvée, version et extensions vérifiées, santé des services confirmée |
| Captures `after` et `compare` | Application + exploitation | Code de sortie nul ; aucun écart inexpliqué ; go technique signé |
| Recette avant réouverture | Application + métier | Parcours du §6 concluants avec données de test ; go métier signé |
| Reprise progressive et surveillance | Exploitation + application | Jobs et écritures repris dans l’ordre approuvé, services stables, pas de doublon de notification ; heure de clôture |

Ne pas lancer de migration Drizzle applicative dans cette fenêtre sauf changement de schéma explicitement prévu et testé : une montée de version PostgreSQL et une migration fonctionnelle distincte rendent le diagnostic et le retour arrière plus difficiles. Confirmer le comportement du job `migrate` du déploiement applicatif avant l’intervention.

## 6. Recette et observations

Sur des comptes et données de test autorisés, vérifier : connexion ProConnect ; consultation d’une déclaration existante ; création ou modification contrôlée d’une déclaration puis relecture ; consultation des vues publiques/privées concernées ; export V2 et accès aux fichiers associés ; notifications, consommation pg-boss et absence de doublons si le périmètre les inclut. Vérifier aussi les jobs planifiés mis en pause et leur reprise contrôlée. Consigner pour chaque parcours l’opérateur, l’heure, le résultat et une référence de preuve sans donnée personnelle.

Surveiller état des pods et de la base, connexions, erreurs applicatives et de migration, latence, profondeur/échec de file pg-boss et envoi de notifications selon les outils de l’environnement. Définir les seuils et la durée de surveillance dans la fiche approuvée ; aucun seuil universel n’est présumé.

## 7. Go/no-go et retour arrière

**Go** uniquement si l’inventaire, la cible, la méthode et les responsables sont approuvés ; la répétition sur environnement représentatif est concluante ; la sauvegarde est vérifiée et restaurable dans le délai fixé ; les écritures sont réellement gelées ; toutes les captures avant sont valides ; puis toutes les comparaisons et recettes après bascule réussissent avant reprise.

**No-go / arrêt immédiat** si un de ces éléments manque, si une écriture persiste pendant les captures, si un contrôle retourne un code non nul, si la version ou les extensions ne correspondent pas, si la restauration testée échoue, si un parcours critique échoue, ou si le délai maximal approuvé est dépassé. Le responsable d’intervention tranche et consigne l’heure et la cause.

**Retour arrière avant reprise des écritures :** conserver le gel ; isoler la cible défaillante ; appliquer la restauration ou la réactivation de l’instance source selon la méthode plateforme approuvée et répétée ; rétablir la configuration et la redirection applicative vers l’état de départ ; vérifier l’accès, la version et les parcours critiques ; reprendre les producteurs seulement après validation signée. Ne pas supposer qu’un retour vers une version majeure antérieure peut réutiliser directement des fichiers de données modifiés par la cible.

**Incident après reprise des écritures :** arrêter à nouveau tous les producteurs, préserver l’état courant et ouvrir une décision d’incident. Restaurer une sauvegarde antérieure peut perdre les écritures effectuées depuis la bascule ; cette perte potentielle doit être mesurée contre le RPO et approuvée par les responsables métier et exploitation. La stratégie de réconciliation ou de rejeu doit avoir été décidée et répétée avant la bascule ; sans elle, pas de retour arrière automatique. Après toute restauration, revérifier les données, les services et les notifications avant réouverture.

## 8. Clôture

Pour chaque environnement, consigner la version réelle après intervention, les identifiants des preuves privées, les résultats des comparaisons, de la restauration et de la recette, les écarts et leur résolution, la décision de reprise, les heures de début/fin et le suivi de surveillance. Mettre à jour [l’architecture](architecture.md) avec un état de déploiement **vérifié** une fois les décisions approuvées et l’intervention effectuée. La version locale provisoire `postgres:17.11` ne constitue pas une décision de cible pour le cluster V2.

## Sources

- Feature [#4824](https://github.com/SocialGouv/egapro/issues/4824) et sous-tickets [#4844](https://github.com/SocialGouv/egapro/issues/4844), [#4845](https://github.com/SocialGouv/egapro/issues/4845)
- Contrat de la commande dans [#4844](https://github.com/SocialGouv/egapro/issues/4844), intégré par la [PR #4846](https://github.com/SocialGouv/egapro/pull/4846)
- [Architecture](architecture.md) et [process de release](release.md) du dépôt
