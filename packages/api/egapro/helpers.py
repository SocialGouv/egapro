"""Unlike utils, helpers may import business logic"""

import math
from asyncstdlib.functools import lru_cache
from datetime import date
from difflib import SequenceMatcher

import httpx

from egapro import config, constants, schema
from egapro.loggers import logger
from egapro.schema.utils import clean_readonly


REMUNERATIONS_THRESHOLDS = {
    0.00: 40,
    0.05: 39,
    1.05: 38,
    2.05: 37,
    3.05: 36,
    4.05: 35,
    5.05: 34,
    6.05: 33,
    7.05: 31,
    8.05: 29,
    9.05: 27,
    10.05: 25,
    11.05: 23,
    12.05: 21,
    13.05: 19,
    14.05: 17,
    15.05: 14,
    16.05: 11,
    17.05: 8,
    18.05: 5,
    19.05: 2,
    20.05: 0,
}

AUGMENTATIONS_HP_THRESHOLDS = {
    0.00: 20,
    2.05: 10,
    5.05: 5,
    10.05: 0,
}

AUGMENTATIONS_PROMOTIONS_THRESHOLDS = {
    0.00: 35,
    2.05: 25,
    5.05: 15,
    10.05: 0,
}

PROMOTIONS_THRESHOLDS = {
    0.00: 15,
    2.05: 10,
    5.05: 5,
    10.05: 0,
}

CONGES_MATERNITE_THRESHOLDS = {
    0.0: 0,
    100.0: 15,
}

HAUTES_REMUNERATIONS_THRESHOLDS = {
    0: 0,
    2: 5,
    4: 10,
    6: 0,  # Align on old schema for now, any value > 5 means 0
}


def compute_note(resultat, thresholds):
    if resultat is None:
        return None
    try:
        resultat = float(resultat)
    except ValueError:
        return None
    previous = 0
    for threshold, note in thresholds.items():
        if resultat >= threshold:
            previous = note
            continue
    return previous


def compute_notes(data):
    # Remove note from previous computation
    clean_readonly(data, schema.SCHEMA)

    if "indicateurs" not in data:
        return
    points = 0
    maximum = 0
    population_favorable = None

    # indicateurs 1
    if not data.path("indicateurs.rémunérations.non_calculable"):
        result = data.path("indicateurs.rémunérations.résultat")
        note = compute_note(result, REMUNERATIONS_THRESHOLDS)
        if note is not None:
            if note != 40:
                # note=40 would mean equality
                population_favorable = data.path(
                    "indicateurs.rémunérations.population_favorable"
                )
            maximum += 40
            data["indicateurs"]["rémunérations"]["note"] = note
            points += note

    # indicateurs 2
    if not data.path("indicateurs.augmentations.non_calculable"):
        note = compute_note(
            data.path("indicateurs.augmentations.résultat"),
            AUGMENTATIONS_HP_THRESHOLDS,
        )
        if note is not None:
            maximum += 20
            indic_favorable = data.path(
                "indicateurs.augmentations.population_favorable"
            )
            if population_favorable and population_favorable != indic_favorable:
                # Cf https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000037964765/ Annexe 5.2
                note = 20
            data["indicateurs"]["augmentations"]["note"] = note
            points += note

    # indicateurs 2et3
    if not data.path("indicateurs.augmentations_et_promotions.non_calculable"):
        # in percent
        percent = compute_note(
            data.path("indicateurs.augmentations_et_promotions.résultat"),
            AUGMENTATIONS_PROMOTIONS_THRESHOLDS,
        )

        if percent is not None:
            data["indicateurs"]["augmentations_et_promotions"][
                "note_en_pourcentage"
            ] = percent
        # in absolute
        absolute = compute_note(
            data.path(
                "indicateurs.augmentations_et_promotions.résultat_nombre_salariés"
            ),
            AUGMENTATIONS_PROMOTIONS_THRESHOLDS,
        )
        if absolute is not None:
            data["indicateurs"]["augmentations_et_promotions"][
                "note_nombre_salariés"
            ] = absolute
        if absolute is not None or percent is not None:
            absolute = absolute or 0
            percent = percent or 0
            note = max(absolute, percent)
            maximum += 35
            indic_favorable = data.path(
                "indicateurs.augmentations_et_promotions.population_favorable"
            )
            if population_favorable and population_favorable != indic_favorable:
                # Cf https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000037964765/ Annexe 5.2
                note = 35
            data["indicateurs"]["augmentations_et_promotions"]["note"] = note
            points += note

    # indicateurs 3
    if not data.path("indicateurs.promotions.non_calculable"):
        note = compute_note(
            data.path("indicateurs.promotions.résultat"), PROMOTIONS_THRESHOLDS
        )
        if note is not None:
            maximum += 15
            indic_favorable = data.path("indicateurs.promotions.population_favorable")
            if population_favorable and population_favorable != indic_favorable:
                # Cf https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000037964765/ Annexe 5.2
                note = 15
            data["indicateurs"]["promotions"]["note"] = note
            points += note

    # indicateurs 4
    if not data.path("indicateurs.congés_maternité.non_calculable"):
        result = data.path("indicateurs.congés_maternité.résultat")
        if result is not None:
            note = 15 if result == 100 else 0
            maximum += 15
            data["indicateurs"]["congés_maternité"]["note"] = note
            points += note

    # indicateurs 5
    note = compute_note(
        data.path("indicateurs.hautes_rémunérations.résultat"),
        HAUTES_REMUNERATIONS_THRESHOLDS,
    )
    if note is not None:
        maximum += 10
        data["indicateurs"]["hautes_rémunérations"]["note"] = note
        points += note

    # Global counts
    data["déclaration"]["points"] = points
    data["déclaration"]["points_calculables"] = maximum
    if maximum >= 75:
        # Make sure to round up halway
        # cf https://stackoverflow.com/a/33019698/
        data["déclaration"]["index"] = math.floor((points / maximum * 100) + 0.5)


