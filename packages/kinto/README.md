# Egapro Kinto

## Importer les données Solen

Vous devez disposer de Python 3.6+ et `pipenv`.

```
$ pipenv run python import-solen.py export-solen.xlsx
```

ou bien, si vous souhaitez activer l'environnement projet de façon persistante :

```
$ pipenv shell
$ python import-solen.py export-solen.xlsx
```

### Préparation des données

Vous devez disposer d'un export Solen, généralement fourni au format Excel (ex. `Export DGT 20191224.xlsx`). C'est le chemin vers ce fichier qu'il faut passer à la ligne de commande.

### Usage

```
$ python import-solen.py --help
usage: import-solen.py [-h] [-d] [-i INDENT] [-m MAX] [-j] [-s SAVE_AS] [-v]
                       [-r] [--siren SIREN] [-c]
                       xls_path

Import des données Solen.

positional arguments:
  xls_path              chemin vers l'export Excel Solen

optional arguments:
  -h, --help            show this help message and exit
  -d, --debug           afficher les messages de debug
  -i INDENT, --indent INDENT
                        niveau d'indentation JSON
  -m MAX, --max MAX     nombre maximum de lignes à importer
  -j, --show-json       afficher la sortie JSON
  -s SAVE_AS, --save-as SAVE_AS
                        sauvegarder la sortie JSON dans un fichier
  -v, --validate        valider les enregistrements JSON
  -r, --dry-run         ne pas procéder à l'import dans Kinto
  --siren SIREN         importer le SIREN spécifié uniquement
  -c, --init-collection
                        Vider et recréer la collection Kinto avant import
```

Notez que les options sont cumulatives.

#### Simuler l'import dans Kinto

L'option `--dry-run` effectue une simulation d'import dans Kinto. Cette option permet de valider que le fichier Excel d'export est lu et interprété correctement, et que les données y figurant sont cohérentes. Cette option a beaucoup d'intérêt combinée à `--validate`.

```
$ python import-solen.py export-solen.xlsx --dry-run
```

#### Valider les enregistrements JSON générés

Cette commande validera chaque document JSON généré à partir d'un schema JSON.

```
$ python import-solen.py export-solen.xlsx --validate
```

#### Limiter le nombre de lignes traitées

```
$ python import-solen.py export-solen.xlsx --max=10
```

#### Importer une entreprise ou UES par son numéro SIREN

```
$ python import-solen.py export-solen.xlsx --siren=1234567890
```

#### Afficher la sortie JSON de l'import

```
$ python import-solen.py export-solen.xlsx --show-json --indent=2
```

Notez l'emploi de l'option `--indent` pour spécifier le niveau d'indentation JSON.

#### Afficher la sortie de debug

```
$ python import-solen.py export-solen.xlsx --debug
```

#### Sauver la sortie JSON dans un fichier

```
$ python import-solen.py export-solen.xlsx --save-as=export.json
```

#### Paramétrage d'accès à Kinto

Le script d'import lira les variables d'environnement suivantes pour se connecter à Kinto et procéder à l'importation des données :

- `KINTO_SERVER`: la racine URL du serveur Kinto (par défaut: `"http://localhost:8888/v1"`)
- `KINTO_ADMIN_LOGIN`: le nom d'utilisateur d'admin Kinto (par défaut: `"admin"`)
- `KINTO_ADMIN_PASSWORD`: le mot de passe admin Kinto (par défaut: `"passw0rd"`)
- `KINTO_BUCKET`: le nom du bucket Kinto (par défaut: `"egapro"`)
- `KINTO_COLLECTION`: le nom de la collection Kinto (par défaut: `"test-import"`; pour un import en production, il conviendra de spécifier le nom de la collection de production)

Pour surcharger une variable d'environnement, vous pouvez les positionner devant la commande appelée :

```
$ KINTO_COLLECTION=ma-collection python import-solen.py export-solen.xlsx
```
