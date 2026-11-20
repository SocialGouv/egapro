# Runbook de supervision

Une entrée par alerte que le sondeur peut émettre, plus les deux gestes de méthode : que faire quand la supervision elle-même se tait, et comment ajouter une sonde. La carte des sondes, les seuils et la configuration sont dans [`supervision.md`](supervision.md) — ce document ne les recopie pas.

## Comment lire une alerte

Un message Mattermost porte toujours :

- **le libellé de la sonde** et son état (`Indisponible`, `Dégradé`, `Mal configuré`) ;
- **la criticité** (`Critique`, `Important`) ;
- **depuis quand** : le début de l'état en cours, pas la dernière relève ;
- le nombre d'**échecs consécutifs**, la **latence** et le **dernier message** assaini de la sonde ;
- pour un traitement, la **prochaine exécution attendue** ;
- un lien vers `/admin/etat-des-services`.

Une alerte part au troisième échec consécutif (moins de cinq minutes à la cadence interne), une seule fois par panne ; `Mal configuré` part immédiatement. Le retour est un second message, `Rétabli — …`, envoyé seulement si l'alerte était partie. Une sonde `Faible` ne notifie jamais : elle ne se voit qu'à l'écran.

Réflexe commun à toutes les entrées : ouvrir `/admin/etat-des-services`, regarder la ligne de la sonde (dernier message, dernière relève) et l'incident correspondant, puis **ne pas confondre « inconnu » et « indisponible »** — « inconnu » veut dire que le worker n'a pas relevé, donc d'abord l'entrée « La supervision ne répond plus ».

---

## Méthode — la supervision ne répond plus

**Symptôme.** Bandeau « La supervision ne répond plus » sur `/admin`, toutes les lignes en « Inconnu », ou aucune alerte alors que l'application est visiblement en panne.

**Ce que ça veut dire.** Le worker n'écrit plus depuis plus de `max(HEALTHCHECK_STALE_AFTER_SECONDS, 2 × interval_seconds)`. Ce n'est pas une panne de plus : c'est la perte de l'instrument. Tout ce que l'écran affiche est périmé, y compris les lignes encore vertes.

**Diagnostic.**

1. `kubectl -n <namespace> get pods -l app=healthcheck` : pod absent, en `CrashLoopBackOff`, en `ImagePullBackOff` ?
2. `kubectl -n <namespace> logs deploy/healthcheck --tail=100` : chercher le dernier `[healthcheck] started (probes=…)`, les avertissements `probe not configured`, et les `[healthcheck] … result not persisted`. Ce dernier message signifie que le worker sonde mais n'écrit pas : la base est en cause, pas les cibles.
3. Vérifier que la table `app_health_probe` reçoit encore des écritures (`SELECT max(checked_at) FROM app_health_probe`), puis que la base est joignable depuis le pod.

**Action.** Redémarrer le déploiement si le pod est bloqué ; si le pod tourne et que seul l'écrit échoue, traiter la base (entrée PostgreSQL). Ne pas « réparer » l'écran : il ne fait que lire.

**Escalade.** Si le worker ne redémarre pas (image, secret de base, RBAC), escalader à l'équipe de plateforme — sans supervision, plus aucune alerte ne partira.

---

## Méthode — je veux ajouter une sonde

