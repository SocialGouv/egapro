import argparse
import io
import json
import os
import pandas
from pprint import pprint


DEBUG = os.environ.get("DEBUG", False)


def flatten_json(b, prefix="", delim="/", val=None):
    "See https://stackoverflow.com/a/57228641/330911"
    if val is None:
        val = {}
    if isinstance(b, dict):
        for j in b.keys():
            flatten_json(b[j], prefix + delim + j, delim, val)
    elif isinstance(b, list):
        get = b
        for j in range(len(get)):
            key = str(j)
            if isinstance(get[j], dict):
                if "key" in get[j]:
                    key = get[j]["key"]
            flatten_json(get[j], prefix + delim + key, delim, val)
    else:
        val[prefix] = b
    return val


def get_num_coefficient(data):
    """Return the max number of custom coefficient in the data."""
    return int(data["/data/indicateurUn/nombreCoefficients"].max())


def get_ues_cols(data):
    """Return a list of `nom` and `siren` cols for the max number of UES columns."""
    max_num_ues = int(data["/data/informationsEntreprise/nombreEntreprises"].max())
    # The entreprise that made the declaration is counted in the number of UES, but its nom/siren is given elsewhere.
    max_num_ues = max_num_ues - 1
    # This is a list of size max_num_ues of pairs of nom/siren cols.
    ues_cols_name_and_siren = [
        [
            (
                f"UES_{index_ues}_Nom_Entreprise",
                f"/data/informationsEntreprise/entreprisesUES/{index_ues}/nom",
            ),
            (
                f"UES_{index_ues}_Siren",
                f"/data/informationsEntreprise/entreprisesUES/{index_ues}/siren",
            ),
        ]
        for index_ues in range(max_num_ues)
    ]
    # This is a list of 2*max_num_ues of cols (ues 0 > nom, ues 0 > siren, ues 1 > nom, ues 1 > siren...)
    flattened_cols = [col for ues_cols in ues_cols_name_and_siren for col in ues_cols]
    return flattened_cols


