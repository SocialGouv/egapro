"""Export data from DB."""

import csv
from pathlib import Path
import re
from typing import Union
from openpyxl import Workbook
from openpyxl.worksheet._write_only import WriteOnlyWorksheet
from openpyxl.worksheet.worksheet import Worksheet
from openpyxl.cell.cell import ILLEGAL_CHARACTERS_RE
from progressist import ProgressBar

import ujson as json

from egapro import constants, db, models, sql, utils

def truthy(val):
    return False if val is False else True


async def dump(path: Path):
    """Export des données Egapro.

    :path:          chemin vers le fichier d'export
    """

    records = await db.declaration.completed()
    print("Number of records", len(records))
    with path.open("w") as f:
        json.dump([r["data"] for r in records], f, ensure_ascii=False)


async def public_data(path: Path):
    """Export des données Egapro publiques au format CSV.

    :path:          chemin vers le fichier d'export
    """

    records = await db.declaration.fetch(sql.public_declarations)
    writer = csv.writer(path, delimiter=";")
    writer.writerow(
        [
            "Année",
            "Structure",
            "Tranche d'effectifs",
            "SIREN",
            "Raison Sociale",
            "Nom UES",
            "Entreprises UES (SIREN)",
            "Région",
            "Département",
            "Pays",
            "Code NAF",
            "Note Ecart rémunération",
            "Note Ecart taux d'augmentation",
            "Note Ecart taux de promotion",
            "Note Retour congé maternité",
            "Note Hautes rémunérations",
            "Note Index",
        ]
    )
    rows = []
    for record in records:
        data: models.Data = record.data
        ues = ",".join(
            [
                f"{company['raison_sociale']} ({company['siren']})"
                for company in data.path("entreprise.ues.entreprises") or []
            ]
        )
        rows.append(
            [
                data.year,
                data.structure,
                data.path("entreprise.effectif.tranche"),
                data.siren,
                data.company,
                data.ues,
                ues,
                constants.REGIONS.get(data.region),
                constants.DEPARTEMENTS.get(data.departement),
                constants.PAYS_ISO_TO_LIB.get(
                    data.path("entreprise.code_pays"), "FRANCE"
                ),
                data.naf,
                data.path("indicateurs.rémunérations.note") or "NC",
                data.path("indicateurs.augmentations.note") or "NC",
                data.path("indicateurs.promotions.note") or "NC",
                data.path("indicateurs.congés_maternité.note") or "NC",
                data.path("indicateurs.hautes_rémunérations.note") or "NC",
                data.grade or "NC",
            ]
        )
    writer.writerows(rows)


async def full(dest):
    records = await db.declaration.completed()
    for record in records:
        dest.write(utils.json_dumps(record["data"]) + "\n")


async def indexes(path: Path):
    writer = csv.writer(path, delimiter=";")
    writer.writerow(
        [
            "siren",
            "year",
            "index",
        ]
    )
    rows = []
    records = await db.declaration.completed()
    for record in records:
        data = record.data
        rows.append(
            [
                data.siren,
                data.year,
                data.grade,
            ]
        )
    writer.writerows(rows)

WHITE_SPACES = re.compile(r"\s+")
def clean_cell(value):
    if isinstance(value, str):
        value = WHITE_SPACES.sub(" ", ILLEGAL_CHARACTERS_RE.sub("", value).strip())
    return value

tranche_effectif_map = {
    "50:250": "50 à 250",
    "251:999": "251 à 999",
    "1000:": "1000 et plus",
    "1000:00:00": "1000 et plus", # ?
}
async def public_data_as_xlsx(debug=False):
    """Export des données Egapro publiques au format XSLX.

    :path:          chemin vers le fichier d'export
    """

    print("Reading from DB")
    records = await db.declaration.fetch(sql.public_declarations)
    workbook = Workbook(write_only=not debug)
    sheet: Union[WriteOnlyWorksheet, Worksheet] = workbook.create_sheet()
    sheet.title = "Données publiques Index Egapro"
    workbook.active = sheet
    sheet.append(
        [
            "Année",
            "Structure",
            "Tranche d'effectifs",
            "SIREN",
            "Raison Sociale",
            "Nom UES",
            "Entreprises UES (SIREN)",
            "Région",
            "Département",
            "Pays",
            "Code NAF",
            "Note Ecart rémunération",
            "Note Ecart taux d'augmentation (hors promotion)",
            "Note Ecart taux de promotion",
            "Note Ecart taux d'augmentation",
            "Note Retour congé maternité",
            "Note Hautes rémunérations",
            "Note Index",
        ]
    )

    bar = ProgressBar(prefix="Computing", total=len(records))
    for record in bar.iter(records):
        data: models.Data = record.data
        if not data:
            continue
        ues = ",".join(
            [
                f"{company['raison_sociale']} ({company['siren']})"
                for company in data.path("entreprise.ues.entreprises") or []
            ]
        )
        effectif = data.path("entreprise.effectif.tranche")
        lt_250 = effectif == "50:250"
        sheet.append(
            [clean_cell(c) for c in
                [
                    data.year,
                    data.structure,
                    tranche_effectif_map[effectif],
                    data.siren,
                    data.company,
                    data.ues,
                    ues,
                    constants.REGIONS.get(data.region),
                    constants.DEPARTEMENTS.get(data.departement),
                    constants.PAYS_ISO_TO_LIB.get(
                        data.path("entreprise.code_pays"), "FRANCE"
                    ),
                    data.naf
                ] + get_note_lines(data)
            ]
        )
    return workbook

def value_or_NC(value):
    return "NC" if isinstance(value, type(None)) else value

def get_note_lines(data: models.Data):
    lt_250 = data.path("entreprise.effectif.tranche") == "50:250"
    periode_suffisante = truthy(data.path("déclaration.période_suffisante"))
    if periode_suffisante:
        return [
            value_or_NC(data.path("indicateurs.rémunérations.note")),
            "" if lt_250 else value_or_NC(data.path("indicateurs.augmentations.note")),
            "" if lt_250 else value_or_NC(data.path("indicateurs.promotions.note")),
            "" if not lt_250 else value_or_NC(data.path("indicateurs.augmentations_et_promotions.note")),
            value_or_NC(data.path("indicateurs.congés_maternité.note")),
            data.path("indicateurs.hautes_rémunérations.note"),
            data.grade
        ]
    else:
        return [
            "NC",
            "" if lt_250 else "NC",
            "" if lt_250 else "NC",
            "" if not lt_250 else "NC",
            "NC",
            "NC",
            "NC"
        ]
