EgaPRO Kinto
============

## Importer les données Solen

Vous devez disposer de Python 3.6+ et `pipenv`.

```
$ pipenv run python import-solen.py <chemin_vers_solen.csv>  
```

### Usage

```
$ pipenv run python import-solen.py --help
usage: import-solen.py [-h] [--indent INDENT] [--max MAX] [--show-json]
                       csv_path

Import des données Solen.

positional arguments:
  csv_path         chemin vers l'export CSV Solen

optional arguments:
  -h, --help       show this help message and exit
  --indent INDENT  niveau d'indentation JSON
  --max MAX        nombre maximum de lignes à importer
  --show-json      afficher la sortie JSON
```
