import argparse
import csv
import dpath
import io
import json
import kinto_http
import os
import pandas
import re
import sys
import tarfile

from collections import OrderedDict
from datetime import datetime, timedelta
from jsonschema import Draft7Validator
from jsonschema.exceptions import ValidationError
from kinto_http.exceptions import KintoException
from kinto_http.patch_type import BasicPatch
from progress.bar import Bar
from requests.exceptions import ConnectionError
from xlrd.biffh import XLRDError

# TODO:
# - exception perso pour les classes d'import
# - empêcher l'import dans Kinto si tous les enregistrements ne valident pas


# Configuration de l'import CSV
CELL_SKIPPABLE_VALUES = ["", "-", "NC", "non applicable", "non calculable"]
DATE_FORMAT_INPUT = "%Y-%m-%d %H:%M:%S"
DATE_FORMAT_OUTPUT = "%d/%m/%Y"
EXCEL_NOM_FEUILLE_REPONDANTS = "BDD REPONDANTS"
EXCEL_NOM_FEUILLE_UES = "BDD UES"
SOLEN_URL_PREFIX = "https://solen1.enquetes.social.gouv.fr/cgi-bin/HE/P?P="

# Configuration de Kinto
KINTO_SERVER = os.environ.get("KINTO_SERVER", "http://localhost:8888/v1")
KINTO_ADMIN_LOGIN = os.environ.get("KINTO_ADMIN_LOGIN", "admin")
KINTO_ADMIN_PASSWORD = os.environ.get("KINTO_ADMIN_PASSWORD", "passw0rd")
KINTO_BUCKET = os.environ.get("KINTO_BUCKET", "egapro")
KINTO_COLLECTION = os.environ.get("KINTO_COLLECTION", "test-import")


