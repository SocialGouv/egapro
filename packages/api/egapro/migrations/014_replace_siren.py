import progressist


async def main(db, logger):

    data = (
        (2019, "090000258", "333800407"),
        (2020, "090000258", "333800407"),
        (2018, "309471985", "390471985"),
        (2020, "410064000", "410064158"),
        (2019, "414575670", "414757567"),
        (2020, "564900041", "751805649"),
        (2019, "570002311", "779934280"),
        (2019, "599300522", "393525993"),
        (2019, "620020529", "784061236"),
        (2020, "620020529", "784061236"),
        (2019, "680803053", "690802053"),
        (2019, "757509500", "075750950"),
        (2019, "760000240", "781075734"),
        (2018, "897856597", "807856596"),
        (2019, "897856597", "807856596"),
    )
    # Exists but it's only a draft.
    await db.declaration.execute(
        "DELETE FROM declaration WHERE year=2019 AND siren='414757567'"
    )
    bar = progressist.ProgressBar(prefix="Migrating…", total=len(data))
    for year, old, new in bar.iter(data):
        await db.declaration.execute(
            "UPDATE declaration "
            "SET siren=$3::text, "
            "data=jsonb_set(data, '{entreprise,siren}', to_jsonb($3)) "
            "WHERE year=$1 AND siren=$2",
            year,
            old,
            new,
        )
