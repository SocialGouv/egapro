"""Export data from DB."""

import csv
from pathlib import Path

import ujson as json

from egapro import constants, db, models, sql, utils


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
                data.get("entreprise.effectif.tranche"),
                data.siren,
                data.company_name,
                data.ues_name,
                ues,
                constants.REGIONS.get(data.region),
                constants.DEPARTEMENTS.get(data.departement),
                constants.PAYS_ISO_TO_LIB.get(
                    data.path("entreprise.code_pays"), "FRANCE"
                ),
                data.naf,
                data.get("indicateurs.rémunérations.note", "NC"),
                data.get("indicateurs.augmentations.note", "NC"),
                data.get("indicateurs.promotions.note", "NC"),
                data.get("indicateurs.augmentations_et_promotions.note", "NC"),
                data.get("indicateurs.congés_maternité.note", "NC"),
                data.get("indicateurs.hautes_rémunérations.note", "NC"),
                data.note or "NC",
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
