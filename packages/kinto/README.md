Egapro Kinto
============

## Importer les données Solen

Vous devez disposer de Python 3.6+ et `pipenv`.

```
$ pipenv run python import-solen.py <chemin_vers_solen.csv>
```

ou bien, si vous souhaitez activer l'environnement projet de façon persistante :

```
$ pipenv shell
$ python import-solen.py <chemin_vers_solen.csv>
```

### Préparation des données

Vous devez disposer d'un export Solen, généralement fourni au format Excel (ex. `Export DGT 20191224.xlsx`), que vous devez exporter au format [CSV]. C'est le chemin vers cet export CSV qui devra être fourni à la ligne de commande.

Généralement les options d'export CSV par défaut sont les bonnes, par exemple ici sur LibreOffice:

![](https://i.imgur.com/Ar2n1rJ.png)

Soit :

- Jeu de caractères : UTF-8
- Délimiteur de champs : `,` (virgule)
- Séparateur de chaînes : `"` (guillement double)

### Usage

```
$ python import-solen.py --help                           
usage: import-solen.py [-h] [-d] [-i INDENT] [-m MAX] [-j] [-s SAVE_AS] [-v]
                       [--siren SIREN] [-c]
                       csv_path

Import des données Solen.

positional arguments:
  csv_path              chemin vers l'export CSV Solen

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
  --siren SIREN         importer le SIREN spécifié uniquement
  -c, --init-collection
                        Vider et recréer la collection Kinto avant import
```

#### Limiter le nombre de lignes traitées

```
$ python import-solen.py solen.csv --max=10
```

#### Importer une entreprise ou UES par son numéro SIREN

```
$ python import-solen.py solen.csv --siren=1234567890
```

#### Afficher la sortie JSON de l'import

```
$ python import-solen.py solen.csv --show-json --indent=2
```

Notez l'emploi de l'option `--indent` pour spécifier le niveau d'indentation JSON.

#### Afficher la sortie de debug

```
$ python import-solen.py solen.csv --debug
```

#### Valider les enregistrements JSON générés

Cette commande validera chaque document JSON généré à partir d'un schema JSON.

```
$ python import-solen.py --validate
```

#### Sauver la sortie JSON dans un fichier


```
$ python import-solen.py solen.csv --save-as=export.json
```

[CSV]: https://fr.wikipedia.org/wiki/Comma-separated_values

#### Paramétrage d'accès à Kinto

Le script d'import lira les variables d'environnement suivantes pour se connecter à Kinto et procéder à l'importation des données :

- `KINTO_SERVER`: la racine URL du serveur Kinto (par défaut: `"http://localhost:8888/v1"`)
- `KINTO_ADMIN_LOGIN`: le nom d'utilisateur d'admin Kinto (par défaut: `"admin"`)
- `KINTO_ADMIN_PASSWORD`: le mot de passe admin Kinto (par défaut: `"passw0rd"`)
- `KINTO_BUCKET`: le nom du bucket Kinto (par défaut: `"egapro"`)
- `KINTO_COLLECTION`: le nom de la collection Kinto (par défaut: `"test-import"`; pour un import en production, il conviendra de spécifier le nom de la collection de production)

Pour surcharger une variable d'environnement, vous pouvez les positionner devant la commande appelée :

```
$ KINTO_COLLECTION=ma-collection python import-solen.py solen.csv
```
