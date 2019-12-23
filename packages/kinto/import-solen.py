import argparse
import csv
import json
import re

from datetime import datetime, timedelta
from locale import atof, setlocale, LC_NUMERIC

# TODO
# - tu pourras valider que les champs Indicateur (1|2|3|...) (en fin du google
#   sheet) sont bien exactement les mêmes que nb_pt_obtenu_tab(1|2|3|...) dans
#   l'export solen ?
# - gérer import champ de type date

SOLEN_URL_PREFIX = "https://solen1.enquetes.social.gouv.fr/cgi-bin/HE/P?P="
RE_ARRAY_INDEX = re.compile(r"^(\w+)\[(\d)\]$")


def toPath(struct, path, value, toIndex=None):
    parts = path.split(".")
    for index, part in enumerate(parts):
        arrayIndex = RE_ARRAY_INDEX.match(part)
        if arrayIndex is not None:
            (arrayName, partIndex) = arrayIndex.groups()
            if arrayName not in struct:
                struct[arrayName] = []
            return toPath(struct[arrayName], ".".join(parts[1:]), value, toIndex=partIndex)
        elif isinstance(struct, list) and toIndex is not None:
            # FIXME: use toIndex to ensure insertion is done at the proper position in the list
            remaining = ".".join(parts)
            if remaining == "":
                struct.append(value)
            else:
                struct.append(toPath({}, remaining, value))
            return struct
        elif index == len(parts) - 1:
            struct[part] = value
            return struct
        else:
            if part not in struct:
                struct[part] = {}
            return toPath(struct[part], ".".join(parts[1:]), value)


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
        # Note: we're using French locale aware `atof` for casting to float here
        return self.importField(csvFieldName, path, type=atof)

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

    def extractId(self):
        return self.get("URL d'impression du répondant").replace(SOLEN_URL_PREFIX, "")

    def importPeriodeDeReference(self):
        # Année et périmètre retenus pour le calcul et la publication des indicateurs
        annee_indicateur = self.importIntField("annee_indicateurs", "informationsComplementaires.anneeDeclaration")
        self.importField("structure", "informationsComplementaires.structure")
        self.importField("tranche_effectif", "informations.trancheEffectifs")
        date_debut_pr = self.importField("date_debut_pr > Valeur date", "informations.debutPeriodeReference")
        if self.get("periode_ref") == "ac":
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
        # FIXME: comment est-il possible d'avoir un nombre de salariés à virgule ?
        self.importFloatField("nb_salaries > Valeur numérique", "effectifs.nombreSalariesTotal")

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

    def importIndicateurUn(self):
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

    def importIndicateurDeux(self):
        # Indicateur 2 relatif à l'écart de taux d'augmentations individuelles (hors promotion) entre
        # les femmes et les hommes pour les entreprises ou UES de plus de 250 salariés
        # Calculabilité
        calculable = self.get("calculabilite_indic_tab2_sup250")
        # Note: certaines cellules sont vides, nous répercutons tel quel en omettant le champ si vide
        if calculable == "Oui":
            self.set("indicateurDeux.nonCalculable", True)
        elif calculable == "Non":
            self.set("indicateurDeux.nonCalculable", False)
        self.importField("motif_non_calc_tab2_sup250", "indicateurDeux.motifNonCalculable")
        self.importField("precision_am_tab2_sup250", "indicateurDeux.motifNonCalculablePrecision")
        # Taux d'augmentation individuelle par CSP
        self.importFloatField("Ou_tab2_sup250", "indicateurDeux.tauxAugmentation[0].ecartTauxAugmentation")
        self.importFloatField("Em_tab2_sup250", "indicateurDeux.tauxAugmentation[1].ecartTauxAugmentation")
        self.importFloatField("TAM_tab2_sup250", "indicateurDeux.tauxAugmentation[2].ecartTauxAugmentation")
        self.importFloatField("IC_tab2_sup250", "indicateurDeux.tauxAugmentation[3].ecartTauxAugmentation")
        # Résultats
        self.importFloatField("resultat_tab2_sup250", "indicateurDeux.resultatFinal")
        self.importField("population_favorable_tab2_sup250", "indicateurDeux.sexeSurRepresente")
        self.importIntField("nb_pt_obtenu_tab2_sup250", "indicateurDeux.noteFinale")
        # Prise de mesures correctives
        priseEnCompte = self.get("prise_compte_mc_tab2_sup250")
        if priseEnCompte == "Oui":
            self.set("indicateurDeux.mesuresCorrection", True)
        elif priseEnCompte == "Non":
            self.set("indicateurDeux.mesuresCorrection", False)

    def importIndicateurTrois(self):
        # Indicateur 3 relatif à l'écart de taux de promotions entre les femmes et les hommes pour
        # les entreprises ou UES de plus de 250 salariés
        # Calculabilité
        calculable = self.get("calculabilite_indic_tab3_sup250")
        # Note: certaines cellules sont vides, nous répercutons tel quel en omettant le champ si vide
        if calculable == "Oui":
            self.set("indicateurTrois.nonCalculable", True)
        elif calculable == "Non":
            self.set("indicateurTrois.nonCalculable", False)
        self.importField("motif_non_calc_tab3_sup250", "indicateurTrois.motifNonCalculable")
        self.importField("precision_am_tab3_sup250", "indicateurTrois.motifNonCalculablePrecision")
        # Ecarts de taux de promotions par CSP
        self.importField("Ou_tab3_sup250", "indicateurTrois.tauxPromotion[0].ecartTauxPromotion")
        self.importField("Em_tab3_sup250", "indicateurTrois.tauxPromotion[1].ecartTauxPromotion")
        self.importField("TAM_tab3_sup250", "indicateurTrois.tauxPromotion[2].ecartTauxPromotion")
        self.importField("IC_tab3_sup250", "indicateurTrois.tauxPromotion[3].ecartTauxPromotion")
        # Résultats
        self.importFloatField("resultat_tab3_sup250", "indicateurTrois.resultatFinal")
        self.importField("population_favorable_tab3_sup250", "indicateurTrois.sexeSurRepresente")
        self.importIntField("nb_pt_obtenu_tab3_sup250", "indicateurTrois.noteFinale")
        # Prise de mesures correctives
        priseEnCompte = self.get("prise_compte_mc_tab3_sup250")
        if priseEnCompte == "Oui":
            self.set("indicateurTrois.mesuresCorrection", True)
        elif priseEnCompte == "Non":
            self.set("indicateurTrois.mesuresCorrection", False)


