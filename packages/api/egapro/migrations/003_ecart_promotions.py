"""Data migration from 2020-12-25 did not compute missing ecartTauxPromotion."""

import progressist


async def main(db, logger):

    records = await db.declaration.fetch(
        "SELECT * FROM declaration WHERE data->>'source'='simulateur' "
        "AND legacy IS NOT NULL AND modified_at<'2020-12-25'"
    )
    bar = progressist.ProgressBar(prefix="Migrating…", total=len(records))
    for record in bar.iter(records):
        if not record.data.path("indicateurs.promotions"):
            continue
        if record.data.path("indicateurs.promotions.non_calculable"):
            continue
        data = record.data.raw
        siren = record.data.siren
        year = record.data.year
        try:
            trois = record["legacy"]["indicateurTrois"]
        except KeyError:
            continue
        tranches = trois.get("tauxPromotion")
        if tranches:
            categories = []
            for tranche in tranches:
                if "ecartTauxPromotion" in tranche:
                    categories.append(tranche["ecartTauxPromotion"])
                elif (
                    "tauxPromotionHommes" in tranche
                    and "tauxPromotionFemmes" in tranche
                ):
                    hommes = tranche["tauxPromotionHommes"]
                    femmes = tranche["tauxPromotionFemmes"]
                    categories.append(hommes - femmes)
                else:
                    categories.append(None)
        if any(c is not None for c in categories):
            data["indicateurs"]["promotions"]["catégories"] = categories
            await db.declaration.put(
                siren,
                year,
                owner=record["owner"],
                data=data,
                modified_at=record["modified_at"],
            )
