# Egapro Kinto

## Prérequis

Vous devez disposer de Python 3.6+ et `pipenv`.

## Importer les données Solen en ligne de commande

```
$ pipenv run python solen.py export-solen.xlsx
```

ou bien, si vous souhaitez activer l'environnement projet de façon persistante :

```
$ pipenv shell
$ python solen.py export-solen.xlsx
```

### Préparation des données

Vous devez disposer d'un export Solen, généralement fourni par Laëtita C. (DGT) au format Excel (ex. `Export DGT 20191224.xlsx`), comportant deux feuilles :

- La première, "BDD REPONDANTS" avec les données de déclaration pour toutes les entreprises et UES;
- l'autre, "BDD UES", avec uniquement les données de déclaration spécifiques aux UES.

C'est le chemin vers ce fichier qu'il faut passer à la ligne de commande.

### Usage

```
$ python solen.py --help
usage: solen.py [-h] [-d] [-i INDENT] [-m MAX] [-j] [-f] [-s SAVE_AS]
                       [-v] [-r] [--siren SIREN] [-c]
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
  -f, --info            afficher les informations d'utilisation des champs
  -s SAVE_AS, --save-as SAVE_AS
                        sauvegarder la sortie JSON ou CSV dans un fichier
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
$ python solen.py export-solen.xlsx --dry-run
```

#### Valider les enregistrements JSON générés

Cette commande validera chaque document JSON généré à partir d'un schema JSON.

```
$ python solen.py export-solen.xlsx --validate
```

#### Limiter le nombre de lignes traitées

```
$ python solen.py export-solen.xlsx --max=10
```

#### Importer une entreprise ou UES par son numéro SIREN

```
$ python solen.py export-solen.xlsx --siren=1234567890
```

#### Afficher la sortie JSON de l'import

```
$ python solen.py export-solen.xlsx --show-json --indent=2
```

Notez l'emploi de l'option `--indent` pour spécifier le niveau d'indentation JSON.

#### Afficher la sortie de debug

```
$ python solen.py export-solen.xlsx --debug
```

#### Sauver la sortie JSON dans un fichier

```
$ python solen.py export-solen.xlsx --save-as=export.json
```

#### Ré-exporter les données Excel importées en CSV en préservant la sémantique JSON Egapro

```
$ python solen.py export-solen.xlsx --save-as=export.csv
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
$ KINTO_COLLECTION=ma-collection python solen.py export-solen.xlsx
```

## Utilisation de l'API Python

Le fichier `solen.py`, s'il peut être utilisé en ligne de commande comme vu précédemment, peut être importé depuis d'autres scripts Python.

Par exemple, pour importer un fichier Excel et procéder à son import dans Kinto, vous pouvez écrire :

```python
import solen


class Logger(solen.BaseLogger):
    def __init__(self):
        self.messages = []

    def std(self, str):
        self.messages.append(str)

    def error(self, str):
        self.messages.append(f"Erreur : {str}")

    def info(self, str):
        self.messages.append(f"Info : {str}")

    def success(self, str):
        self.messages.append(f"Succès : {str}")

    def warn(self, str):
        self.messages.append(f"Avertissement : {str}")


logger = Logger()

try:
    # générer et valider la première déclaration au format JSON
    app = solen.App(logger, "export20200102.xlsx", dry_run=True, max=1, validate=True)
    app.run()
except solen.AppError as err:
    print(f"Import échoué : {err}")

# Consultation des messages applicatifs
print(logger.messages)
```

Le constructeur de la classe `solen.App` accepte principalement les mêmes arguments que la ligne de commande :

### Arguments requis

- `logger`: le logger, permettant d'intercepter et éventuellement traiter les messages applicatifs. Un exemple de logger est fourni dans l'exemple au-dessus.
- `xls_path`: le chemin absolu vers le fichier Excel à traiter.

### Arguments optionnels

- `dry_run`: simuler l'importation effective dans Kinto (par défaut: `False`)
- `save_as`: exporter les résultats traités dans un fichier CSV ou JSON (par défaut: `None`)
- `init_collection`: initialiser la collection Kinto cible (par défaut: `False`)
- `max`: le nombre maximum d'enregistrements à importer (par défaut: `None`)
- `siren`: ne traiter que la déclaration associée au numéro SIREN spécifié (par défaut: `None`)
- `debug`: afficher des messages de débogage supplémentaires (par défaut: `False`)
- `validate`: valider la conformité des enregistrements JSON générés (par défaut: `False`)
- `show_json`: afficher les enregistrements JSON générés (par défaut: `False`)
- `indent`: indenter la sortie JSON au niveau spécifié (par défaut: `None`)
- `info`: afficher des informations supplémentaires sur les données Excel analysées (par défaut: `False`)
- `showProgress`: Afficher une barre de progression (utile uniquement en ligne de commande; par défaut: `False`)