class RowProcessor(object):
    def __init__(self, row, validator, debug=False):
        if row is None:
            raise RuntimeError("Échec d'import d'une ligne vide.")
        self.debug = debug
        self.row = row
        self.validator = validator
        self.record = {}

    def log(self, msg):
        if self.debug:
            printer.std(msg)

    def importField(self, csvFieldName, path, type=str):
        value = self.get(csvFieldName)
        if not value:
            return
        elif type != str:
            try:
                value = type(value)
            except ValueError as err:
                raise ValueError(f"Couldn't cast {csvFieldName} field value ('{value}') to {type}")

        return self.set(path, value)

    def importBooleanField(self, csvFieldName, path, negate=False):
        # Note: si la valeur du champ n'est ni "Oui" no "Non", nous n'importons pas la donnée
        if self.get(csvFieldName) == "Oui":
            return self.set(path, True if not negate else False)
        elif self.get(csvFieldName) == "Non":
            return self.set(path, False if not negate else True)

    def importDateField(self, csvFieldName, path):
        date = self.get(csvFieldName)
        if date is None:
            return
        try:
            formatted = datetime.strptime(date, DATE_FORMAT_INPUT).strftime(DATE_FORMAT_OUTPUT)
            return self.set(path, formatted)
        except ValueError as err:
            raise RuntimeError(f"Impossible de traiter la valeur date '{date}'.")

    def importFloatField(self, csvFieldName, path):
        return self.importField(csvFieldName, path, type=float)

    def importIntField(self, csvFieldName, path):
        return self.importField(csvFieldName, path, type=int)

    def get(self, csvFieldName):
        if csvFieldName not in self.row:
            raise KeyError(f"Row does not have a {csvFieldName} field")
        if self.row[csvFieldName] in CELL_SKIPPABLE_VALUES:
            return None
        return self.row[csvFieldName]

    def set(self, path, value):
        self.log(f"set {path} to {value}")
        if value not in CELL_SKIPPABLE_VALUES:
            try:
                dpath.util.get(self.record, path)
                result = dpath.util.set(self.record, path, value)
            except KeyError as err:
                result = dpath.util.new(self.record, path, value)
            if result == 0:
                raise RuntimeError(f"Unable to set {path} to {value}")
            return value

    def toKintoRecord(self, validate=False):
        kintoRecord = {"id": self.row["id"], "data": self.record}
        if validate:
            try:
                self.validator.validate(kintoRecord)
            except ValidationError as err:
                raise RuntimeError(
                    "\n   ".join(
                        [
                            f"Validation JSON échouée pour la directive '{err.validator}':",
                            f"Message: {err.message}",
                            f"Chemin: {'.'.join(list(err.path))}",
                        ]
                    )
                )
        return kintoRecord

    def importPeriodeDeReference(self):
        self.importDateField("date_consult_CSE > Valeur date", "informationsComplementaires/dateConsultationCSE")

        # Année et périmètre retenus pour le calcul et la publication des indicateurs
        annee_indicateur = self.importIntField("annee_indicateurs", "informationsComplementaires/anneeDeclaration")

        # Compatibilité egapro de la tranche d'effectifs
        tranche = self.get("tranche_effectif")
        if tranche == "De 50 à 250 inclus":
            tranche = "50 à 250"
        self.set("informations/trancheEffectifs", tranche)

        # Période de référence
        date_debut_pr = self.importField("date_debut_pr > Valeur date", "informations/debutPeriodeReference")
        if self.get("periode_ref") == "ac":
            # année civile: 31 décembre de l'année précédent "annee_indicateurs"
            debutPeriodeReference = "01/01/" + str(annee_indicateur - 1)
            finPeriodeReference = "31/12/" + str(annee_indicateur - 1)
        elif date_debut_pr != "-":
            # autre période: rajouter un an à "date_debut_pr"
            (debutPeriodeReference, delta) = (date_debut_pr, timedelta(days=365))
            finPeriodeReference = (datetime.strptime(date_debut_pr, DATE_FORMAT_INPUT) + delta).strftime(DATE_FORMAT_OUTPUT)
        else:
            # autre période de référence sans début spécifié: erreur
            raise RuntimeError("Données de période de référence incohérentes.")
        self.set("informations/debutPeriodeReference", debutPeriodeReference)
        self.set("informations/finPeriodeReference", finPeriodeReference)

        # Note: utilisation d'un nombre à virgule pour prendre en compte les temps partiels
        self.importFloatField("nb_salaries > Valeur numérique", "effectif/nombreSalariesTotal")

    def importInformationsDeclarant(self):
        # Identification du déclarant pour tout contact ultérieur
        self.importField("Nom", "informationsDeclarant/nom")
        self.importField("Prénom", "informationsDeclarant/prenom")
        self.importField("e-mail_declarant", "informationsDeclarant/email")
        self.importField("telephone", "informationsDeclarant/tel")

    def importInformationsEntreprise(self):
        self.importField("RS_ets", "informationsEntreprise/nomEntreprise")
        self.importField("SIREN_ets", "informationsEntreprise/siren")
        self.importField("Code NAF", "informationsEntreprise/codeNaf")  # attention format
        self.importField("Reg", "informationsEntreprise/region")
        self.importField("dpt", "informationsEntreprise/departement")
        self.importField("Adr ets", "informationsEntreprise/adresse")
        self.importField("CP", "informationsEntreprise/codePostal")
        self.importField("Commune", "informationsEntreprise/commune")

    def importEntreprisesUES(self):
        uesData = self.get("__uesdata__")
        if uesData is None:
            raise RuntimeError(f"Données UES absentes pour le siren {row['SIREN_UES']}.")
        # Note: toutes les cellules pour UES001 sont vides, nous commençons à UES002
        columns2_99 = ["UES{:02d}".format(x) for x in range(2, 100)]
        columns100_500 = ["UES{:03d}".format(x) for x in range(100, 501)]
        columns = columns2_99 + columns100_500
        entreprises = []
        for column in columns:
            value = uesData[column]
            if value == "":
                break
            [raisonSociale, siren] = value.split("\n")
            entreprises.append({"nom": raisonSociale, "siren": siren})
        self.set("informationsEntreprise/nombresEntreprises", len(entreprises))
        self.set("informationsEntreprise/entreprises", entreprises)

    def importUES(self):
        if self.get("nom_UES") is None:
            self.set("informationsEntreprise/structure", "Entreprise")
        else:
            self.set("informationsEntreprise/structure", "UES")
            # Import des données de l'UES
            self.importField("nom_UES", "informationsEntreprise/nomUES")
            self.importField("nom_ets_UES", "informationsEntreprise/nomEntrepriseUES")
            self.importField("SIREN_UES", "informationsEntreprise/sirenUES")
            self.importEntreprisesUES()

    def importNiveauResultat(self):
        # Niveau de résultat de l'entreprise ou de l'UES
        self.importDateField("date_publ_niv > Valeur date", "declaration/datePublication")
        self.importField("site_internet_publ", "declaration/lienPublication")

    def setValeursTranche(self, niveau, path, index, fieldName, custom=False):
        niveaux = [niveau + " > -30", niveau + " > 30-39", niveau + " > 40-49", niveau + " > 50+"]
        values = [self.get(col) for col in niveaux]
        tranches = [None, None, None, None]
        for trancheIndex, value in enumerate(values):
            tranches[trancheIndex] = {"trancheAge": trancheIndex}
            if value is not None:
                tranches[trancheIndex][fieldName] = float(value)
            payload = {"tranchesAges": tranches}
            if custom:
                payload["name"] = "niveau " + str(index + 1)
            else:
                payload["categorieSocioPro"] = index
        self.set(f"{path}/{index}", payload)

    def setValeursTranches(self, niveaux, path, fieldName, custom=False):
        self.set(path, [])
        for index, niveau in enumerate(niveaux):
            self.setValeursTranche(niveau, path, index, fieldName, custom)

    def setValeursEcart(self, niveau, path, index, fieldName):
        categorie = {"categorieSocioPro": index}
        value = self.get(niveau)
        if value is not None:
            categorie[fieldName] = float(value)
        self.set(f"{path}/{index}", categorie)

    def setValeursEcarts(self, niveaux, path, fieldName):
        self.set(path, [])
        for index, niveau in enumerate(niveaux):
            self.setValeursEcart(niveau, path, index, fieldName)

    def importTranchesCsp(self):
        self.setValeursTranches(["Ou", "Em", "TAM", "IC"], "indicateurUn/remunerationAnnuelle", "ecartTauxRemuneration")

    def importTranchesCoefficients(self):
        try:
            max = int(self.get("nb_coef_niv"))
        except (KeyError, ValueError) as err:
            raise RuntimeError(
                "Valeur nb_coef_niv non renseignée, indispensable pour une déclaration par niveaux de coefficients"
            )
        niveaux = ["niv{:02d}".format(niv) for niv in range(1, max + 1)]
        self.setValeursTranches(niveaux, "indicateurUn/coefficient", "ecartTauxRemuneration", custom=True)

    def importIndicateurUn(self):
        # Indicateur 1 relatif à l'écart de rémunération entre les femmes et les hommes
        # Quatre items possibles :
        # - coef_niv: Par niveau ou coefficient hiérarchique en application de la classification de branche
        # - amc: Par niveau ou coefficient hiérarchique en application d'une autre méthode de cotation des postes
        # - csp: Par catégorie socio-professionnelle
        # - nc: L'indicateur n'est pas calculable
        # Mapping:
        # csp       -> indicateurUn/csp
        # coef_nif  -> indicateurUn/coefficients
        # nc et amc -> indicateurUn/autre
        modalite = self.get("modalite_calc_tab1")
        self.set("indicateurUn/csp", False)
        self.set("indicateurUn/coef", False)
        self.set("indicateurUn/autre", False)
        self.set("indicateurUn/nonCalculable", False)
        if modalite == "csp":
            self.set("indicateurUn/csp", True)
        elif modalite == "coef_niv":
            self.set("indicateurUn/coef", True)
        elif modalite == "amc":
            self.set("indicateurUn/autre", True)
        elif modalite == "nc":
            self.set("indicateurUn/autre", True)
            self.set("indicateurUn/nonCalculable", True)
        self.importIntField("nb_coef_niv", "indicateurUn/nombreCoefficients")
        self.importField("motif_non_calc_tab1", "indicateurUn/motifNonCalculable")
        self.importField("precision_am_tab1", "indicateurUn/motifNonCalculablePrecision")
        if modalite == "csp":
            self.importTranchesCsp()
        elif modalite == "coef_niv":
            self.importTranchesCoefficients()
        # Résultat
        self.importFloatField("resultat_tab1", "indicateurUn/resultatFinal")
        self.importField("population_favorable_tab1", "indicateurUn/sexeSurRepresente")
        self.importIntField("nb_pt_obtenu_tab1", "indicateurUn/noteFinale")

    def importIndicateurDeux(self):
        # Indicateur 2 relatif à l'écart de taux d'augmentations individuelles (hors promotion) entre
        # les femmes et les hommes pour les entreprises ou UES de plus de 250 salariés
        # Calculabilité
        nonCalculable = self.importBooleanField("calculabilite_indic_tab2_sup250", "indicateurDeux/nonCalculable", negate=True)
        self.set("indicateurDeux/presenceAugmentation", not nonCalculable)
        self.importField("motif_non_calc_tab2_sup250", "indicateurDeux/motifNonCalculable")
        self.importField("precision_am_tab2_sup250", "indicateurDeux/motifNonCalculablePrecision")
        # Taux d'augmentation individuelle par CSP
        self.setValeursEcarts(
            ["Ou_tab2_sup250", "Em_tab2_sup250", "TAM_tab2_sup250", "IC_tab2_sup250"],
            "indicateurDeux/tauxAugmentation",
            "ecartTauxAugmentation",
        )
        # Résultats
        self.importFloatField("resultat_tab2_sup250", "indicateurDeux/resultatFinal")
        self.importField("population_favorable_tab2_sup250", "indicateurDeux/sexeSurRepresente")
        self.importIntField("nb_pt_obtenu_tab2_sup250", "indicateurDeux/noteFinale")
        # Prise de mesures correctives
        self.importBooleanField("prise_compte_mc_tab2_sup250", "indicateurDeux/mesuresCorrection")

    def importIndicateurTrois(self):
        # Indicateur 3 relatif à l'écart de taux de promotions entre les femmes et les hommes pour
        # les entreprises ou UES de plus de 250 salariés
        # Calculabilité
        nonCalculable = self.importBooleanField("calculabilite_indic_tab3_sup250", "indicateurTrois/nonCalculable", negate=True)
        self.set("indicateurDeuxTrois/presenceAugmentationPromotion", not nonCalculable)
        self.importField("motif_non_calc_tab3_sup250", "indicateurTrois/motifNonCalculable")
        self.importField("precision_am_tab3_sup250", "indicateurTrois/motifNonCalculablePrecision")
        # Ecarts de taux de promotions par CSP
        self.setValeursEcarts(
            ["Ou_tab3_sup250", "Em_tab3_sup250", "TAM_tab3_sup250", "IC_tab3_sup250"],
            "indicateurTrois/tauxPromotion",
            "ecartTauxPromotion",
        )
        # Résultats
        self.importFloatField("resultat_tab3_sup250", "indicateurTrois/resultatFinal")
        self.importField("population_favorable_tab3_sup250", "indicateurTrois/sexeSurRepresente")
        self.importIntField("nb_pt_obtenu_tab3_sup250", "indicateurTrois/noteFinale")
        # Prise de mesures correctives
        self.importBooleanField("prise_compte_mc_tab3_sup250", "indicateurTrois/mesuresCorrection")

    def importIndicateurDeuxTrois(self):
        # Indicateur 2 relatif à l'écart de taux d'augmentations individuelles (hors promotion)
        # entre les femmes et les hommes pour les entreprises ou UES de 50 à 250 salariés
        nonCalculable = self.importBooleanField(
            "calculabilite_indic_tab2_50-250", "indicateurDeuxTrois/nonCalculable", negate=True
        )
        self.set("indicateurDeuxTrois/presenceAugmentationPromotion", not nonCalculable)
        self.importField("motif_non_calc_tab2_50-250", "indicateurDeuxTrois/motifNonCalculable")
        self.importField("precision_am_tab2_50-250", "indicateurDeuxTrois/motifNonCalculablePrecision")
        # Résultats
        self.importFloatField("resultat_pourcent_tab2_50-250", "indicateurDeuxTrois/resultatFinalEcart")
        self.importFloatField("resultat_nb_sal_tab2_50-250", "indicateurDeuxTrois/resultatFinalNombreSalaries")
        self.importField("population_favorable_tab2_50-250", "indicateurDeuxTrois/sexeSurRepresente")
        self.importIntField("nb_pt_obtenu_tab2_50-250", "indicateurDeuxTrois/noteFinale")
        # Prise de mesures correctives
        self.importBooleanField("prise_compte_mc_tab2_50-250", "indicateurDeuxTrois/mesuresCorrection")

    def importIndicateurQuatre(self):
        # Indicateur 4 relatif au pourcentage de salariées ayant bénéficié d'une
        # augmentation dans l'année suivant leur retour de congé de maternité
        #
        # Note: le fichier d'export Solen renseigne des jeux de colonnes distincts
        # pour les entreprises de 50 à 250 salariés et les entreprises de plus de
        # 250 salariés, mais nous les fusionnons ici.
        #
        if self.get("tranche_effectif") == "50 à 250":
            # Import des données pour les entreprises +250
            nonCalculable = self.importBooleanField(
                "calculabilite_indic_tab4_50-250", "indicateurQuatre/nonCalculable", negate=True
            )
            self.importField("motif_non_calc_tab4_50-250", "indicateurQuatre/motifNonCalculable")
            self.importField("precision_am_tab4_50-250", "indicateurQuatre/motifNonCalculablePrecision")
            self.importIntField("resultat_tab4_50-250", "indicateurQuatre/resultatFinal")
            self.importIntField("nb_pt_obtenu_tab4_50-250", "indicateurQuatre/noteFinale")
        else:
            # Import des données pour les entreprises 50-250
            nonCalculable = self.importBooleanField(
                "calculabilite_indic_tab4_sup250", "indicateurQuatre/nonCalculable", negate=True
            )
            self.importField("motif_non_calc_tab4_sup250", "indicateurQuatre/motifNonCalculable")
            self.importField("precision_am_tab4_sup250", "indicateurQuatre/motifNonCalculablePrecision")
            self.importFloatField("resultat_tab4_sup250", "indicateurQuatre/resultatFinal")
            self.importIntField("nb_pt_obtenu_tab4_sup250", "indicateurQuatre/noteFinale")
        self.set("indicateurQuatre/presenceCongeMat", not nonCalculable)

    def importIndicateurCinq(self):
        self.importFloatField("resultat_tab5", "indicateurCinq/resultatFinal")
        self.importField("sexe_sur_represente_tab5", "indicateurCinq/sexeSurRepresente")
        self.importIntField("nb_pt_obtenu_tab5", "indicateurCinq/noteFinale")

    def importNombreDePointsObtenus(self):
        # Nombre de points obtenus  à chaque indicateur attribué automatiquement
        self.importIntField("Indicateur 1", "declaration/indicateurUn")
        self.importIntField("Indicateur 2", "declaration/indicateurDeux")
        self.importIntField("Indicateur 2 PourCent", "declaration/indicateurDeuxTroisEcart")
        self.importIntField("Indicateur 2 ParSal", "declaration/indicateurDeuxTroisNombreSalaries")
        self.importIntField("Indicateur 3", "declaration/indicateurTrois")
        self.importIntField("Indicateur 4", "declaration/indicateurQuatre")
        self.importIntField("Indicateur 5", "declaration/indicateurCinq")

    def importNiveauDeResultatGlobal(self):
        self.importFloatField("resultat_global_NbPtsMax", "declaration/noteMax")
        self.importIntField("Nombre total de points obtenus", "declaration/noteFinale")
        self.importIntField("Nombre total de points pouvant être obtenus", "declaration/nombrePointsMax")
        self.importIntField("Résultat final sur 100 points", "declaration/noteFinaleSur100")
        self.importField("mesures_correction", "declaration/mesuresCorrection")

    def run(self, validate=False):
        self.importDateField("Date réponse > Valeur date", "declaration/dateDeclaration")
        self.importInformationsDeclarant()
        self.importPeriodeDeReference()
        self.importInformationsEntreprise()
        self.importUES()
        self.importNiveauResultat()
        self.importIndicateurUn()
        if self.get("tranche_effectif") == "50 à 250":
            self.importIndicateurDeuxTrois()
        else:
            self.importIndicateurDeux()
            self.importIndicateurTrois()
        self.importIndicateurQuatre()
        self.importIndicateurCinq()
        self.importNombreDePointsObtenus()
        self.importNiveauDeResultatGlobal()

        return self.toKintoRecord(validate)


