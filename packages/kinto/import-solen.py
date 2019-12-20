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


def parse(csv_path):
    # TODO:
    # --indent option
    # --max option
    result = []
    with open(csv_path) as csv_file:
        reader = csv.DictReader(csv_file)
        count = 0
        for row in reader:
            if count >= 2:
                break
            result.append(processRow(row))
            count = count + 1
        # pp.pprint(result)
        return json.dumps(result, indent=2)


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


def importInformationsDeclarant(jsonRecord, row):
    # Identification du déclarant pour tout contact ultérieur
    toPath(jsonRecord, "informationsDeclarant.nom", row["Nom"])
    toPath(jsonRecord, "informationsDeclarant.prenom", row["Prénom"])
    toPath(jsonRecord, "informationsDeclarant.tel", row["telephone"])
    toPath(jsonRecord, "informationsDeclarant.region", row["Reg"])
    toPath(jsonRecord, "informationsDeclarant.departement", row["dpt"])
    toPath(jsonRecord, "informationsDeclarant.adresse", row["Adr ets"])
    toPath(jsonRecord, "informationsDeclarant.codePosal", row["CP"])
    toPath(jsonRecord, "informationsDeclarant.commune", row["Commune"])


def importPeriodeDeReference(jsonRecord, row):
    # Année et périmètre retenus pour le calcul et la publication des indicateurs
    annee_indicateur = int(row["annee_indicateurs"])
    toPath(jsonRecord, "informationsComplementaires.anneeDeclaration", annee_indicateur)
    toPath(jsonRecord, "informationsComplementaires.structure", row["structure"])
    toPath(jsonRecord, "informations.trancheEffectifs", row["tranche_effectif"])
    date_debut_pr = row["date_debut_pr > Valeur date"]
    if row["periode_ref"] == "ac":
        # année civile: 31 décembre de l'année précédent "annee_indicateurs"
        debutPeriodeReference = "01/01/" + str(annee_indicateur)
        finPeriodeReference = "31/12/" + str(annee_indicateur)
    elif date_debut_pr != "-":
        # autre période: rajouter un an à "date_debut_pr"
        debutPeriodeReference = date_debut_pr
        finPeriodeReference = (datetime.strptime(date_debut_pr, "%d/%m/%Y") + timedelta(days=365)).strftime("%d/%m/%Y")
    else:
        # autre période de référence sans début spécifié: erreur
        raise RuntimeError("Données de période de référence incohérentes")
    toPath(jsonRecord, "informations.debutPeriodeReference", debutPeriodeReference)
    toPath(jsonRecord, "informations.finPeriodeReference", finPeriodeReference)
    toPath(jsonRecord, "effectifs.nombreSalariesTotal", int(row["nb_salaries > Valeur numérique"]))


