import argparse
import io
import json
import pandas
from pprint import pprint


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
                f"UES {index_ues} > Nom Entreprise",
                f"/data/informationsEntreprise/entreprisesUES/{index_ues}/nom",
            ),
            (
                f"UES {index_ues} > SIREN",
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
            ("Date réponse", "/data/declaration/dateDeclaration"),
            ("e-mail_declarant", "/data/informationsDeclarant/email"),
            ("Nom", "/data/informationsDeclarant/nom"),
            ("Prénom", "/data/informationsDeclarant/prenom"),
            ("telephone", "/data/informationsDeclarant/tel"),
            ("Reg", "/data/informationsEntreprise/region"),
            ("dpt", "/data/informationsEntreprise/departement"),
            ("Adr ets", "/data/informationsEntreprise/adresse"),
            ("CP", "/data/informationsEntreprise/codePostal"),
            ("Commune", "/data/informationsEntreprise/commune"),
            ("annee_indicateurs", "/data/informations/anneeDeclaration"),
            ("structure", "/data/informationsEntreprise/structure"),
            ("tranche_effectif", "/data/informations/trancheEffectifs"),
            ("periode_ref", "/data/informations/finPeriodeReference"),
            ("date_debut_pr", "/data/informations/debutPeriodeReference"),
            ("nb_salaries", "/data/effectif/nombreSalariesTotal"),
            ("Nom Entreprise", "/data/informationsEntreprise/nomEntreprise"),
            ("SIREN", "/data/informationsEntreprise/siren"),
            ("Code NAF", "/data/informationsEntreprise/codeNaf"),
            ("nom_UES", "/data/informationsEntreprise/nomUES"),
            ("Nb_ets_UES", "/data/informationsEntreprise/nombreEntreprises"),
        ]
        + get_ues_cols(data)
        + [
            ("date_publ_niv", "/data/declaration/datePublication"),
            ("site_internet_publ", "/data/declaration/lienPublication"),
            ("modalite_calc_tab1_csp", "/data/indicateurUn/csp"),
            ("modalite_calc_tab1_coef", "/data/indicateurUn/coef"),
            ("modalite_calc_tab1_autre", "/data/indicateurUn/autre"),
            ("date_consult_CSE", "/data/declaration/dateConsultationCSE"),
            ("nb_coef_niv", "/data/indicateurUn/nombreCoefficients"),
            ("motif_non_calc_tab1", "/data/indicateurUn/nonCalculable"),
            ("precision_am_tab1", "/data/indicateurUn/motifNonCalculablePrecision"),
        ]
        + [
            (
                f"{CSP} > {tranche_age}",
                f"/data/indicateurUn/coefficient/{index_csp}/tranchesAges/{index_tranche_age}/ecartTauxRemuneration",
            )
            for (index_csp, CSP) in enumerate(["Ou", "Em", "TAM", "IC"])
            for (index_tranche_age, tranche_age) in enumerate(
                ["-30", "30-39", "40-49", "50+"]
            )
        ]
        + [
            (
                f"niv {index_coef} > {tranche_age}",
                f"/data/indicateurUn/coefficient/{index_coef}/tranchesAges/{index_tranche_age}/ecartTauxRemuneration",
            )
            for index_coef in range(get_num_coefficient(data))
            for (index_tranche_age, tranche_age) in enumerate(
                ["-30", "30-39", "40-49", "50+"]
            )
        ]
        + [
            ("resultat_tab1", "/data/indicateurUn/resultatFinal"),
            ("population_favorable_tab1", "/data/indicateurUn/sexeSurRepresente"),
            ("calculabilite_indic_tab2_sup250", "/data/indicateurDeux/nonCalculable"),
            ("motif_non_calc_tab2_sup250", "/data/indicateurDeux/motifNonCalculable"),
            (
                "precision_am_tab2_sup250",
                "/data/indicateurDeux/motifNonCalculablePrecision",
            ),
        ]
        + [
            (
                f"{CSP}_tab2_sup250",
                f"/data/indicateurDeux/tauxAugmentation/{index_csp}/ecartTauxAugmentation",
            )
            for (index_csp, CSP) in enumerate(["Ou", "Em", "TAM", "IC"])
        ]
        + [
            ("resultat_tab2_sup250", "/data/indicateurDeux/resultatFinal"),
            (
                "population_favorable_tab2_sup250",
                "/data/indicateurDeux/sexeSurRepresente",
            ),
            ("calculabilite_indic_tab3_sup250", "/data/indicateurTrois/nonCalculable"),
            ("motif_non_calc_tab3_sup250", "/data/indicateurTrois/motifNonCalculable"),
            (
                "precision_am_tab3_sup250",
                "/data/indicateurTrois/motifNonCalculablePrecision",
            ),
        ]
        + [
            (
                f"{CSP}_tab3_sup250",
                f"/data/indicateurTrois/tauxPromotion/{index_csp}/ecartTauxPromotion",
            )
            for (index_csp, CSP) in enumerate(["Ou", "Em", "TAM", "IC"])
        ]
        + [
            ("resultat_tab3_sup250", "/data/indicateurTrois/resultatFinal"),
            (
                "population_favorable_tab3_sup250",
                "/data/indicateurTrois/sexeSurRepresente",
            ),
            (
                "calculabilite_indic_tab2_50-250",
                "/data/indicateurDeuxTrois/nonCalculable",
            ),
            (
                "motif_non_calc_tab2_50-250",
                "/data/indicateurDeuxTrois/motifNonCalculable",
            ),
            (
                "precision_am_tab2_50-250",
                "/data/indicateurDeuxTrois/motifNonCalculablePrecision",
            ),
            (
                "resultat_pourcent_tab2_50-250",
                "/data/indicateurDeuxTrois/resultatFinalEcart",
            ),
            (
                "resultat_nb_sal_tab2_50-250",
                "/data/indicateurDeuxTrois/resultatFinalNombreSalaries",
            ),
            (
                "population_favorable_tab2_50-250",
                "/data/indicateurDeuxTrois/sexeSurRepresente",
            ),
            ("calculabilite_indic_tab4", "/data/indicateurQuatre/nonCalculable"),
            ("motif_non_calc_tab4", "/data/indicateurQuatre/motifNonCalculable"),
            ("precision_am_tab4", "/data/indicateurQuatre/motifNonCalculablePrecision"),
            ("resultat_tab4", "/data/indicateurQuatre/resultatFinal"),
            ("resultat_tab5", "/data/indicateurCinq/resultatFinal"),
            ("sexe_sur_represente_tab5", "/data/indicateurCinq/sexeSurRepresente"),
            ("Indicateur 1", "/data/indicateurUn/noteFinale"),
            ("Indicateur 2", "/data/indicateurDeux/noteFinale"),
            ("Indicateur 2et3", "/data/indicateurDeuxTrois/noteFinale"),
            ("Indicateur 2et3 PourCent", "/data/indicateurDeuxTrois/noteEcart"),
            ("Indicateur 2et3 ParSal", "/data/indicateurDeuxTrois/noteNombreSalaries"),
            ("Indicateur 3", "/data/indicateurTrois/noteFinale"),
            ("Indicateur 4", "/data/indicateurQuatre/noteFinale"),
            ("Indicateur 5", "/data/indicateurCinq/noteFinale"),
            ("Nombre total de points obtenus", "/data/declaration/totalPoint"),
            (
                "Nombre total de points pouvant être obtenus",
                "/data/declaration/totalPointCalculable",
            ),
            ("Résultat final sur 100 points", "/data/declaration/noteIndex"),
            ("mesures_correction", "/data/declaration/mesuresCorrection"),
        ]
    )
    print("List of interesting columns to export: (alias_name, json_name)")
    pprint(interesting_cols)
    headers = [header for header, _column in interesting_cols]
    columns = [column for _header, column in interesting_cols]
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
    print("Writing the XLSX to", args.xlsx_output)
    headers, columns = get_headers_columns(data)
    data[columns].to_excel(args.xlsx_output, index=False, header=headers)
    print("Done")
