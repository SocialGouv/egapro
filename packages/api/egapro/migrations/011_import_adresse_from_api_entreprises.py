import asyncio

import progressist

from egapro import helpers, schema


async def main(db, logger):

    records = await db.declaration.fetch(
        "SELECT data, owner, modified_at FROM declaration "
        "WHERE declared_at IS NOT NULL "
        "AND data->'entreprise'->'adresse' IS NULL"
    )
    bar = progressist.ProgressBar(prefix="Migrating…", total=len(records))
    skipped = []
    for record in bar.iter(records):
        data = record.data.raw
        siren = record.data.siren
        year = record.data.year
        extra = await helpers.load_from_api_entreprises(siren)
        try:
            data["entreprise"]["adresse"] = extra["adresse"]
            data["entreprise"]["commune"] = extra["commune"]
            data["entreprise"]["département"] = extra["département"]
            data["entreprise"]["région"] = extra["région"]
            data["entreprise"]["code_postal"] = extra["code_postal"]
            schema.validate(data)
        except (ValueError, KeyError) as err:
            skipped.append((siren, year, err))
            continue
        await db.declaration.put(
            siren,
            year,
            owner=record["owner"],
            data=data,
            modified_at=record["modified_at"],
        )
        await asyncio.sleep(0.5)  # Do not harm API Entrepries.
    print("Skipped:", skipped)
