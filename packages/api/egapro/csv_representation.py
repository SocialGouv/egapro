"""DGT specific utils"""

import re
from datetime import date

from naf import DB as NAF
from openpyxl import Workbook
from openpyxl.cell.cell import ILLEGAL_CHARACTERS_RE
from progressist import ProgressBar

from egapro import config, constants, db
from egapro.utils import flatten, remove_one_year


async def get_headers_columns():
    """Return a tuple of lists of (header_names, column_names) that we want in the export."""
    header_labels = (
        [
            ("Annee_ecarts", "déclaration.année_indicateurs"),
            ("SIREN", "entreprise.siren"),
            ("Nom_Entreprise", "entreprise.raison_sociale"),
            ("Region", "entreprise.région", constants.REGIONS.get),
            ("Departement", "entreprise.département", constants.DEPARTEMENTS.get),
            ("Pays", "entreprise.code_pays", constants.PAYS_ISO_TO_LIB.get),
            ("Code_NAF", "entreprise.code_naf", code_naf),
            ("Cadres_pourcentage_femmes", "indicateurs.représentation_équilibrée.pct_f_cadres"),
            ("Cadres_pourcentage_hommes", "indicateurs.représentation_équilibrée.pct_h_cadres"),
            ("Membres_pourcentage_femmes", "indicateurs.représentation_équilibrée.pct_f_membres"),
            ("Membres_pourcentage_hommes", "indicateurs.représentation_équilibrée.pct_h_membres")
        ]
    )
    headers = []
    columns = []
    for header, column, *fmt in header_labels:
        headers.append(header)
        columns.append((column, fmt[0] if fmt else lambda x: x))
    return (headers, columns)


WHITE_SPACES = re.compile(r"\s+")

def code_naf(code):
    return None if not code else (code if code not in NAF else f"{code} - {NAF[code]}")

def clean_cell(value):
    if isinstance(value, str):
        value = WHITE_SPACES.sub(" ", ILLEGAL_CHARACTERS_RE.sub("", value).strip())
    return value


async def as_xlsx(max_rows=None, debug=False):
    """Export des données au format souhaité par la DGT pour la représentation équilibrée.

    :max_rows:          Max number of rows to process.
    :debug:             Turn on debug to be able to read the generated Workbook
    """
    print("Reading from DB")
    records = await db.representation_equilibree.all()
    print("Flattening JSON")
    if max_rows:
        records = records[:max_rows]
    wb = Workbook(write_only=not debug)
    ws = wb.create_sheet()
    ws.title = "BDD REPONDANTS"
    wb.active = ws

    headers, columns = await get_headers_columns()
    ws.append(headers)
    bar = ProgressBar(prefix="Computing", total=len(records))
    for record in bar.iter(records):
        data = record.data
        if not data:
            continue
        data = prepare_record(data)
        data["modified_at"] = record["modified_at"]
        ws.append([clean_cell(fmt(data.get(c))) for c, fmt in columns])
    return wb

def prepare_record(data):
    # Before flattening.
    data["URL_declaration"] = f"'{config.DOMAIN}{data.uri}"
    prepare_declaration(data["déclaration"])

    if "indicateurs" in data:
        prepare_indicateurs(data["indicateurs"]["représentation_équilibrée"])
    return flatten(data, flatten_lists=True)


def prepare_declaration(data):
    fin_periode_reference = data.get("fin_période_référence")
    if fin_periode_reference:
        data["début_période_référence"] = remove_one_year(
            date.fromisoformat(fin_periode_reference)
        )
        data["fin_période_référence"] = date.fromisoformat(fin_periode_reference)

def translate_motif_enum(str):
    enum = {
        "aucun_cadre_dirigeant": "Aucun cadre dirigeant",
        "un_seul_cadre_dirigeant": "Un seul cadre dirigeant",
        "aucune_instance_dirigeante": "Aucune instance dirigeante"
    }
    return enum[str] if str in enum else None

def prepare_indicateurs(data):
    pct_f_cadres, pct_h_cadres = data.get("pourcentage_femmes_cadres", "NC"), data.get("pourcentage_hommes_cadres", "NC")
    pct_f_membres, pct_h_membres = data.get("pourcentage_femmes_membres", "NC"), data.get("pourcentage_hommes_membres", "NC")
    motif_nc_cadres, motif_nc_membres = data.get("motif_non_calculabilité_cadres"), data.get("motif_non_calculabilité_membres")
    motif_nc_cadres = translate_motif_enum(motif_nc_cadres)
    motif_nc_membres = translate_motif_enum(motif_nc_membres)

    data["pct_f_cadres"], data["pct_h_cadres"] = pct_f_cadres, pct_h_cadres
    data["pct_f_membres"], data["pct_h_membres"] = pct_f_membres, pct_h_membres
    data["cadres_calculable"] = "Non" if motif_nc_cadres else "Oui"
    data["membres_calculable"] = "Non" if motif_nc_membres else "Oui"
    data["motif_nc_cadres"] = motif_nc_cadres
    data["motif_nc_membres"] = motif_nc_membres
