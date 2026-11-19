# Exports applicatifs : exploitation et bascule

Les six exports de la V1 sont générés par l'API et publiés dans un stockage objet
compatible S3. Le composant `files` les sert depuis ce stockage, après les contrôles
d'accès habituels.

| Accès | Fichiers |
| :-- | :-- |
| Public | `index-egalite-fh.xlsx`, `dgt-export-representation.xlsx` |
| Authentification basique ou IP autorisée | `dgt.xlsx`, `dgt-representation.xlsx`, `full.ndjson`, `indexes.csv` |

## Fonctionnement

- **Génération** : le CronJob `exports` exécute `egapro publish-exports` chaque jour
  à **00:00 UTC**. C'est la seule génération planifiée : il n'y a plus de scheduler
  résident dans le pod `files`.
- **Publication** : chaque fichier est d'abord écrit dans un répertoire temporaire,
  contrôlé (non vide, XLSX complet), puis transféré et vérifié en taille. Un échec
  laisse le dernier objet valide en place et le job sort en code 1.
- **Lecture** : `files` lit l'objet en flux et conserve `GET`, `HEAD`,
  `Content-Length`, `Last-Modified`, `Content-Type`, `Content-Disposition`, `Range`
  et les requêtes conditionnelles (`304`).
- **Topologie** : les pods `files` ne montent aucun volume d'exports ; ils sont
  répliqués et déployés en `RollingUpdate`.

Le manifeste du job est `.kontinuous/templates/exports-cron.yaml` ; ses sources de
configuration (base de données et stockage) sont dans `project.exports` de
`.kontinuous/values.yaml`.

## Développement local

Voir la section « Fichiers » du [`README.md`](../../../README.md) : MinIO local,
bucket `egapro-local-app`, préfixe `dev`, commande
`docker compose exec api egapro publish-exports`.

## Bascule d'un environnement déployé

La bascule se fait en deux temps : **remplir le stockage avec la nouvelle image**
pendant que les anciens lecteurs servent encore le volume, puis **déployer** les
nouveaux lecteurs et vérifier les six téléchargements. La vérification est un
préalable à l'ouverture, pas une formalité.

> Les lecteurs servent S3 dès le déploiement : entre le déploiement et la fin des
> vérifications (quelques minutes), les téléchargements peuvent être indisponibles.
> Prévoir une fenêtre courte et ne rien annoncer avant le gate de l'étape 5.

### Prérequis

- Le Secret `s3` est scellé dans le namespace (voir le README, section « Stockage
  des fichiers »). Sans lui, la génération échoue en nommant les variables
  manquantes.
- L'image `api` de la version à déployer est publiée dans le registre.
- Le PVC `files` est toujours présent (il porte le retour arrière).

### 1. Sceller et vérifier le Secret `s3`

```sh
kubectl -n <namespace> get configmap s3
kubectl -n <namespace> get secret s3
kubectl -n <namespace> get secret s3 \
  -o jsonpath='{range $k, $v := .data}{$k}{"\n"}{end}'
```

Attendu : le ConfigMap et le Secret existent, et le Secret porte
`S3_ACCESS_KEY_ID` et `S3_SECRET_ACCESS_KEY`. Ne jamais afficher les valeurs.

### 2. Pré-remplir le stockage avec la nouvelle image

Créer un job unique à partir du modèle du CronJob : même image, mêmes sources de
configuration, même stockage temporaire, mais sans planification.

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: exports-bascule
  namespace: <namespace>
spec:
  backoffLimit: 0
  activeDeadlineSeconds: 10800
  template:
    spec:
      restartPolicy: Never
      securityContext:
        runAsNonRoot: true
      containers:
        - name: exports
          image: <registre>/<projet>/<dépôt>/api:<tag>
          command: ["egapro", "publish-exports"]
          envFrom:
            - secretRef:
                name: pg-app
            - secretRef:
                name: staff
            - secretRef:
                name: egapro-secret
            - configMapRef:
                name: s3
            - secretRef:
                name: s3
          env:
            - name: EGAPRO_DBHOST
              value: "$(PGHOST)"
            - name: EGAPRO_DBNAME
              value: "$(PGDATABASE)"
            - name: EGAPRO_DBPORT
              value: "$(PGPORT)"
            - name: EGAPRO_DBUSER
              value: "$(PGUSER)"
            - name: EGAPRO_DBPASS
              value: "$(PGPASSWORD)"
            - name: EGAPRO_DBSSL
              value: "$(PGSSLMODE)"
            - name: EGAPRO_FLAVOUR
              value: "<dev|preprod|prod>"
          resources:
            requests:
              cpu: 100m
              memory: 512Mi
            limits:
              cpu: 2
              memory: 4Gi
              ephemeral-storage: 6Gi
          volumeMounts:
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: tmp
          emptyDir:
            sizeLimit: 5Gi