def processRow(row):
    jsonRecord = {}
    # "Date réponse > Valeur date": "data.dateReponse",
    # "URL d'impression du répondant": "data.url",
    # "e-mail_declarant": ("data.", str),
    # "Confirmation du mail": ("data.", str),

    importInformationsDeclarant(jsonRecord, row)
    importPeriodeDeReference(jsonRecord, row)

    # "RS_ets": ("data.informationsEntreprise.nomEntreprise", str),
    # "SIREN_ets": ("data.informationsEntreprise.siren", str),
    # "Code NAF": ("data.informationsEntreprise.codeNaf", str),
    # "nom_UES": ("data.informationsEntreprise.nomUES", str),
    # "nom_ets_UES": ("data.informationsEntreprise.nomsEntreprisesUES", str),
    # "SIREN_UES": ("data.informationsEntreprise.sirenUES", str),
    # "Code NAF de cette entreprise": ("data.informationsEntreprises.codeNAF", str),
    # "Nb_ets_UES": ("data.informationsEntreprises.nombresEntreprises", str),
    # "date_publ_niv > Valeur date": ("data.declaration.datePublication", str),
    # "site_internet_publ": ("data.declaration.lienPublication", str),

    # TODO:
    # indicateur1.csp | indicateur1.coefficients | indicateur1.autre
    # "modalite_calc_tab1": ("data.", str),
    # "date_consult_CSE > Valeur date": ("data.indicateur1.dateConsultationCSE", str),
    # "nb_coef_niv": ("data.indicateur1.nombreCoefficients", str),
    # "motif_non_calc_tab1": ("data.indicateur1.nonCalculable", str),
    # "precision_am_tab1": ("data.indicateur1.motifNonCalculablePrecision", str),

    # TODO: we need to spread values over indicateur1.remunerationAnnuelle.0.(0|1|2|3)
    # "Ou": ("data.indicateur1.remunerationAnnuelle[0].(0|1|2|3)", str),
    # "Em": ("data.", str),
    # "TAM": ("data.", str),
    # "IC": ("data.", str),
    # "niv01": ("data.", str),
    # "niv02": ("data.", str),
    # "niv03": ("data.", str),
    # "niv04": ("data.", str),
    # "niv05": ("data.", str),
    # "niv06": ("data.", str),
    # "niv07": ("data.", str),
    # "niv08": ("data.", str),
    # "niv09": ("data.", str),
    # "niv10": ("data.", str),
    # "niv11": ("data.", str),
    # "niv12": ("data.", str),
    # "niv13": ("data.", str),
    # "niv14": ("data.", str),
    # "niv15": ("data.", str),
    # "niv16": ("data.", str),
    # "niv17": ("data.", str),
    # "niv18": ("data.", str),
    # "niv19": ("data.", str),
    # "niv20": ("data.", str),
    # "niv21": ("data.", str),
    # "niv22": ("data.", str),
    # "niv23": ("data.", str),
    # "niv24": ("data.", str),
    # "niv25": ("data.", str),
    # "niv26": ("data.", str),
    # "niv27": ("data.", str),
    # "niv28": ("data.", str),
    # "niv29": ("data.", str),
    # "niv30": ("data.", str),
    # "niv31": ("data.", str),
    # "niv32": ("data.", str),
    # "niv33": ("data.", str),
    # "niv34": ("data.", str),
    # "niv35": ("data.", str),
    # "niv36": ("data.", str),
    # "niv37": ("data.", str),
    # "niv38": ("data.", str),
    # "niv39": ("data.", str),
    # "niv40": ("data.", str),
    # "niv41": ("data.", str),
    # "niv42": ("data.", str),
    # "niv43": ("data.", str),
    # "niv44": ("data.", str),
    # "niv45": ("data.", str),
    # "niv46": ("data.", str),
    # "niv47": ("data.", str),
    # "niv48": ("data.", str),
    # "niv49": ("data.", str),
    # "niv50": ("data.", str),
    # "resultat_tab1": ("data.", str),
    # "population_favorable_tab1": ("data.", str),
    # "nb_pt_obtenu_tab1": ("data.", str),
    # "calculabilite_indic_tab2_sup250": ("data.", str),
    # "motif_non_calc_tab2_sup250": ("data.", str),
    # "precision_am_tab2_sup250": ("data.", str),
    # "Ou_tab2_sup250": ("data.", str),
    # "Em_tab2_sup250": ("data.", str),
    # "TAM_tab2_sup250": ("data.", str),
    # "IC_tab2_sup250": ("data.", str),
    # "resultat_tab2_sup250": ("data.", str),
    # "population_favorable_tab2_sup250": ("data.", str),
    # "nb_pt_obtenu_tab2_sup250": ("data.", str),
    # "prise_compte_mc_tab2_sup250": ("data.", str),
    # "calculabilite_indic_tab3_sup250": ("data.", str),
    # "motif_non_calc_tab3_sup250": ("data.", str),
    # "precision_am_tab3_sup250": ("data.", str),
    # "Ou_tab3_sup250": ("data.", str),
    # "Em_tab3_sup250": ("data.", str),
    # "TAM_tab3_sup250": ("data.", str),
    # "IC_tab3_sup250": ("data.", str),
    # "resultat_tab3_sup250": ("data.", str),
    # "population_favorable_tab3_sup250": ("data.", str),
    # "nb_pt_obtenu_tab3_sup250": ("data.", str),
    # "prise_compte_mc_tab3_sup250": ("data.", str),
    # "calculabilite_indic_tab4_sup250": ("data.", str),
    # "motif_non_calc_tab4_sup250": ("data.", str),
    # "precision_am_tab4_sup250": ("data.", str),
    # "resultat_tab4_sup250": ("data.", str),
    # "nb_pt_obtenu_tab4_sup250": ("data.", str),
    # "calculabilite_indic_tab2_50-250": ("data.", str),
    # "motif_non_calc_tab2_50-250": ("data.", str),
    # "precision_am_tab2_50-250": ("data.", str),
    # "resultat_pourcent_tab2_50-250": ("data.", str),
    # "resultat_nb_sal_tab2_50-250": ("data.", str),
    # "population_favorable_tab2_50-250": ("data.", str),
    # "nb_pt_obtenu_tab2_50-250": ("data.", str),
    # "prise_compte_mc_tab2_50-250": ("data.", str),
    # "calculabilite_indic_tab4_50-250": ("data.", str),
    # "motif_non_calc_tab4_50-250": ("data.", str),
    # "precision_am_tab4_50-250": ("data.", str),
    # "resultat_tab4_50-250": ("data.", str),
    # "nb_pt_obtenu_tab4_50-250": ("data.", str),
    # "resultat_tab5": ("data.", str),
    # "sexe_sur_represente_tab5": ("data.", str),
    # "nb_pt_obtenu_tab5": ("data.", str),
    # "resultat_global_NbPtsMax": ("data.", str),
    # "Indicateur 1": ("data.", str),
    # "Indicateur 2": ("data.", str),
    # "Indicateur 2 PourCent": ("data.", str),
    # "Indicateur 2 ParSal": ("data.", str),
    # "Indicateur 3": ("data.", str),
    # "Indicateur 4": ("data.", str),
    # "Indicateur 5": ("data.", str),
    # "Nombre total de points obtenus": ("data.", str),
    # "Nombre total de points pouvant être obtenus": ("data.", str),
    # "Résultat final sur 100 points": ("data.", str),
    # "mesures_correction": ("data.", str),

    return {"data": jsonRecord}


parser = argparse.ArgumentParser(description="Import Solen data into Kinto.")
parser.add_argument("csv_path", type=str, help="path to Solen CSV file")
args = parser.parse_args()

print(parse(args.csv_path))