def prompt(question, default="oui"):
    valid = {"oui": True, "o": True, "non": False, "n": False}
    if default is None:
        choices = " [o/n] "
    elif default == "oui":
        choices = " [O/n] "
    elif default == "non":
        choices = " [o/N] "
    else:
        raise ValueError("Valeur par défaut invalide: '%s'" % default)
    while True:
        printer.std(question + choices)
        choice = input().lower()
        if default is not None and choice == "":
            return valid[default]
        elif choice in valid:
            return valid[choice]
        else:
            printer.warn("Répondez par 'oui' ou 'non' (ou 'o' ou 'n')")


def initValidator(jsonschema_path):
    with open(jsonschema_path, "r") as schema_file:
        return Draft7Validator(json.load(schema_file))


class ExcelData(object):
    def __init__(self, pathToExcelFile):
        try:
            excel = pandas.read_excel(
                pathToExcelFile,
                sheet_name=[EXCEL_NOM_FEUILLE_REPONDANTS, EXCEL_NOM_FEUILLE_UES],
                dtype={"CP": str, "telephone": str, "SIREN_ets": str, "SIREN_UES": str},
            )
        except XLRDError as err:
            raise RuntimeError(f"Le format du fichier {pathToExcelFile} n'a pu être interprété.")
        self.repondants = self.importSheet(excel, EXCEL_NOM_FEUILLE_REPONDANTS)
        self.ues = self.importSheet(excel, EXCEL_NOM_FEUILLE_UES)
        self.linkUes()

    def importSheet(self, excel, sheetName):
        sheet = excel.get(sheetName)
        if sheet.empty:
            raise RuntimeError(f"Feuille de calcul '{sheetName}' absente ou vide.")
        try:
            csvString = sheet.to_csv(float_format="%g")
            lines = [row for row in csv.DictReader(io.StringIO(csvString))]
            return self.createDict(lines)
        except (AttributeError, KeyError, IndexError, TypeError, ValueError) as err:
            raise RuntimeError(f"Impossible de traiter la feuille de calcul {sheetName}: {err}")

    def createDict(self, source):
        dict = OrderedDict()
        for row in source:
            solenId = row["URL d'impression du répondant"].replace(SOLEN_URL_PREFIX, "")
            dict[solenId] = row
            dict[solenId]["id"] = solenId
        return dict

    def findUesById(self, id):
        found = self.ues.get(id)
        if not found:
            printer.warn(f"Données UES non trouvées pour l'id {id}. Vérifiez la feuille {EXCEL_NOM_FEUILLE_UES}.")
        return found

    def linkUes(self):
        for id, row in self.repondants.items():
            if row["structure"] == "Unité Economique et Sociale (UES)":
                row["__uesdata__"] = self.findUesById(id)
                self.repondants[id] = row

    def getNbRepondants(self):
        return len(self.repondants)


