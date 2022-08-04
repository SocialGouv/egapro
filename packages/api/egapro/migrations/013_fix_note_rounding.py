import progressist

from egapro import helpers


async def main(db, logger):

    SIREN = (
        "433108404",
        "820651610",
        "522305473",
        "403039977",
        "438027435",
        "308907971",
        "481301737",
        "314684960",
        "310497482",
        "387493513",
        "642040000",
        "310941125",
        "783883788",
        "334963105",
        "393579073",
        "808559546",
        "487884173",
        "425520376",
        "532504412",
        "327852596",
        "790696009",
        "395067184",
        "429853351",
        "314025701",
        "775720931",
    )
    records = await db.declaration.fetch(
        "SELECT data, owner, modified_at FROM declaration "
        "WHERE year=2020 "
        f"AND siren IN {SIREN}"
    )
    bar = progressist.ProgressBar(prefix="Migrating…", total=len(records))
    for record in bar.iter(records):
        data = record.data
        helpers.compute_notes(data)
        siren = data.siren
        year = data.year
        await db.declaration.put(
            siren,
            year,
            owner=record["owner"],
            data=data.raw,
            modified_at=record["modified_at"],
        )