1. Choisir le `kind` : `internal` (un service de notre espace de noms), `partner` (un tiers), `exposed` (la chaîne publique), `job` (un traitement planifié).
2. Écrire la sonde dans `packages/healthcheck/src/probes/` : elle classifie **elle-même** son échec (`misconfigured` pour un identifiant ou un certificat refusé, `unavailable` sinon) et **assainit elle-même** son message — c'est la seule couche qui tient l'erreur brute et les secrets à effacer.
3. La brancher dans `buildProbes` (`src/probes/index.ts`) avec sa cadence et son timeout.
4. Documenter : une ligne dans [`supervision.md` §2](supervision.md#2-carte-des-sondes) et une entrée ici.
5. Tester le cas nominal, le cas `misconfigured` et le cas réseau. Un test unitaire par état.

Un ajout de sonde ne se fait pas sans son entrée de runbook : une alerte sans marche à suivre ne sert à rien à trois heures du matin.

---

## ProConnect

**Symptôme.** `Indisponible — ProConnect (connexion)`, message `connexion à ProConnect impossible` ; ou `Mal configuré — ProConnect`, message `le document de découverte répond 4xx` / `document de découverte incomplet`.

**Ce que ça veut dire.** Personne ne peut se connecter : c'est la porte d'entrée de tous les déclarants. `unavailable` = ProConnect ne répond pas ; `misconfigured` = il répond mais l'URL ou le document de découverte ne sont plus ceux attendus.

**Diagnostic.** `curl -sS https://<issuer>/.well-known/openid-configuration | head` depuis un pod ; comparer `authorization_endpoint` et `jwks_uri` à ce que l'application attend. Vérifier `EGAPRO_PROCONNECT_ISSUER` dans la ConfigMap `proconnect`, puis les erreurs de connexion côté application (Sentry, `[auth]`).

**Action.** Partenaire indisponible : attendre, surveiller, informer. URL ou document changé : corriger la variable, redéployer l'application.

**Escalade.** ProConnect (équipe DINUM) si le document reste indisponible ou incomplet plus de 15 minutes.

---

## WEEZ / API Sirene

**Symptôme.** `Indisponible — WEEZ (registre Sirene)` ; ou `Mal configuré — WEEZ`, message `réponse WEEZ sans le SIREN de référence`.

**Ce que ça veut dire.** La recherche d'entreprise par SIREN ne répond plus, ou ne renvoie plus la fiche du SIREN de référence : l'application ne peut plus pré-remplir une déclaration à partir du SIREN.

**Diagnostic.** Appeler la recherche `findbysiren` avec le SIREN de `HEALTHCHECK_WEEZ_REFERENCE_SIREN` et vérifier que la fiche revient ; vérifier `EGAPRO_WEEZ_API_URL`. Côté application, chercher les erreurs `[weez]` et les replis silencieux (une recherche qui échoue renvoie souvent une liste vide plutôt qu'une erreur).

**Action.** Si le SIREN de référence a disparu du registre, le remplacer par un autre SIREN public stable et redéployer le worker. Si l'API est indisponible, attendre : la déclaration reste possible à la main.

**Escalade.** Équipe WEEZ / DINUM au-delà de 30 minutes, en précisant l'heure et le code HTTP observé.

---

## SUIT — présence CSE et fichier GIP-MDS

**Symptôme.** `Indisponible — SUIT (présence CSE)` ou `Indisponible — SUIT (fichier GIP-MDS)`, message `SUIT répond 502` / `connexion à SUIT impossible` ; `Mal configuré — SUIT`, message `SUIT refuse le certificat client (HTTP 403)` ou `certificat client SUIT absent`.

**Ce que ça veut dire.** Les appels sortants en mTLS vers SUIT ne passent plus. `suit-cse` couvre la vérification de l'existence d'un CSE au dépôt, `suit-gip-mds` la disponibilité de la métadonnée du fichier GIP-MDS. `misconfigured` désigne **notre** certificat (absent, illisible ou refusé), jamais une panne de SUIT : SUIT répond, il n'accepte pas notre identité. Les deux sondes ne tournent que si `HEALTHCHECK_PARTNER_PROBES_ENABLED` vaut `true` et si `HEALTHCHECK_SUIT_REFERENCE_SIREN` est posé ; sans elles, la sonde `suit-certificate` reste la seule à parler de SUIT localement.

**Diagnostic.** Depuis un pod, avec le bundle monté :

```bash
curl -sS --cert-type P12 --cert /chemin/bundle.p12:<passphrase> \
  "$EGAPRO_SUIT_API_URL/suit/api/externe/portail/CSE/$HEALTHCHECK_SUIT_REFERENCE_SIREN" -o /dev/null -w '%{http_code}\n'
```

Ne **pas** ajouter d'en-tête `Accept` sur la route GIP-MDS : le WAF de SUIT répond alors un 403 HTML (`x-waf-blocked: 1`), et la sonde le classe `misconfigured`. Côté application, chercher `[suit]` dans les logs et les erreurs de poignée de main TLS dans Sentry.

**Action.** Certificat absent : poser le secret optionnel `suit-client-cert` (bundle et phrase de passe). Certificat refusé : demander un nouveau bundle à SUIT, le ré-encoder et resceller `EGAPRO_SUIT_CLIENT_CERT_P12_BASE64` / `EGAPRO_SUIT_CLIENT_CERT_PASSWORD`, puis redémarrer le worker et l'application. 5xx ou réseau : attendre, la déclaration reste possible, c'est la vérification CSE et l'import qui sont dégradés.

**Escalade.** SUIT si le `misconfigured` survit au rescellement (certificat révoqué côté partenaire). Équipe de plateforme pour le scellement. Prévenir la DGT si l'import GIP-MDS est bloqué au-delà d'une journée.

---

## Application via l'ingress

**Symptôme.** `Indisponible — Application via l'ingress public`, message `l'ingress répond 5xx` ou `connexion à l'ingress impossible`.

**Ce que ça veut dire.** Le site public ne répond pas, ou répond en erreur, **vu de l'extérieur** — donc la chaîne DNS → ingress → service → pods est cassée quelque part, même si le pod applicatif va bien.

**Diagnostic.** Ouvrir l'URL publique dans un navigateur ; comparer avec les pods applicatifs (`kubectl -n <namespace> get pods`) et avec les logs d'ingress. Un `502` désigne le service ou le pod ; un `503` souvent une absence de pod prêt ; une erreur DNS ou TLS désigne la couche ingress.

**Action.** Rollout en cours ou pod non prêt : attendre la fin. Pod en erreur : traiter l'application (entrée PostgreSQL si la base est en cause, sinon redémarrer et lire Sentry). Ingress ou certificat : équipe de plateforme.

**Escalade.** Immédiate : c'est la disponibilité du service public.

---

## API publique

**Symptôme.** `Indisponible — API publique via l'ingress` (5xx) ou `Dégradé — API publique`, message `réponse non JSON`.

**Ce que ça veut dire.** `/api/public/...` ne sert plus, ou sert autre chose que du JSON. Les consommateurs (data.gouv, réutilisateurs) perdent l'accès aux indicateurs publiés.

**Diagnostic.** `curl -sS https://<hôte>/api/public/openapi.json | head` ; vérifier le middleware, les limites de débit et les logs de la route. Un `4xx` sur `openapi.json` signifie que la route est protégée ou absente : c'est un problème de déploiement, pas de charge.

**Action.** Redéployer si la route manque ; vérifier la configuration des jetons publics si les appels sont refusés.

**Escalade.** Équipe applicative ; prévenir l'équipe data.gouv si l'indisponibilité dépasse la journée (la publication quotidienne échouera).

---

## Passerelle SUIT (APISIX)

**Symptôme.** `Indisponible — Passerelle SUIT (APISIX)` (5xx ou réseau) ; `Mal configuré`, message `clé du consumer de supervision refusée`.

**Ce que ça veut dire.** Les appels entrants de SUIT vers `/api/v1/*` passent par cette passerelle. Clé refusée = notre consumer de supervision a été retiré ou sa clé a changé ; 5xx = la passerelle ou l'application derrière ne répond pas.

**Diagnostic.** Appeler `/api/v1/healthz` avec la clé de `HEALTHCHECK_APISIX_SUIT_API_KEY` ; vérifier le pod APISIX et ses logs ; comparer la clé avec le secret `suit-monitoring` monté des deux côtés.

**Action.** Clé refusée : rescellers `HEALTHCHECK_APISIX_SUIT_API_KEY` à l'identique pour APISIX et pour le worker, puis redémarrer les deux. Passerelle en erreur : redémarrer le pod APISIX, puis l'application si le 5xx vient d'elle.

**Escalade.** Équipe de plateforme pour APISIX ; SUIT si le partenaire signale des rejets alors que la sonde est verte.

---

## SUIT — fichiers avis CSE (route exposée)

**Symptôme.** `Indisponible — SUIT (fichiers avis CSE)`, message `l'API fichiers répond 503` ; `Mal configuré`, message `clé du consumer de supervision refusée` ; `Dégradé`, message `réponse non JSON`.

**Ce que ça veut dire.** La route `/api/v1/files` que SUIT appelle pour récupérer les avis CSE ne répond plus correctement. La sonde passe par APISIX avec la clé du consumer de supervision : elle prouve la chaîne complète (clé, WAF, routeur, application, JSON), pas seulement l'application. Un 404 n'est pas une panne : c'est une réponse métier valide.

**Diagnostic.** Rejouer la sonde à la main :

```bash
curl -sS -H "Authorization: Bearer <clé du consumer>" \
  "$HEALTHCHECK_APISIX_SUIT_URL/api/v1/files?siren=$HEALTHCHECK_SUIT_REFERENCE_SIREN&year=$(date +%Y)" -i | head
```

Un 200 non JSON est presque toujours une page d'erreur d'un proxy en amont. Vérifier les logs APISIX et le journal d'audit de la route (`EXPORT_API_FILES`), qui enregistre chaque appel authentifié.

**Action.** Clé refusée : resceller `HEALTHCHECK_APISIX_SUIT_API_KEY` à l'identique pour APISIX et pour le worker, redémarrer les deux. 5xx : traiter l'application (entrée PostgreSQL, S3, audit) puis APISIX. Réponse non JSON : chercher le proxy qui répond à la place de l'application.

**Ce que cette sonde ne voit pas.** Elle ne dépose **rien** : un rejet métier de SUIT à l'upload, ou un avis CSE illisible une fois déposé, ne se verrait pas ici. C'est délibéré — une sonde qui déposerait polluerait les données d'une entreprise réelle. Voir [supervision.md](./supervision.md) §7.

**Escalade.** Équipe de plateforme (APISIX) ; SUIT si le partenaire signale des réponses en erreur alors que la sonde est verte.

---

## Certificat TLS public

**Symptôme.** `Dégradé — Application via l'ingress public`, message `certificat TLS expire le <date>` ; puis `Indisponible`, `certificat TLS expiré le <date>`.

**Ce que ça veut dire.** À moins de `HEALTHCHECK_CERT_WARN_DAYS` (30 j) de l'expiration, le renouvellement ne s'est pas fait. Expiré, tous les navigateurs refusent le site.

**Diagnostic.** `echo | openssl s_client -connect <hôte>:443 -servername <hôte> 2>/dev/null | openssl x509 -noout -dates -issuer`. Vérifier que le renouvellement automatique de la plateforme tourne (certificat émis par l'autorité de la plateforme ou par un ACME interne).

**Action.** Forcer le renouvellement côté plateforme ; si le certificat est manuel, en faire émettre un nouveau et le poser avant l'expiration. Ne pas attendre l'alerte `Indisponible`.

**Escalade.** Équipe de plateforme dès l'alerte `Dégradé` ; incident public si le certificat expire.

---

## Certificat client SUIT (mTLS)

**Symptôme.** `Dégradé — SUIT (certificat client)`, message `certificat client SUIT expire le <date> (dans N j)` ; puis `Indisponible` avec le même message, ou `certificat client SUIT expiré le <date>` ; `Mal configuré`, message `bundle PKCS#12 illisible`.

**Ce que ça veut dire.** La sonde lit le `notAfter` du `.p12` monté dans le worker — elle ne fait aucun appel. `degraded` = à moins de `HEALTHCHECK_CERT_WARN_DAYS` (30 j) de l'expiration : le renouvellement doit être lancé maintenant. `unavailable` = expiré ou à moins de 7 jours : les appels mTLS vers SUIT vont échouer ou échouent déjà. `misconfigured` = le bundle ou la phrase de passe est faux : aucune connexion SUIT ne peut aboutir, et les deux sondes mTLS le diront aussi. Sans certificat configuré, la sonde reste verte (`non configuré`) — le mTLS est optionnel hors production.

**Diagnostic.** Sur le bundle monté : `openssl pkcs12 -in bundle.p12 -nokeys -clcerts -passin pass:<phrase> | openssl x509 -noout -dates -subject` ; comparer avec le certificat attendu par SUIT. Sur le worker, `Mal configuré` sans expérience d'appel signifie phrase de passe fausse ou bundle tronqué au scellement.

**Action.** Obtenir un nouveau certificat auprès de SUIT, le ré-encoder, resceller `EGAPRO_SUIT_CLIENT_CERT_P12_BASE64` et `EGAPRO_SUIT_CLIENT_CERT_PASSWORD`, redémarrer le worker **et** l'application (elle charge le même secret). La sonde repasse verte au cycle suivant.

**Escalade.** SUIT pour l'émission ; équipe de plateforme pour le scellement. Dès l'alerte `Dégradé` : un renouvellement de certificat prend des jours, l'attente transforme une maintenance en panne.

---

## PostgreSQL (application)

**Symptôme.** `Indisponible — PostgreSQL (application)`.

**Ce que ça veut dire.** L'application ne peut plus lire ni écrire : dépôts de déclarations, connexions, exports, tout est en panne. C'est l'alerte la plus grave de la liste.

**Diagnostic.** `SELECT 1` depuis un pod ou la console de la base ; vérifier le pod PostgreSQL, ses connexions actives et son espace disque. Un `unavailable` alors que la base répond pointe vers le secret de connexion (`POSTGRES_*`), un `misconfigured` vers des identifiants refusés.

**Action.** Base saturée : libérer les connexions ou monter la ressource. Secret erroné : rescellers et redémarrer. Ne jamais redémarrer l'application en boucle sur une base absente : cela ne fait qu'ajouter du bruit.

**Escalade.** Immédiate, équipe de plateforme ; prévenir la DGT si la panne dure (les déclarants ne peuvent plus déposer).

---

## S3 (stockage des fichiers)

**Symptôme.** `Indisponible — S3 (stockage des fichiers)` ; `Mal configuré` (401/403).

**Ce que ça veut dire.** Les dépôts d'avis CSE, d'évaluations conjointes et de rapports échouent, ou les fichiers déjà déposés ne sont plus accessibles. `misconfigured` = clés ou bucket faux/expirés.

**Diagnostic.** `HeadBucket` sur le bucket avec les clés de l'application ; vérifier l'espace du bucket et les politiques d'accès. Côté application, les erreurs d'upload sont journalisées et remontées à Sentry.

**Action.** Clés expirées : les régénérer et rescellers `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`. Fournisseur en panne : attendre ; l'application affiche une erreur d'upload explicite, aucune donnée n'est perdue côté base.

**Escalade.** Fournisseur S3 au-delà de 30 minutes ; équipe de plateforme pour les accès.

---

## ClamAV (antivirus)

**Symptôme.** `Indisponible — ClamAV (antivirus)`, message `connexion refusée` ou `réponse inattendue de clamd`.

**Ce que ça veut dire.** Tout dépôt de fichier est refusé (`antivirus_indisponible`) : c'est volontaire, on ne stocke pas un fichier non analysé. Les utilisateurs ne peuvent plus joindre leur avis CSE.

**Diagnostic.** `PING` sur clamd ; vérifier que la base de signatures est à jour et que le pod a assez de mémoire — une mise à jour de signatures peut le faire redémarrer.

**Action.** Redémarrer clamd ; s'il tourne mais ne répond pas, il charge probablement les signatures : attendre la fin du chargement. Ne jamais désactiver l'analyse pour « débloquer » un utilisateur.

**Escalade.** Équipe de plateforme si clamd ne revient pas en 15 minutes.

---

## Valkey (cache et quotas)

**Symptôme.** `Indisponible — Valkey (cache et quotas)` ; `Mal configuré` sur un mot de passe refusé.

**Ce que ça veut dire.** Le cache et les compteurs de limitation de débit perdent leur support. L'application continue souvent de fonctionner, mais les quotas de l'API publique ne sont plus fiables et les lectures retombent sur la base — donc plus de charge sur PostgreSQL.

**Diagnostic.** `PING` sur Valkey ; vérifier la mémoire et la politique d'éviction. Un `misconfigured` pointe vers `VALKEY_URL` ou son mot de passe.

**Action.** Redémarrer Valkey ; vider le cache uniquement si les données y sont reconstructibles (c'est le cas ici). Corriger l'URL ou le secret si `misconfigured`.

**Escalade.** Équipe de plateforme ; surveiller PostgreSQL pendant l'indisponibilité.

---

## SMTP (envoi des e-mails)

**Symptôme.** `Indisponible — SMTP (envoi des e-mails)` ; `Mal configuré` sur une authentification refusée.

**Ce que ça veut dire.** Les accusés de dépôt, les relances et les confirmations CSE ne partent plus. La file `email-notification` va se remplir : l'alerte suivante sera la file elle-même.

**Diagnostic.** `verify()` de la connexion (le worker le fait) ; comparer avec les erreurs du worker de notifications ; vérifier `MAIL_ENABLED`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`.

**Action.** Corriger la configuration ou les identifiants ; le worker réessaie et la file se vide. Pour un envoi désactivé volontairement, la sonde est « non configuré », pas rouge — un rouge signifie que l'envoi est activé et qu'il échoue.

**Escalade.** Fournisseur SMTP au-delà d'une heure ; prévenir la DGT si des relances réglementaires sont concernées.

---

## File des e-mails (pg-boss)

**Symptôme.** `Dégradé — File des e-mails (pg-boss)`, message `N jobs en attente` ou `le plus ancien depuis N min (seuil 15 min)`.

**Ce que ça veut dire.** La file se remplit plus vite qu'elle ne se vide : worker de notifications arrêté, SMTP lent, ou pic d'envois. Les e-mails partent en retard, pas perdus.

**Diagnostic.** `SELECT count(*), min(created_on) FROM pgboss.job WHERE name = 'email-notification' AND state IN ('created','retry')` ; état du pod du worker de notifications ; entrée SMTP si les envois échouent.

**Action.** Worker arrêté : le redémarrer. SMTP lent : traiter l'entrée SMTP. Pic légitime : surveiller, la file se résorbe.

**Escalade.** Équipe applicative si la file ne se résorbe pas en une heure.

---

## File des e-mails (traitements)

**Symptôme.** `En retard — File des e-mails (traitements)` (plus ancien job en attente au-delà de 26 h) ou `Dégradé`, message `N job(s) en échec sur la fenêtre`.

**Ce que ça veut dire.** Soit plus rien ne draine la file, soit des jobs ont échoué : un e-mail attendu n'est jamais parti. Contrairement à la sonde de profondeur, celle-ci regarde les **échecs**, pas seulement le volume.

**Diagnostic.** Lister les jobs `failed` de la file sur la fenêtre et lire leur `output` ; comparer avec les logs du worker de notifications. Un échec isolé est souvent un destinataire invalide, un échec en série un problème de rendu ou de SMTP.

**Action.** Corriger la cause côté worker ou SMTP, puis rejouer les jobs en échec si le message doit partir (vérifier le dédoublonnage des relances avant tout rejeu manuel).

**Escalade.** Équipe applicative ; DGT si des relances réglementaires n'ont pas été envoyées.

---

## Génération de l'export annuel

**Symptôme.** `En retard — Génération de l'export annuel`, message `en retard` ou `dernier succès …`.

**Ce que ça veut dire.** Le CronJob de 02:00 UTC n'a pas laissé de succès `export.generate` corroboré par une ligne `app_export` dans sa fenêtre. L'export que la DGT et data.gouv consomment n'est pas à jour.

**Diagnostic.** `kubectl -n <namespace> get jobs -l app=export-generate-daily` et les logs du dernier Job ; appeler la route de génération à la main sur un environnement de test ; vérifier `EGAPRO_EXPORT_API_TOKEN`.

**Action.** Relancer le CronJob (`kubectl create job --from=cronjob/export-generate-daily …`) après avoir corrigé la cause (jeton, espace disque, base). Vérifier ensuite la ligne `app_export` et la prochaine exécution attendue à l'écran.

**Escalade.** Équipe applicative ; DGT si l'export manque plusieurs jours.

---

## Import GIP-MDS

**Symptôme.** `En retard — Import GIP-MDS`.

**Ce que ça veut dire.** Le fichier GIP-MDS de 03:00 UTC n'a pas été importé : les effectifs et les indicateurs A–F de la campagne ne sont pas rafraîchis.

**Diagnostic.** Logs du Job `gip-mds-import-daily` ; disponibilité du fichier chez SUIT ; validité de `EGAPRO_GIP_MDS_API_TOKEN` et du certificat client SUIT (voir l'entrée mTLS).

**Action.** Corriger le jeton ou le fichier source, relancer le Job, vérifier la ligne `gip_mds.import`.

**Escalade.** SUIT si le fichier n'est pas publié ; DGT si l'import est retardé au-delà de la journée.

---

## Purge des déclarations

**Symptôme.** `En retard — Purge des déclarations`.

**Ce que ça veut dire.** La purge RGPD de 03:00 UTC n'a pas tourné : des déclarations au-delà de la durée légale sont conservées plus longtemps que promis.

**Diagnostic.** Logs du Job `declaration-cleanup-daily` ; vérifier l'accès à la base **et à S3** (la purge supprime aussi les fichiers) ; vérifier `EGAPRO_DECLARATION_RETENTION_YEARS` si le comportement semble anormal.

**Action.** Relancer le Job après correction ; la purge est idempotente, un second passage ne supprime rien de plus et écrit un nouvel auto-audit avec des compteurs à zéro.

**Escalade.** Équipe applicative et DPO : une purge manquée est un écart de conservation à documenter.

---

## Purge du journal d'audit

**Symptôme.** `En retard — Purge du journal d'audit`.

**Ce que ça veut dire.** Le CronJob de 04:00 UTC n'a pas purgé `audit.action_log` : les lignes au-delà de 180 / 365 jours s'accumulent, contrairement à la durée annoncée.

**Diagnostic.** Logs du Job `audit-cleanup-daily` ; espace disque et durée de la requête ; vérifier `EGAPRO_AUDIT_RETENTION_SHORT_DAYS` / `EGAPRO_AUDIT_RETENTION_LONG_DAYS` si le volume surprend.

**Action.** Relancer le Job. La purge est une requête SQL directe, idempotente.

**Escalade.** Équipe applicative et DPO si le retard dure plus d'une journée.

---

## Relances planifiées (pg-boss)

Huit files de relances, toutes de criticité `important` : échéances déclaratives, ouverture de cycle, avis CSE (conformité, justification d'octobre, justification de décembre, actions correctives, évaluation conjointe) et passation de cycle.

**Symptôme.** `En retard — <libellé de la relance>` : aucun job `completed` dans la fenêtre de fraîcheur, ou planification absente de pg-boss (`en retard — planification absente de pg-boss`).

**Ce que ça veut dire.** La relance n'est plus planifiée ou plus exécutée. Selon la file, des entreprises ne reçoivent pas leur rappel d'échéance ou d'avis CSE — sans erreur visible pour elles.

**Diagnostic.**

1. `SELECT name, cron, timezone FROM pgboss.schedule WHERE name = '<file>'` : une planification absente signifie que le worker de notifications ne l'a pas enregistrée (mauvais déploiement ou base de file perdue).
2. `SELECT state, count(*) FROM pgboss.job WHERE name = '<file>' GROUP BY state` : beaucoup de `created` = worker arrêté ; des `failed` = erreur de rendu ou d'envoi (voir SMTP).
3. Logs du worker de notifications au démarrage : il enregistre les huit planifications.

**Action.** Planification absente : redémarrer le worker de notifications (il réenregistre les crons). File bloquée : traiter le worker ou SMTP. Ne pas recréer un cron à la main sans avoir vérifié que le worker ne le fera pas au prochain démarrage.

**Escalade.** Équipe applicative ; DGT si les relances d'échéance sont concernées et que le retard dépasse la journée.