class KintoImporter(object):
    def __init__(self, schema, truncate=False, dryRun=False):
        self.toImport = []
        self.schema = schema
        self.truncate = truncate
        self.dryRun = dryRun
        if not dryRun:
            self.client = self.setUp()
        else:
            self.client = None

    def setUp(self):
        printer.info("Vérifications Kinto")
        client = kinto_http.Client(server_url=KINTO_SERVER, auth=(KINTO_ADMIN_LOGIN, KINTO_ADMIN_PASSWORD))
        try:
            info = client.server_info()
        except ConnectionError as err:
            printer.error(f"Connection au serveur Kinto impossible: {err}")
            printer.info("Vérifiez la documentation pour paramétrer l'accès.")
            exit(1)
        if "schema" not in info["capabilities"]:
            printer.error("Le serveur Kinto ne supporte pas la validation par schéma.")
            exit(1)
        else:
            printer.success("Validation de schéma activée.")
        if self.truncate:
            if not prompt("Confimer la suppression et recréation de la collection existante ?", "non"):
                printer.std("Commande annulée.")
                exit(0)
            printer.warn("Suppression de la collection Kinto existante...")
            client.delete_collection(id=KINTO_COLLECTION, bucket=KINTO_BUCKET)
            printer.success("La collection précédente a été supprimée.")
        try:
            coll = client.get_collection(id=KINTO_COLLECTION, bucket=KINTO_BUCKET)
            printer.success("La collection existe.")
        except KintoException as err:
            printer.warn("La collection n'existe pas, création")
            try:
                coll = client.create_collection(id=KINTO_COLLECTION, data={"schema": self.schema}, bucket=KINTO_BUCKET)
                printer.success("La collection a été crée.")
            except KintoException as err:
                printer.error(f"Impossible de créer la collection: {err}")
        if "schema" not in coll["data"]:
            printer.warn("La collection ne possède pas schéma de validation JSON.")
            printer.info(f"Ajout du schéma à la collection {KINTO_COLLECTION}.")
            try:
                patch = BasicPatch(data={"schema": self.schema})
                client.patch_collection(id=KINTO_COLLECTION, bucket=KINTO_BUCKET, changes=patch)
                printer.info("Le schéma de validation JSON a été ajouté à la collection.")
            except (KintoException, TypeError, KeyError, ValueError) as err:
                printer.error(f"Impossible d'ajouter le schéma de validation à la collection {KINTO_COLLECTION}:")
                printer.error(err)
                exit(1)
        return client

    def add(self, record):
        if not self.dryRun:
            self.toImport.append(record)

    def run(self):
        if self.dryRun:
            printer.info("Importation dans Kinto évitée suite à l'emploi du drapeau --dry-run.")
            return
        with self.client.batch() as batch:
            for record in self.toImport:
                printer.info(f"Préparation de la déclaration id={record['id']}")
                batch.create_record(bucket=KINTO_BUCKET, collection=KINTO_COLLECTION, data=record)
        printer.success("Importation effectuée.")