def get_headers_columns(data):
    """Return a tuple of lists of (header_names, column_names) that we want in the export."""
    interesting_cols = (
        [
            ("source", "/data/source"),
            ("URL_declaration", "URL_declaration"),  # Built from /data/id, see below
            ("Date_reponse", "/data/declaration/dateDeclaration"),
            ("Email_declarant", "/data/informationsDeclarant/email"),
            ("Nom", "/data/informationsDeclarant/nom"),
            ("Prenom", "/data/informationsDeclarant/prenom"),
            ("Telephone", "/data/informationsDeclarant/tel"),
            ("Region", "/data/informationsEntreprise/region"),
            ("Departement", "/data/informationsEntreprise/departement"),
            ("Adresse", "/data/informationsEntreprise/adresse"),
            ("CP", "/data/informationsEntreprise/codePostal"),
            ("Commune", "/data/informationsEntreprise/commune"),
            ("Annee_indicateurs", "/data/informations/anneeDeclaration"),
            ("Structure", "/data/informationsEntreprise/structure"),
            ("Tranche_effectif", "/data/informations/trancheEffectifs"),
            ("Date_debut_periode", "/data/informations/debutPeriodeReference"),
            ("Date_fin_periode", "/data/informations/finPeriodeReference"),
            ("Nb_salaries", "/data/effectif/nombreSalariesTotal"),
            ("Nom_Entreprise", "/data/informationsEntreprise/nomEntreprise"),
            ("SIREN", "/data/informationsEntreprise/siren"),
            ("Code_NAF", "/data/informationsEntreprise/codeNaf"),
            ("Nom_UES", "/data/informationsEntreprise/nomUES"),
            ("Nb_ets_UES", "/data/informationsEntreprise/nombreEntreprises"),
        ]
        + get_ues_cols(data)
        + [
            ("Date_publication", "/data/declaration/datePublication"),
            ("Site_internet_publication", "/data/declaration/lienPublication"),
            ("Indic1_non_calculable", "/data/indicateurUn/nonCalculable"),
            ("Indic1_motif_non_calculable", "/data/indicateurUn/motifNonCalculable"),
            (
                "Indic1_precision_autre_motif",
                "/data/indicateurUn/motifNonCalculablePrecision",
            ),
            ("Indic1_modalite_calc_csp", "/data/indicateurUn/csp"),
            ("Indic1_modalite_calc_coef_branche", "/data/indicateurUn/coef"),
            ("Indic1_modalite_calc_coef_autre", "/data/indicateurUn/autre"),
            ("Indic1_date_consult_CSE", "/data/declaration/dateConsultationCSE"),
            ("Indic1_nb_coef_niv", "/data/indicateurUn/nombreCoefficients"),
        ]
        + [
            (
                f"Indic1_{CSP}_{tranche_age}",
                f"/data/indicateurUn/remunerationAnnuelle/{index_csp}/tranchesAges/{index_tranche_age}/ecartTauxRemuneration",
            )
            for (index_csp, CSP) in enumerate(["Ouv", "Emp", "TAM", "IC"])
            for (index_tranche_age, tranche_age) in enumerate(
                ["30", "30-39", "40-49", "50"]
            )
        ]
        + [
            (
                f"Indic1_Niv{index_coef}_{tranche_age}",
                f"/data/indicateurUn/coefficient/{index_coef}/tranchesAges/{index_tranche_age}/ecartTauxRemuneration",
            )
            for index_coef in range(get_num_coefficient(data))
            for (index_tranche_age, tranche_age) in enumerate(
                ["30", "30-39", "40-49", "50"]
            )
        ]
        + [
            ("Indic1_resultat", "/data/indicateurUn/resultatFinal"),
            ("Indic1_population_favorable", "/data/indicateurUn/sexeSurRepresente"),
            ("Indic2_non_calculable", "/data/indicateurDeux/nonCalculable"),
            ("Indic2_motif_non_calculable", "/data/indicateurDeux/motifNonCalculable"),
            (
                "Indic2_precision_autre_motif",
                "/data/indicateurDeux/motifNonCalculablePrecision",
            ),
        ]
        + [
            (
                f"Indic2_{CSP}",
                f"/data/indicateurDeux/tauxAugmentation/{index_csp}/ecartTauxAugmentation",
            )
            for (index_csp, CSP) in enumerate(["Ouv", "Emp", "TAM", "IC"])
        ]
        + [
            ("Indic2_resultat", "/data/indicateurDeux/resultatFinal"),
            ("Indic2_population_favorable", "/data/indicateurDeux/sexeSurRepresente"),
            ("Indic3_non_calculable", "/data/indicateurTrois/nonCalculable"),
            ("Indic3_motif_non_calculable", "/data/indicateurTrois/motifNonCalculable"),
            (
                "Indic3_precision_autre_motif",
                "/data/indicateurTrois/motifNonCalculablePrecision",
            ),
        ]
        + [
            (
                f"Indic3_{CSP}",
                f"/data/indicateurTrois/tauxPromotion/{index_csp}/ecartTauxPromotion",
            )
            for (index_csp, CSP) in enumerate(["Ouv", "Emp", "TAM", "IC"])
        ]
        + [
            ("Indic3_resultat", "/data/indicateurTrois/resultatFinal"),
            ("Indic3_population_favorable", "/data/indicateurTrois/sexeSurRepresente"),
            ("Indic2et3_non_calculable", "/data/indicateurDeuxTrois/nonCalculable"),
            (
                "Indic2et3_motif_non_calculable",
                "/data/indicateurDeuxTrois/motifNonCalculable",
            ),
            (
                "Indic2et3_precision_autre_motif",
                "/data/indicateurDeuxTrois/motifNonCalculablePrecision",
            ),
            (
                "Indic2et3_resultat_pourcent",
                "/data/indicateurDeuxTrois/resultatFinalEcart",
            ),
            (
                "Indic2et3_resultat_nb_sal",
                "/data/indicateurDeuxTrois/resultatFinalNombreSalaries",
            ),
            (
                "Indic2et3_population_favorable",
                "/data/indicateurDeuxTrois/sexeSurRepresente",
            ),
            ("Indic4_non_calculable", "/data/indicateurQuatre/nonCalculable"),
            (
                "Indic4_motif_non_calculable",
                "/data/indicateurQuatre/motifNonCalculable",
            ),
            (
                "Indic4_precision_autre_motif",
                "/data/indicateurQuatre/motifNonCalculablePrecision",
            ),
            ("Indic4_resultat", "/data/indicateurQuatre/resultatFinal"),
            ("Indic5_resultat", "/data/indicateurCinq/resultatFinal"),
            ("Indic5_sexe_sur_represente", "/data/indicateurCinq/sexeSurRepresente"),
            ("Indicateur_1", "/data/indicateurUn/noteFinale"),
            ("Indicateur_2", "/data/indicateurDeux/noteFinale"),
            ("Indicateur_2et3", "/data/indicateurDeuxTrois/noteFinale"),
            ("Indicateur_2et3_PourCent", "/data/indicateurDeuxTrois/noteEcart"),
            ("Indicateur_2et3_ParSal", "/data/indicateurDeuxTrois/noteNombreSalaries"),
            ("Indicateur_3", "/data/indicateurTrois/noteFinale"),
            ("Indicateur_4", "/data/indicateurQuatre/noteFinale"),
            ("Indicateur_5", "/data/indicateurCinq/noteFinale"),
            ("Nombre_total_points obtenus", "/data/declaration/totalPoint"),
            (
                "Nombre_total_points_pouvant_etre_obtenus",
                "/data/declaration/totalPointCalculable",
            ),
            ("Resultat_final_sur_100_points", "/data/declaration/noteIndex"),
            ("Mesures_correction", "/data/declaration/mesuresCorrection"),
        ]
    )
    if DEBUG:
        print("List of interesting columns to export: (alias_name, json_name)")
        pprint(interesting_cols)
    import_cols = [
        (header, column)
        for header, column in interesting_cols
        if column in data.columns
    ]
    if len(import_cols) != len(interesting_cols):
        print(
            "!!!!! those columns are 'interesting' but not found in the input file! !!!!!"
        )
        pprint(
            [
                column
                for _header, column in interesting_cols
                if column not in data.columns
            ]
        )
    headers = [header for header, _column in import_cols]
    columns = [column for _header, column in import_cols]
    return (headers, columns)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Conversion d'un fichier json en fichier XLSX"
    )
    parser.add_argument(
        "json_input", type=str, help="chemin vers le fichier source json"
    )
    parser.add_argument(
        "xlsx_output", type=str, help="chemin vers le fichier de sortie XLSX"
    )
    args = parser.parse_args()

    print("Reading JSON from", args.json_input)
    with open(args.json_input, "r") as input:
        parsed_json = json.load(input)
        if type(parsed_json) == dict:
            # It's an export from a HTTP request to Kinto, which returns a json object with a "data" attribute.
            parsed_json = parsed_json["data"]

    print("Flattening JSON")
    flattened_json = json.dumps([flatten_json(r) for r in parsed_json])
    print("Loading the JSON with pandas")
    data = pandas.read_json(io.StringIO(flattened_json))
    print("Adding a source of 'egapro' for records without a source")
    data["/data/source"] = data.apply(
        lambda d: (
            "egapro"
            if (d["/data/source"] != "solen-2019" and d["/data/source"] != "solen-2020")
            else d["/data/source"]
        ),
        axis=1,
    )
    print("Adding a 'URL de déclaration' column based on the ID and the source")
    data["URL_declaration"] = data["/id"]
    data["URL_declaration"] = data.apply(
        lambda d: (
            "'https://index-egapro.travail.gouv.fr/simulateur/" + d["/id"]
            if d["/data/source"] == "egapro"
            else "'https://solen1.enquetes.social.gouv.fr/cgi-bin/HE/P?P=" + d["/id"]
        ),
        axis=1,
    )
    headers, columns = get_headers_columns(data)
    print("Writing the XLSX to", args.xlsx_output)
    data[columns].to_excel(args.xlsx_output, index=False, header=headers)
    print("Done")