def processRow(row):
    importer = RowImporter(row)
    importer.importInformationsDeclarant()
    importer.importPeriodeDeReference()
    importer.importEntreprise()
    importer.importUES()
    importer.importNiveauResultat()
    importer.importIndicateurUn()
    importer.importIndicateurDeux()
    importer.importIndicateurTrois()
    return {
        "id": importer.extractId(),
        "data": importer.toDict(),
    }


def checkLocale():
    try:
        setlocale(LC_NUMERIC, "fr_FR.UTF-8")
    except Exception:
        print("Impossible d'utiliser la locale fr_FR.UTF-8")
        exit(1)


def parse(args):
    checkLocale()
    result = []
    with open(args.csv_path) as csv_file:
        reader = csv.DictReader(csv_file)
        count_processed = 0
        count_imported = 0
        for index, row in enumerate(reader):
            if args.max and count_processed >= args.max:
                break
            if args.siren and row["SIREN_ets"] != args.siren and row["SIREN_UES"] != args.siren:
                continue
            try:
                result.append(processRow(row))
                count_imported = count_imported + 1
            except KeyError as err:
                printer.error("Error importing line {0}: Missing key {1}".format(index, err))
            except ValueError as err:
                printer.error("Error importing line {0}: {1}".format(index, err))
            except RuntimeError as err:
                printer.error("Error importing line {0}: {1}".format(index, err))
            count_processed = count_processed + 1
    if args.show_json:
        printer.std(json.dumps(result, indent=args.indent))
    if args.siren and count_processed == 0:
        printer.error("Aucune entrée trouvée pour le Siren " + args.siren)
    else:
        if count_processed == count_imported:
            printer.info("Aucune erreur rencontrée.")
        printer.success("{0}/{1} ligne(s) importée(s).".format(count_imported, count_processed))


class printer:
    HEADER = "\033[95m"
    INFO = "\033[94m"
    SUCCESS = "\033[92m"
    WARNING = "\033[93m"
    ERROR = "\033[91m"
    ENDC = "\033[0m"
    BOLD = "\033[1m"
    UNDERLINE = "\033[4m"

    @staticmethod
    def std(str):
        print(str)

    @staticmethod
    def error(str):
        print(f"{printer.ERROR}✖  {str}{printer.ENDC}")

    @staticmethod
    def info(str):
        print(f"{printer.INFO}🛈  {str}{printer.ENDC}")

    @staticmethod
    def success(str):
        print(f"{printer.SUCCESS}✓  {str}{printer.ENDC}")

    @staticmethod
    def warn(str):
        print(f"{printer.WARNING}⚠️  {str}{printer.ENDC}")


parser = argparse.ArgumentParser(description="Import des données Solen.")
parser.add_argument("csv_path", type=str, help="chemin vers l'export CSV Solen")
parser.add_argument("--siren", type=str, help="importer le SIREN spécifié uniquement")
parser.add_argument("--indent", type=int, help="niveau d'indentation JSON", default=None)
parser.add_argument("--max", type=int, help="nombre maximum de lignes à importer", default=None)
parser.add_argument("--show-json", help="afficher la sortie JSON", action="store_true", default=False)

parse(parser.parse_args())