def parse(args):
    validator = initValidator("json-schema.json")
    try:
        excelData = ExcelData(args.xls_path)
    except RuntimeError as err:
        printer.error(f"Erreur de traitement du fichier: {err}")
        exit(1)
    nb_rows = excelData.getNbRepondants()
    bar = Bar("Préparation des données", max=args.max if args.max is not None else nb_rows)
    kintoImporter = KintoImporter(validator.schema, truncate=args.init_collection, dryRun=args.dry_run)
    count_processed = 0
    count_imported = 0
    errors = []
    for index, key in enumerate(excelData.repondants):
        row = excelData.repondants[key]
        lineno = index + 1
        if args.max and count_processed >= args.max:
            break
        if args.siren and row["SIREN_ets"] != args.siren and row["SIREN_UES"] != args.siren:
            continue
        try:
            record = RowProcessor(row, validator, args.debug).run(validate=args.validate)
            kintoImporter.add(record)
            count_imported = count_imported + 1
            if args.show_json:
                printer.std(json.dumps(record, indent=args.indent))
        except KeyError as err:
            errors.append(f"Erreur ligne {lineno} - Champ introuvable {err}")
        except ValueError as err:
            errors.append(f"Erreur ligne {lineno} - Valeur erronée {err}")
        except RuntimeError as err:
            errors.append(f"Erreur ligne {lineno}: {err}")
        count_processed = count_processed + 1
        bar.next()
    bar.finish()
    if args.siren and count_processed == 0:
        printer.error("Aucune entrée trouvée pour le Siren " + args.siren)
    else:
        printer.std(f"{count_imported}/{count_processed} ligne(s) importée(s).")
        if len(errors) > 0:
            printer.warn(f"{len(errors)} erreur(s) rencontré(s)")
            for error in errors:
                printer.error(error)
    if args.save_as:
        with open(args.save_as, "w") as json_file:
            json_file.write(json.dumps(kintoImporter.toImport, indent=args.indent))
            printer.success("Enregistrements JSON exportés dans " + args.save_as)
    kintoImporter.run()


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
        sys.stdout.write(str + "\n")
        sys.stdout.flush()

    @staticmethod
    def error(str):
        sys.stderr.write(f"{printer.ERROR}✖  {str}{printer.ENDC}\n")
        sys.stderr.flush()

    @staticmethod
    def info(str):
        sys.stdout.write(f"{printer.INFO}🛈  {str}{printer.ENDC}\n")
        sys.stdout.flush()

    @staticmethod
    def success(str):
        sys.stdout.write(f"{printer.SUCCESS}✓  {str}{printer.ENDC}\n")
        sys.stdout.flush()

    @staticmethod
    def warn(str):
        sys.stdout.write(f"{printer.WARNING}⚠️  {str}{printer.ENDC}\n")
        sys.stdout.flush()


parser = argparse.ArgumentParser(description="Import des données Solen.")
parser.add_argument("xls_path", type=str, help="chemin vers l'export Excel Solen")
parser.add_argument("-d", "--debug", help="afficher les messages de debug", action="store_true", default=False)
parser.add_argument("-i", "--indent", type=int, help="niveau d'indentation JSON", default=None)
parser.add_argument("-m", "--max", type=int, help="nombre maximum de lignes à importer", default=None)
parser.add_argument("-j", "--show-json", help="afficher la sortie JSON", action="store_true", default=False)
parser.add_argument("-s", "--save-as", type=str, help="sauvegarder la sortie JSON dans un fichier")
parser.add_argument("-v", "--validate", help="valider les enregistrements JSON", action="store_true", default=False)
parser.add_argument("-r", "--dry-run", help="ne pas procéder à l'import dans Kinto", action="store_true", default=False)
parser.add_argument("--siren", type=str, help="importer le SIREN spécifié uniquement")
parser.add_argument(
    "-c", "--init-collection", help="Vider et recréer la collection Kinto avant import", action="store_true", default=False
)

try:
    parse(parser.parse_args())
except KeyboardInterrupt:
    printer.std("")
    printer.warn("Script d'import interrompu.")
    exit(1)
