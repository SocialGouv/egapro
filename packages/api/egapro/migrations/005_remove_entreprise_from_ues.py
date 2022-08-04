import progressist


async def main(db, logger):
    records = await db.declaration.fetch(
        "SELECT modified_at,owner,data FROM declaration WHERE jsonb_array_length(data->'entreprise'->'ues'->'entreprises')>0"
    )
    bar = progressist.ProgressBar(prefix="Migrating…", total=len(records))
    for record in bar.iter(records):
        data = record.data.raw
        siren = record.data.siren
        year = record.data.year
        entreprises = data["entreprise"]["ues"]["entreprises"]
        before = len(entreprises)
        entreprises = [e for e in entreprises if e["siren"] != siren]
        if len(entreprises) != before:
            data["entreprise"]["ues"]["entreprises"] = entreprises
            await db.declaration.put(
                siren,
                year,
                owner=record["owner"],
                data=data,
                modified_at=record["modified_at"],
            )
