"""DGT specific utils"""

import re
from datetime import date

import arrow
from naf import DB as NAF
from openpyxl import Workbook
from openpyxl.cell.cell import ILLEGAL_CHARACTERS_RE
from progressist import ProgressBar

from egapro import config, constants, db, models
from egapro.schema import SCHEMA
from egapro.utils import flatten, remove_one_year


def isodatetime(val):
    if not val:
        return None
    # Excel doesn't know nothing about timezone, so let's transpose.
    when = arrow.get(val).to("Europe/Paris").naive
    return when


def isodate(val):
    if not val:
        return None
    return date.fromisoformat(val)


def code_naf(code):
    if not code:
        return None
    return f"{code} - {NAF[code]}"


async def get_headers_columns():
    """Return a tuple of lists of (header_names, column_names) that we want in the export."""
    header_labels = (
        [
            ("Date_declaration", "déclaration.date", isodatetime),
            ("Date_modification", "modified_at", isodatetime),
            ("Email_declarant", "déclarant.email"),
            ("Nom", "déclarant.nom"),
            ("Prenom", "déclarant.prénom"),
            ("Telephone", "déclarant.téléphone"),
            ("Region", "entreprise.région", constants.REGIONS.get),
            ("Departement", "entreprise.département", constants.DEPARTEMENTS.get),
            ("Adresse", "entreprise.adresse"),
            ("CP", "entreprise.code_postal"),
            ("Commune", "entreprise.commune"),
            ("Pays", "entreprise.code_pays", constants.PAYS_ISO_TO_LIB.get),
            ("Annee_ecarts", "déclaration.année_indicateurs"),
            ("Date_debut_periode", "déclaration.début_période_référence"),
            ("Date_fin_periode", "déclaration.fin_période_référence"),
            ("Nom_Entreprise", "entreprise.raison_sociale"),
            ("SIREN", "entreprise.siren"),
            ("Code_NAF", "entreprise.code_naf", code_naf),
            ("Date_publication", "déclaration.publication.date", isodate),
            ("Site_internet_publication", "déclaration.publication.url"),
            ("Modalites_publication", "déclaration.publication.modalités"),
            # TODO ADD REPARTITION INDICATORS AND REMOVE THOSE BELOW
        ]
    )
    headers = []
    columns = []
    for header, column, *fmt in header_labels:
        headers.append(header)
        columns.append((column, fmt[0] if fmt else lambda x: x))
    return (headers, columns)


WHITE_SPACES = re.compile(r"\s+")


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
    records = await db.repartition.all()
    print("Flattening JSON")
    if max_rows:
        records = records[:max_rows]
    wb = Workbook(write_only=not debug)
    ws = wb.create_sheet()
    ws.title = "BDD REPRESENTATION"
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
    effectif = data["entreprise"]["effectif"]["tranche"]
    prepare_declaration(data["déclaration"])

    if "indicateurs" in data:
        pass
        # TODO fonctions ici une fois faites
        #prepare_remunerations(data["indicateurs"]["rémunérations"])
        #prepare_conges_maternite(data["indicateurs"]["congés_maternité"])
    return flatten(data, flatten_lists=True)


def prepare_declaration(data):
    fin_periode_reference = data.get("fin_période_référence")
    if fin_periode_reference:
        data["début_période_référence"] = remove_one_year(
            date.fromisoformat(fin_periode_reference)
        )
        data["fin_période_référence"] = date.fromisoformat(fin_periode_reference)

# TODO PREPARE INDICATEURS REPARTITION HERE
# def prepare_conges_maternite(data):
#     calculable = not data.get("non_calculable")
#     data["non_calculable_bool"] = calculable
#     if not calculable:
#         data["note"] = "nc"