```

```sh
kubectl -n <namespace> apply -f exports-bascule.yaml
kubectl -n <namespace> wait --for=condition=complete job/exports-bascule --timeout=3h
kubectl -n <namespace> logs job/exports-bascule
```

Attendu : le job est `Complete` et les journaux montrent six lignes
`--- Finished export: <nom> ---`. Chaque publication a été vérifiée en taille par
`storage.publish`, et un fichier vide ou un XLSX tronqué n'est jamais publié.

**Gate 1** : job `Complete`, six exports terminés. Sinon, corriger la cause
(voir « Diagnostic »), supprimer le job et le recréer — les objets valides déjà
publiés restent en place.

### 3. Déployer la nouvelle version

Déployer la version qui contient l'epic (pipeline habituel). Attendu :

```sh
kubectl -n <namespace> get cronjob exports
kubectl -n <namespace> get deploy files
kubectl -n <namespace> get pods -l component=files \
  -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{range .spec.containers[*]}{.name}{" "}{end}{"\n"}{end}'
kubectl -n <namespace> get pods -l component=files \
  -o jsonpath='{range .items[*]}{.spec.volumes[*].persistentVolumeClaim}{"\n"}{end}'
```

- le CronJob `exports` existe ;
- `files` est disponible avec ses répliques (2 en preprod/prod) ;
- les pods `files` ne contiennent plus le conteneur `scheduler` ;
- la dernière commande n'affiche rien : plus aucun `persistentVolumeClaim` dans
  les pods.

L'ancien scheduler résident disparaît avec l'ancien déploiement ; le prochain
passage du CronJob est à 00:00 UTC.

### 4. Vérifier les six téléchargements (gate d'ouverture)

```sh
HOST=https://<hôte>
for f in index-egalite-fh.xlsx dgt-export-representation.xlsx; do
  curl -fsSI "$HOST/$f" | head -n 1
done
for f in dgt.xlsx dgt-representation.xlsx full.ndjson indexes.csv; do
  curl -fsSI -u '<utilisateur>:<mot de passe>' "$HOST/$f" | head -n 1
done
```

Attendu pour chaque fichier : `HTTP/2 200`, un `content-length` non nul et un
`last-modified` du jour. Vérifier aussi que les deux pages publiques affichent
toujours la taille et la date (elles utilisent `HEAD`).

Contrôler le contenu du bucket depuis un pod API :

```sh
kubectl -n <namespace> exec deploy/api -- python -c '
from egapro import config, storage
s = config.storage_settings()
c = storage.client(s)
for o in c.list_objects_v2(Bucket=s.bucket, Prefix=s.prefix).get("Contents", []):
    print(o["Key"], o["Size"], o["LastModified"])
