import progressist

from egapro import helpers


async def main(db, logger):
    decl_sirens = [
        r["siren"]
        for r in await db.declaration.fetch(
            "SELECT DISTINCT siren FROM declaration "
            "WHERE COALESCE(data->'entreprise'->>'raison_sociale', '') = ''"
        )
    ]
    repeq_sirens = [
        r["siren"]
        for r in await db.representation_equilibree.fetch(
            "SELECT DISTINCT siren FROM representation_equilibree "
            "WHERE COALESCE(data->'entreprise'->>'raison_sociale', '') = ''"
        )
    ]
    ues_records = await db.declaration.fetch(
        "SELECT siren, year, owner, modified_at, data FROM declaration "
        "WHERE jsonb_array_length(COALESCE(data->'entreprise'->'ues'->'entreprises', '[]'::jsonb)) > 0 "
        "AND EXISTS ("
        "  SELECT 1 FROM jsonb_array_elements(data->'entreprise'->'ues'->'entreprises') ue "
        "  WHERE COALESCE(ue->>'raison_sociale', '') = ''"
        ")"
    )

    ues_sirens = set()
    for record in ues_records:
        for ue in record.data.path("entreprise.ues.entreprises") or []:
            if not ue.get("raison_sociale") and ue.get("siren"):
                ues_sirens.add(ue["siren"])

    siren_to_name = {}
    all_sirens = sorted(set(decl_sirens) | set(repeq_sirens) | ues_sirens)
    logger.info(
        "Backfill: %d declarations, %d repeq, %d UES children, %d unique SIRENs",
        len(decl_sirens),
        len(repeq_sirens),
        len(ues_sirens),
        len(all_sirens),
    )

    bar = progressist.ProgressBar(prefix="Fetching…", total=len(all_sirens))
    for siren in bar.iter(all_sirens):
        try:
            name = await helpers.fetch_raison_sociale_from_public_api(siren)
        except Exception as exc:
            logger.warning("Failed to fetch %s: %s", siren, exc)
            continue
        if name:
            siren_to_name[siren] = name

    logger.info("Fetched names for %d / %d SIRENs", len(siren_to_name), len(all_sirens))

    updated_decl = 0
    for siren in decl_sirens:
        name = siren_to_name.get(siren)
        if not name:
            continue
        res = await db.declaration.execute(
            "UPDATE declaration "
            "SET data = jsonb_set(data, '{entreprise,raison_sociale}', to_jsonb($2::text)) "
            "WHERE siren=$1 AND COALESCE(data->'entreprise'->>'raison_sociale', '') = ''",
            siren,
            name,
        )
        if res:
            updated_decl += int(res.split()[-1]) if res.split()[-1].isdigit() else 0

    updated_repeq = 0
    for siren in repeq_sirens:
        name = siren_to_name.get(siren)
        if not name:
            continue
        res = await db.representation_equilibree.execute(
            "UPDATE representation_equilibree "
            "SET data = jsonb_set(data, '{entreprise,raison_sociale}', to_jsonb($2::text)) "
            "WHERE siren=$1 AND COALESCE(data->'entreprise'->>'raison_sociale', '') = ''",
            siren,
            name,
        )
        if res:
            updated_repeq += int(res.split()[-1]) if res.split()[-1].isdigit() else 0

    updated_ues_records = 0
    for record in ues_records:
        data = record.data.raw
        entreprises = data["entreprise"]["ues"]["entreprises"]
        changed = False
        for ue in entreprises:
            if ue.get("raison_sociale"):
                continue
            name = siren_to_name.get(ue.get("siren"))
            if name:
                ue["raison_sociale"] = name
                changed = True
        if changed:
            await db.declaration.put(
                record.data.siren,
                record.data.year,
                declarant=record["owner"],
                data=data,
                modified_at=record["modified_at"],
            )
            updated_ues_records += 1

    logger.info(
        "Backfill complete: %d declarations, %d repeq, %d UES records updated",
        updated_decl,
        updated_repeq,
        updated_ues_records,
    )
