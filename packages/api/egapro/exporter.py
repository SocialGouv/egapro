"""Export data from DB."""

import csv
from pathlib import Path

import ujson as json

from egapro import constants, db, sql, utils


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
            "Raison Sociale",
            "SIREN",
            "Année",
            "Note",
            "Structure",
            "Nom UES",
            "Entreprises UES (SIREN)",
            "Région",
            "Département",
            "Pays",
        ]
    )
    rows = []
    for record in records:
        data = record.data
        ues = ",".join(
            [
                f"{company['raison_sociale']} ({company['siren']})"
                for company in data.path("entreprise.ues.entreprises") or []
            ]
        )
        rows.append(
            [
                data.company,
                data.siren,
                data.year,
                data.grade,
                data.structure,
                data.ues,
                ues,
                constants.REGIONS.get(data.region),
                constants.DEPARTEMENTS.get(data.departement),
                constants.PAYS_ISO_TO_LIB.get(
                    data.path("entreprise.code_pays"), "FRANCE"
                ),
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
