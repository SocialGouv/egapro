import argparse
import csv
from datetime import datetime, timedelta
import json
import pprint

pp = pprint.PrettyPrinter(indent=4)

# TODO
# - tu pourras valider que les champs Indicateur (1|2|3|...) (en fin du google
#   sheet) sont bien exactement les mêmes que nb_pt_obtenu_tab(1|2|3|...) dans
#   l'export solen ?
# - gérer import champ de type date


def toPath(record, path, value):
    parts = path.split(".")
    for index, part in enumerate(parts):
        if index == len(parts) - 1:
            record[part] = value
            return record
        else:
            if part not in record:
                record[part] = {}
            return toPath(record[part], ".".join(parts[1:]), value)


class RowImporter(object):
    def __init__(self, row):
        self.row = row
        self.record = {}

    def __isValidValue(self, value):
        return value != "" and value != "-"

    def importField(self, csvFieldName, path, type=str):
        value = self.get(csvFieldName)
        if not value:
            return
        elif type != str:
            try:
                value = type(value)
            except Exception as err:
                raise ValueError("Couldn't cast {0} field value ('{1}') to {2}".format(csvFieldName, value, type))

        return self.set(path, value)

    def importFloatField(self, csvFieldName, path):
        return self.importField(csvFieldName, path, type=float)

    def importIntField(self, csvFieldName, path):
        return self.importField(csvFieldName, path, type=int)

    def get(self, csvFieldName):
        if csvFieldName not in self.row:
            raise KeyError("Row does not have a {0} field".format(csvFieldName))
        if not self.__isValidValue(self.row[csvFieldName]):
            return None
        return self.row[csvFieldName]

    def set(self, path, value):
        if self.__isValidValue(value):
            toPath(self.record, path, value)
            return value

    def toDict(self):
        return self.record

    def importPeriodeDeReference(self):
        # Année et périmètre retenus pour le calcul et la publication des indicateurs
        annee_indicateur = self.importIntField("annee_indicateurs", "informationsComplementaires.anneeDeclaration")
        self.importField("structure", "informationsComplementaires.structure")
        self.importField("tranche_effectif", "informations.trancheEffectifs")
        date_debut_pr = self.importField("date_debut_pr > Valeur date", "informations.debutPeriodeReference")
        if self.row["periode_ref"] == "ac":
            # année civile: 31 décembre de l'année précédent "annee_indicateurs"
            debutPeriodeReference = "01/01/" + str(annee_indicateur)
            finPeriodeReference = "31/12/" + str(annee_indicateur)
        elif date_debut_pr != "-":
            # autre période: rajouter un an à "date_debut_pr"
            debutPeriodeReference = date_debut_pr
            finPeriodeReference = (datetime.strptime(date_debut_pr, "%d/%m/%Y") + timedelta(days=365)).strftime("%d/%m/%Y")
        else:
            # autre période de référence sans début spécifié: erreur
            raise RuntimeError("Données de période de référence incohérentes.")
        self.set("informations.debutPeriodeReference", debutPeriodeReference)
        self.set("informations.finPeriodeReference", finPeriodeReference)
        self.importIntField("nb_salaries > Valeur numérique", "effectifs.nombreSalariesTotal")

    def importInformationsDeclarant(self):
        # Identification du déclarant pour tout contact ultérieur
        self.importField("Nom", "informationsDeclarant.nom")
        self.importField("Prénom", "informationsDeclarant.prenom")
        self.importField("telephone", "informationsDeclarant.tel")
        self.importField("Reg", "informationsDeclarant.region")
        self.importField("dpt", "informationsDeclarant.departement")
        self.importField("Adr ets", "informationsDeclarant.adresse")
        self.importField("CP", "informationsDeclarant.codePosal")
        self.importField("Commune", "informationsDeclarant.commune")

    def importEntreprise(self):
        self.importField("RS_ets", "informationsEntreprise.nomEntreprise")
        self.importField("SIREN_ets", "informationsEntreprise.siren")
        self.importField("Code NAF", "informationsEntreprise.codeNaf")  # attention format

    def importUES(self):
        self.importField("nom_UES", "informationsEntreprise.nomUES")
        self.importField("nom_ets_UES", "informationsEntreprise.nomsEntreprisesUES")
        self.importField("SIREN_UES", "informationsEntreprise.sirenUES")
        self.importField("Code NAF de cette entreprise", "informationsEntreprise.codeNAF")  # attention format
        self.importIntField("Nb_ets_UES", "informationsEntreprise.nombresEntreprises")

    def importNiveauResultat(self):
        # Niveau de résultat de l'entreprise ou de l'UES
        self.importField("date_publ_niv > Valeur date", "declaration.datePublication")
        self.importField("site_internet_publ", "declaration.lienPublication")

    def importIndicateur1(self):
        # Indicateur 1 relatif à l'écart de rémunération entre les femmes et les hommes
        # Quatre items possibles :
        # - coef_niv: Par niveau ou coefficient hiérarchique en application de la classification de branche
        # - amc: Par niveau ou coefficient hiérarchique en application d'une autre méthode de cotation des postes
        # - csp: Par catégorie socio-professionnelle
        # - nc: L'indicateur n'est pas calculable
        # Mapping:
        # csp       -> indicateurUn.csp
        # coef_nif  -> indicateurUn.coefficients
        # nc et amc -> indicateurUn.autre
        modalite = self.get("modalite_calc_tab1")
        if modalite == "csp":
            self.set("indicateurUn.csp", True)
        elif modalite == "coefficients":
            self.set("indicateurUn.coeffficients", True)
        else:
            self.set("indicateurUn.autre", True)
        self.importField("date_consult_CSE > Valeur date", "indicateurUn.dateConsultationCSE")
        self.importIntField("nb_coef_niv", "indicateurUn.nombreCoefficients")
        # FIXME: pour le moment un bug de formattage de cellule nous empêche de
        # connaître à quelle tranche d'âge correspond chaque chiffre dans la cellule
        self.importFloatField("resultat_tab1", "indicateurUn.resultatFinal")
        self.importField("population_favorable_tab1", "indicateurUn.sexeSurRepresente")
        self.importIntField("nb_pt_obtenu_tab1", "indicateurUn.noteFinale")


def processRow(row):
    importer = RowImporter(row)
    importer.importInformationsDeclarant()
    importer.importPeriodeDeReference()
    importer.importEntreprise()
    importer.importUES()
    importer.importNiveauResultat()
    importer.importIndicateur1()
    return {"data": importer.toDict()}


def parse(csv_path):
    # TODO:
    # --indent option
    # --max option
    result = []
    with open(csv_path) as csv_file:
        reader = csv.DictReader(csv_file)
        count_processed = 0
        count_imported = 0
        for index, row in enumerate(reader):
            if count_processed >= 2:
                break
            try:
                result.append(processRow(row))
                count_imported = count_imported + 1
            except KeyError as err:
                print("Error importing line {0}: Missing key {1}".format(index, err))
            except ValueError as err:
                print("Error importing line {0}: {1}".format(index, err))
            except RuntimeError as err:
                print("Error importing line {0}: {1}".format(index, err))
            count_processed = count_processed + 1
        print("{0}/{1} records imported.".format(count_imported, count_processed))
        # pp.pprint(result)
        return json.dumps(result, indent=2)


parser = argparse.ArgumentParser(description="Import Solen data into Kinto.")
parser.add_argument("csv_path", type=str, help="path to Solen CSV file")
args = parser.parse_args()

print(parse(args.csv_path))
