"""Data migration from 2020-12-25 did not compute missing ecartTauxAugmentation."""

import progressist


async def main(db, logger):

    records = await db.declaration.fetch(
        "SELECT * FROM declaration WHERE data->>'source'='simulateur' "
        "AND legacy IS NOT NULL AND modified_at<'2020-12-25'"
    )
    bar = progressist.ProgressBar(prefix="Migrating…", total=len(records))
    for record in bar.iter(records):
        if not record.data.path("indicateurs.augmentations"):
            continue
        if record.data.path("indicateurs.augmentations.non_calculable"):
            continue
        data = record.data.raw
        siren = record.data.siren
        year = record.data.year
        try:
            deux = record["legacy"]["indicateurDeux"]
        except KeyError:
            continue
        tranches = deux.get("tauxAugmentation")
        if tranches:
            categories = []
            for tranche in tranches:
                if "ecartTauxAugmentation" in tranche:
                    categories.append(tranche["ecartTauxAugmentation"])
                elif (
                    "tauxAugmentationHommes" in tranche
                    and "tauxAugmentationFemmes" in tranche
                ):
                    hommes = tranche["tauxAugmentationHommes"]
                    femmes = tranche["tauxAugmentationFemmes"]
                    categories.append(hommes - femmes)
                else:
                    categories.append(None)
        if any(c is not None for c in categories):
            data["indicateurs"]["augmentations"]["catégories"] = categories
            await db.declaration.put(
                siren,
                year,
                owner=record["owner"],
                data=data,
                modified_at=record["modified_at"],
            )