'
```

Attendu : six clés (préfixe `S3_PREFIX` inclus), tailles non nulles, dates du jour.

**Gate 2** : les six URL répondent `200` avec les bonnes métadonnées, et le bucket
contient les six objets. Sinon → **retour arrière**.

### 5. Ouvrir les téléchargements

Une fois le gate 2 passé, la bascule est terminée : communiquer si une fenêtre
d'indisponibilité avait été annoncée. Laisser le PVC en place (voir « Retrait du
volume »).

Vérifier la première génération planifiée le lendemain :

```sh
kubectl -n <namespace> get cronjob exports -o jsonpath='{.status.lastSuccessfulTime}{"\n"}'
kubectl -n <namespace> get jobs
```

## Retour arrière

À déclencher si le gate 1 échoue de façon non corrigeable, si le gate 2 échoue, ou
si les générations quotidiennes échouent après la bascule.

1. **Ne plus publier** : suspendre le CronJob (le temps de la manœuvre) ou
   redéployer la version précédente, qui ne le contient pas.

   ```sh
   kubectl -n <namespace> patch cronjob exports -p '{"spec":{"suspend":true}}'
   ```

2. **Redéployer la version précédente** via le pipeline (revert du commit de
   release ou redéploiement du tag précédent). Le déploiement précédent restaure le
   sidecar `scheduler`, le montage du PVC et les lecteurs sur volume.

3. **Régénérer le volume si nécessaire** : le PVC contient les exports écrits avant
   la bascule. S'ils sont trop anciens, exécuter les commandes par fichier dans le
   conteneur `scheduler` du pod `files`, qui monte `/mnt/files` :

   ```sh
   POD=$(kubectl -n <namespace> get pod -l component=files -o name | head -n 1)
   kubectl -n <namespace> exec "$POD" -c scheduler -- \
     egapro dump-dgt /mnt/files/dgt.xlsx
   ```

   (Répéter pour les cinq autres exports, comme dans le README.)

4. **Vérifier** les six téléchargements comme au gate 2, puis lever la suspension
   si la version précédente n'a pas été redéployée.

Le stockage S3 n'a pas à être nettoyé : les objets publiés restent lisibles et
pourront resservir à la bascule suivante.

## Diagnostic

| Symptôme | Cause probable | À vérifier |
| :-- | :-- | :-- |
| Job absent ou non planifié | CronJob suspendu, désactivé (`project.exports.enabled`), ou déploiement incomplet | `kubectl get cronjob exports -o yaml`, `kubectl get jobs` |
| Job en échec, un export nommé dans les logs | Génération ou publication de cet export | `kubectl logs job/<job>`, traceback de l'export |
| Export absent (`404`, corps vide) | Objet jamais publié (job en échec, première exécution non faite) | `lastSuccessfulTime`, logs du job, contenu du bucket |
| Export périmé (`Last-Modified` ancien) | Job en échec, CronJob suspendu, génération silencieusement absente | `kubectl get jobs`, logs, `lastSuccessfulTime` |
| `502 File storage unavailable.` | Configuration ou accès au stockage, réseau, SDK — jamais un refus de droits utilisateur | logs de `files` (erreur SDK complète), ConfigMap/Secret `s3`, endpoint |
| `401`/`403` avec `WWW-Authenticate: Basic` | Règles d'accès (authentification basique, IP autorisée) | `.kontinuous/values.yaml` (`FILES_PUBLIC`, `FILES_RESTRICTED`, `WHITELIST_IP`), `.htpasswd` |
| `405` | Méthode autre que `GET`/`HEAD` | comportement attendu (`Allow: GET, HEAD`) |

Commandes utiles :

```sh
# État du planificateur et des derniers jobs
kubectl -n <namespace> get cronjob exports -o yaml
kubectl -n <namespace> get jobs
kubectl -n <namespace> describe job <job>

# Journaux d'une génération (le job nomme chaque export)
kubectl -n <namespace> logs job/<job>

# Relance manuelle : vérifier d'abord qu'aucun job ne tourne
kubectl -n <namespace> get jobs
kubectl -n <namespace> create job --from=cronjob/exports exports-manual-$(date +%s)

# Journaux du serveur de téléchargement
kubectl -n <namespace> logs deploy/files
```

Une relance créée depuis le CronJob lui appartient : le job planifié ne démarrera
pas tant qu'elle tourne (`Forbid`). L'inverse n'est pas protégé : ne pas lancer de
job manuel pendant une génération planifiée.

## Retrait du volume

Le PVC `files` et son manifeste (`.kontinuous/templates/files.pvc.yaml`) restent en
place pour le retour arrière. Ne les retirer qu'après **au moins une génération
quotidienne réussie en production**, avec les conditions suivantes :

- le CronJob a un `lastSuccessfulTime` à 00:00 UTC et le job est `Complete` ;
- les six exports se téléchargent avec les bonnes tailles et dates ;
- le retour arrière a été répété (au moins en preprod).

Le retrait se fait dans un ticket de suivi : supprimer le manifeste du PVC d'abord
(sinon GitOps le recrée), puis supprimer le PVC dans le namespace.
