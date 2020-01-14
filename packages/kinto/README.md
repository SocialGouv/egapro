# Egapro Kinto

## Prérequis

Vous devez disposer de Python 3.6+ et `pipenv`.

## Importer les données Solen en ligne de commande

![screecast de démo](https://i.imgur.com/bIZVY5u.gif)

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

### Tester le script localement

Pour tester le script d'import localement, il vous faut lancer le serveur de développement depuis la racine du dépôt :

```
$ yarn start
```

Ainsi, le serveur Kinto local lancé vous permettra d'effectuer vos tests tranquillement.

### Usage

```
$ python solen.py export-solen.xlsx --help
usage: solen.py [-h] [-d] [-i INDENT] [-m MAX] [-j] [-f] [-s SAVE_AS] [-r]
                [-p] [--siren SIREN] [-c]
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
  -r, --dry-run         ne pas procéder à l'import dans Kinto
  -p, --progress        afficher une barre de progression
  --siren SIREN         importer le SIREN spécifié uniquement
  -c, --init-collection
                        Vider et recréer la collection Kinto avant import

```

Notez que les options sont cumulatives.

#### Simuler l'import dans Kinto

L'option `--dry-run` effectue une simulation d'import dans Kinto. Cette option permet de valider que le fichier Excel d'export est lu et interprété correctement, et que les données y figurant sont intègres et cohérentes.

```
$ python solen.py export-solen.xlsx --dry-run
```

#### Afficher une barre de progression pour la préparation des données

```
$ python solen.py export-solen.xlsx --progress
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
try:
    # Importer les 100 premières déclarations dans Kinto
    app = solen.App("export20200102.xlsx", usePrompt=False, max=100)
    app.importIntoKinto(init_collection=True)
except solen.AppError as err:
    print(f"Import échoué : {err}")
    for error in err.errors:
        print("- {error}")
```

## La classe `App(xls_path, max=None, siren=None, debug=False, progress=False, usePrompt=False, logger=None)`

Le constructeur de la classe `solen.App` accepte principalement les mêmes arguments que la ligne de commande :

#### Arguments requis

- `xls_path`: le chemin absolu vers le fichier Excel à traiter.

#### Arguments optionnels

- `max`: le nombre maximum d'enregistrements à importer (par défaut: `None`)
- `siren`: ne traiter que la déclaration associée au numéro SIREN spécifié (par défaut: `None`)
- `debug`: afficher des messages de débogage supplémentaires (par défaut: `False`)
- `progress`: Afficher une barre de progression (utile uniquement en ligne de commande; par défaut: `False`)
- `usePrompt`: Demande confirmation à l'utilisateur pour les opérations dangereuses (utile uniquement en ligne de commande; par défaut: `False`)
- `logger`: un logger spécifique, permettant d'intercepter et éventuellement traiter les messages applicatifs (voir documentation ci-après; default: `None`)

### La méthode `App#importIntoKinto(init_collection=False, dryRun=False)`

Importe les données Solen Excel dans Kinto.

Options:

- `init_collection`: initialiser la collection Kinto cible (par défaut: `False`)
- `dryRun`: simuler l'importation effective dans Kinto (par défaut: `False`)

### La méthode `App#toCSV()`

Retourne une chaîne CSV des enregistrements calculés.

### La méthode `App#toJSON(indent=None)`

Retourne une chaîne CSV des enregistrements calculés.

Options:

- `indent`: indenter la sortie JSON au niveau spécifié (par défaut: `None`)

### La méthode `App#getStats()`

Retourne des informations supplémentaires sur les données Excel analysées.

### Utilisation d'un _logger_ spécifique

Un logger est un objet destiné à recevoir et traiter les messages applicatifs lors des opérations d'import. Il vous est possible de définir un logger particulier pour intercepter et traiter ces messages en surchargeant la classe `solen.BaseLogger` et en implémentant les méthodes ad-hoc:

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
solen.App("export20200102.xlsx", logger=logger).importIntoKinto()

# Consultation des messages applicatifs
print(logger.messages)
```
