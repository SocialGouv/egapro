"""Declarations made from the simulateur since 2012-12-24 have values from 0 to 1
instead of to 100"""


async def main(db, logger):
    records = await db.declaration.fetch(
        "SELECT * FROM declaration WHERE data->>'source'='simulateur' "
        "AND modified_at>='2020-12-25' AND declared_at IS NOT NULL"
    )
    for record in records:
        data = record.data.raw
        siren = record.data.siren
        year = record.data.year
        logger.info(f"Migrating {siren}/{year}")
        categories = record.data.path("indicateurs.rémunérations.catégories") or []
        for category in categories:
            tranches = category.get("tranches")
            for name, value in tranches.items():
                tranches[name] = value * 100
        await db.declaration.put(
            siren,
            year,
            owner=record["owner"],
            data=data,
            modified_at=record["modified_at"],
        )
