"""Ecarts must be in 0 to 100 scale, insteaf of 0 to 1 which is what was sent by the simulateur."""

import progressist


async def main(db, logger):

    records = await db.declaration.fetch(
        "SELECT * FROM declaration WHERE data->>'source'='simulateur' "
    )
    bar = progressist.ProgressBar(prefix="Migrating…", total=len(records))
    for record in bar.iter(records):
        data = record.data.raw
        siren = record.data.siren
        year = record.data.year
        save = False
        try:
            categories = data["indicateurs"]["augmentations"]["catégories"]
        except KeyError:
            pass
        else:
            for idx, value in enumerate(categories):
                if value:
                    categories[idx] = value * 100
                    save = True
        try:
            categories = data["indicateurs"]["promotions"]["catégories"]
        except KeyError:
            pass
        else:
            for idx, value in enumerate(categories):
                if value:
                    categories[idx] = value * 100
                    save = True
        if save:
            await db.declaration.put(
                siren,
                year,
                owner=record["owner"],
                data=data,
                modified_at=record["modified_at"],
            )
