"""Ecarts must be in 0 to 100 scale, insteaf of 0 to 1 which is what was sent by the simulateur."""

import progressist


async def main(db, logger):

    records = await db.declaration.fetch(
        "SELECT data, owner, modified_at FROM declaration "
        "WHERE declared_at IS NOT NULL "
        "AND data->'entreprise'->'adresse' IS NULL"
    )
    bar = progressist.ProgressBar(prefix="Migrating…", total=len(records))
    skipped = 0
    for record in bar.iter(records):
        data = record.data.raw
        siren = record.data.siren
        year = record.data.year
        try:
            following = await db.declaration.get(siren, year + 1)
        except db.NoData:
            skipped += 1
            continue
        adresse = following.data.path("entreprise.adresse")
        commune = following.data.path("entreprise.commune")
        code_postal = following.data.path("entreprise.code_postal")
        data["entreprise"]["adresse"] = adresse
        data["entreprise"]["commune"] = commune
        data["entreprise"]["code_postal"] = code_postal
        await db.declaration.put(
            siren,
            year,
            owner=record["owner"],
            data=data,
            modified_at=record["modified_at"],
        )
    print(f"Skipped: {skipped}")