def extract_ft(data):
    candidates = [
        data.path("entreprise.raison_sociale"),
        data.path("entreprise.ues.nom"),
    ] + [e["raison_sociale"] for e in data.path("entreprise.ues.entreprises") or []]
    return " ".join(c for c in candidates if c)


async def get(*args, **kwargs):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(*args, **kwargs)
        except httpx.HTTPError:
            return None
        if response.status_code != httpx.codes.OK:
            return None
        return response.json()


async def load_from_recherche_entreprises(siren, year=constants.INVALID_YEAR):
    if not siren:
        return {}
    if config.API_ENTREPRISES:
        return await load_from_api_entreprises(siren, year)
    logger.debug("Calling Recherche Entreprises for siren %s", siren)
    url = f"https://api.recherche-entreprises.fabrique.social.gouv.fr/api/v1/entreprise/{siren}"
    headers = {'Referer': 'egapro'}
    data = await get(url, headers=headers)
    if not data:
        return {}
    raison_sociale = data.get("simpleLabel")
    limit = date(year+1, 3, 1)
    radiation = data.get("dateCessation")
    # if dateCessation comes before limit date, raise an error
    if year and radiation and date.fromisoformat(radiation) < limit:
        raise ValueError(
            "Le Siren saisi correspond à une entreprise fermée, "
            "veuillez vérifier votre saisie"
        )
    etablissement = data.get("firstMatchingEtablissement", {})
    code_insee = etablissement.get("codeCommuneEtablissement")
    departement = code_insee_to_departement(code_insee)
    region = constants.DEPARTEMENT_TO_REGION.get(departement)
    code_postal = etablissement.get("codePostalEtablissement")
    commune = etablissement.get("libelleCommuneEtablissement")
    adresse = etablissement.get("address")
    if adresse and code_postal and code_postal in adresse:
        adresse = adresse.split(code_postal)[0].strip()
    code_naf = data.get("activitePrincipaleUniteLegale")
    code_pays = etablissement.get("codePaysEtrangerEtablissement")
    return {
        "raison_sociale": raison_sociale,
        "code_naf": code_naf,
        "région": region,
        "département": departement,
        "adresse": adresse,
        "commune": commune,
        "code_postal": code_postal,
        "code_pays": constants.PAYS_COG_TO_ISO.get(code_pays),
    }


async def load_from_api_entreprises(siren, year=constants.INVALID_YEAR):
    if not siren or not config.API_ENTREPRISES:
        return {}
    logger.debug("Calling API Entreprises for siren %s", siren)
    url = f"https://entreprise.api.gouv.fr/v2/entreprises/{siren}"
    params = {
        "token": config.API_ENTREPRISES,
        "context": "egapro",
        "recipient": "egapro",
        "object": "egapro",
    }
    headers = {'Referer': 'egapro'}
    data = await get(url, params=params, headers=headers)
    if not data:
        return {}
    entreprise = data.get("entreprise", {})
    radiation = entreprise.get("date_radiation")
    limit = date(year+1, 3, 1)
    if year and radiation and date.fromisoformat(radiation) < limit:
        raise ValueError(
            "Le Siren saisi correspond à une entreprise fermée, "
            "veuillez vérifier votre saisie"
        )
    siege = data.get("etablissement_siege", {})
    code_postal = siege.get("adresse", {}).get("code_postal")
    commune = siege.get("adresse", {}).get("localite")
    code_insee = siege.get("adresse", {}).get("code_insee_localite")
    departement = code_insee_to_departement(code_insee)
    adresse = siege.get("adresse", {})
    adresse = [adresse.get(k) for k in ["numero_voie", "type_voie", "nom_voie"]]
    adresse = " ".join(v for v in adresse if v)
    code_naf = entreprise.get("naf_entreprise")
    code_pays = siege.get("pays_implantation", {}).get("code")
    if code_naf:  # 4774Z => 47.74Z
        code_naf = f"{code_naf[:2]}.{code_naf[2:]}"
    return {
        "raison_sociale": entreprise.get("raison_sociale"),
        "code_naf": code_naf,
        "région": siege.get("region_implantation", {}).get("code"),
        "département": departement,
        "adresse": adresse,
        "commune": commune,
        "code_postal": code_postal,
        "code_pays": constants.PAYS_COG_TO_ISO.get(code_pays),
    }


@lru_cache(maxsize=1024)
async def get_entreprise_details(siren, year=constants.INVALID_YEAR):
    if config.API_ENTREPRISES:
        data = await load_from_api_entreprises(siren, year)
    else:
        data = await load_from_recherche_entreprises(siren, year)
    data = {k: v for k, v in data.items() if v is not None}
    if not data:
        raise ValueError(f"Numéro SIREN inconnu: {siren}")
    return data


async def patch_from_recherche_entreprises(data):
    entreprise = data.setdefault("entreprise", {})
    siren = entreprise.get("siren")
    if not entreprise.get("raison_sociale"):
        try:
            extra = await get_entreprise_details(siren)
        except ValueError:
            pass
        else:
            for key, value in extra.items():
                entreprise.setdefault(key, value)


def compare_str(wanted: str, candidate: str):
    candidate = candidate.lower()
    if wanted == candidate:
        return 1
    if wanted in candidate:
        return 0.9
    return SequenceMatcher(a=wanted, b=candidate).ratio()


def compute_label(query: str, label: str, *others):
    if not others:
        return label
    query = query.lower()
    main_score = compare_str(query, label)
    candidates = sorted(
        ((c, compare_str(query, c)) for c in others), reverse=True, key=lambda x: x[1]
    )
    candidate, score = candidates[0]
    if score > main_score:
        label = f"{label} ({candidate})"
    return label


def code_insee_to_departement(code: str):
    if not code:
        return None
    if code.startswith("97"):
        code = code[:3]
    else:
        code = code[:2]
    # Skip COM insee codes.
    if code not in constants.DEPARTEMENTS:
        return None
    return code
