import pytest

from egapro import constants, helpers, models

RECHERCHE_ENTREPRISE_SAMPLE = {
    "activitePrincipale": "Conseil informatique",
    "categorieJuridiqueUniteLegale": "5710",
    "dateCreationUniteLegale": "2004-12-15",
    "caractereEmployeurUniteLegale": "O",
    "activitePrincipaleUniteLegale": "62.02A",
    "conventions": [
        {
            "idcc": 1486,
            "etat": "VIGUEUR_ETEN",
            "id": "KALICONT000005635173",
            "mtime": 1556652289,
            "texte_de_base": "KALITEXT000005679895",
            "title": "Convention collective nationale des bureaux d'études techniques, des cabinets d'ingénieurs-conseils et des sociétés de conseils du 15 décembre 1987. ",
            "url": "https://www.legifrance.gouv.fr/affichIDCC.do?idConvention=KALICONT000005635173",
            "shortTitle": "Bureaux d'études techniques, cabinets d'ingénieurs-conseils et sociétés de conseils",
        }
    ],
    "etablissements": 5,
    "etatAdministratifUniteLegale": "A",
    "highlightLabel": "FOOBAR",
    "label": "FOOBAR",
    "matching": 2,
    "firstMatchingEtablissement": {
        "address": "2 RUE FOOBAR 75002 PARIS",
        "codeCommuneEtablissement": "75102",
        "codePostalEtablissement": "75002",
        "libelleCommuneEtablissement": "PARIS 2",
        "idccs": [],
        "categorieEntreprise": "PME",
        "siret": "48191299900037",
        "etatAdministratifEtablissement": "A",
        "etablissementSiege": True,
        "activitePrincipaleEtablissement": "46.69B",
    },
    "allMatchingEtablissements": [
        {
            "address": "275 RUE FOOBAR 75002 PARIS",
            "siret": "48191299900037",
            "activitePrincipaleEtablissement": "46.69B",
            "etablissementSiege": True,
            "codeCommuneEtablissement": "75102",
            "codePostalEtablissement": "75002",
            "libelleCommuneEtablissement": "PARIS 2",
        },
        {
            "address": "194 BOULEVARD DE FOOFOO 75003 PARIS",
            "siret": "48191299900052",
            "idccs": ["1486"],
            "activitePrincipaleEtablissement": "46.69B",
            "etablissementSiege": False,
            "codeCommuneEtablissement": "75103",
            "codePostalEtablissement": "75002",
            "libelleCommuneEtablissement": "PARIS 2",
        },
    ],
    "simpleLabel": "FOOBAR",
    "siren": "481912999",
}

API_ENTREPRISES_SAMPLE = {
    "entreprise": {
        "siren": "481912999",
        "capital_social": 100000,
        "numero_tva_intracommunautaire": "FR94481912999",
        "forme_juridique": "SAS, société par actions simplifiée",
        "forme_juridique_code": "5710",
        "nom_commercial": "FOOBAR",
        "procedure_collective": False,
        "enseigne": None,
        "libelle_naf_entreprise": "Conseil en systèmes et logiciels informatiques",
        "naf_entreprise": "6202A",
        "raison_sociale": "FOOBAR",
        "siret_siege_social": "48191290000099",
        "code_effectif_entreprise": "03",
        "date_creation": 1103065200,
        "nom": None,
        "prenom": None,
        "date_radiation": None,
        "categorie_entreprise": "PME",
        "tranche_effectif_salarie_entreprise": {
            "de": 6,
            "a": 9,
            "code": "03",
            "date_reference": "2018",
            "intitule": "6 à 9 salariés",
        },
        "mandataires_sociaux": [
            {
                "nom": "FOO",
                "prenom": "BAR",
                "fonction": "PRESIDENT",
                "date_naissance": "1979-08-06",
                "date_naissance_timestamp": 302738400,
                "dirigeant": True,
                "raison_sociale": "",
                "identifiant": "",
                "type": "PP",
            },
        ],
        "etat_administratif": {"value": "A", "date_cessation": None},
    },
    "etablissement_siege": {
        "siege_social": True,
        "siret": "48191299000099",
        "naf": "6202A",
        "libelle_naf": "Conseil en systèmes et logiciels informatiques",
        "date_mise_a_jour": 1598343993,
        "tranche_effectif_salarie_etablissement": {
            "de": 6,
            "a": 9,
            "code": "03",
            "date_reference": "2018",
            "intitule": "6 à 9 salariés",
        },
        "date_creation_etablissement": 1485903600,
        "region_implantation": {"code": "11", "value": "Île-de-France"},
        "commune_implantation": {
            "code": "75102",
            "value": "Paris 2e Arrondissement",
        },
        "pays_implantation": {"code": "FR", "value": "FRANCE"},
        "diffusable_commercialement": True,
        "enseigne": None,
        "adresse": {
            "l1": "FOOBAR",
            "l2": None,
            "l3": None,
            "l4": "2 RUE FOOBAR",
            "l5": None,
            "l6": "75002 PARIS 2",
            "l7": "FRANCE",
            "numero_voie": "2",
            "type_voie": "RUE",
            "nom_voie": "FOOBAR",
            "complement_adresse": None,
            "code_postal": "75002",
            "localite": "PARIS 2",
            "code_insee_localite": "75102",
            "cedex": None,
        },
        "etat_administratif": {"value": "A", "date_fermeture": None},
    },
    "gateway_error": False,
}


@pytest.mark.parametrize(
    "query,selected,candidates",
    [
        (
            "foobar",
            "Réseau Foobar",
            [
                "Réseau Foobar",
                "FOOBAR TRANSACTION FRANCE",
                "FOOBAR AGENCE CENTRALE",
                "Foobar Immobibaz",
            ],
        ),
        (
            "immobibaz",
            "Réseau Foobar (Foobar Immobibaz)",
            [
                "Réseau Foobar",
                "FOOBAR TRANSACTION FRANCE",
                "FOOBAR AGENCE CENTRALE",
                "Foobar Immobibaz",
            ],
        ),
    ],
)
def test_compute_label(query, selected, candidates):
    assert helpers.compute_label(query, *candidates) == selected


@pytest.mark.parametrize(
    "input,output",
    [
        (None, None),
        (0, 40),
        (0.003, 40),
        (0.03, 40),
        (0.047, 40),
        (0.05, 39),
        (0.051, 39),
        (0.3, 39),
        (0.9, 39),
        (1, 39),
        (5.04, 35),
        (5.05, 34),
        (112, 0),
        ("NaN", 0),
        ("foobar", None),
    ],
)
def test_compute_remuneration_note(input, output):
    assert helpers.compute_note(input, helpers.REMUNERATIONS_THRESHOLDS) == output


@pytest.mark.parametrize(
    "input,output",
    [
        (0, 0),
        (1, 0),
        (33, 0),
        (99, 0),
        (100, 15),
    ],
)
def test_compute_conges_maternites_note(input, output):
    assert helpers.compute_note(input, helpers.CONGES_MATERNITE_THRESHOLDS) == output


def test_compute_augmentations_note():
    data = models.Data(
        {
            "déclaration": {},
            "indicateurs": {
                "augmentations_et_promotions": {
                    "résultat": 5,
                    "résultat_nombre_salariés": 6,
                }
            },
        }
    )
    helpers.compute_notes(data)
    assert data["indicateurs"]["augmentations_et_promotions"]["note"] == 25
    assert (
        data["indicateurs"]["augmentations_et_promotions"]["note_nombre_salariés"] == 15
    )
    assert (
        data["indicateurs"]["augmentations_et_promotions"]["note_en_pourcentage"] == 25
    )

    data = models.Data(
        {
            "déclaration": {},
            "indicateurs": {
                "augmentations_et_promotions": {
                    "résultat": 5.05,
                    "résultat_nombre_salariés": 2,
                }
            },
        }
    )
    helpers.compute_notes(data)
    assert data["indicateurs"]["augmentations_et_promotions"]["note"] == 35
    assert (
        data["indicateurs"]["augmentations_et_promotions"]["note_nombre_salariés"] == 35
    )
    assert (
        data["indicateurs"]["augmentations_et_promotions"]["note_en_pourcentage"] == 15
    )
    data["indicateurs"]["augmentations_et_promotions"]["non_calculable"] = "egvi40pcet"
    helpers.compute_notes(data)
    assert not data["indicateurs"]["augmentations_et_promotions"].get("note")
    assert not data["indicateurs"]["augmentations_et_promotions"].get(
        "note_nombre_salariés"
    )
    assert not data["indicateurs"]["augmentations_et_promotions"].get(
        "note_en_pourcentage"
    )


def test_compute_augmentations_note_with_correction_measures():
    data = models.Data(
        {
            "déclaration": {},
            "indicateurs": {
                "rémunérations": {"résultat": 5, "population_favorable": "hommes"},
                "augmentations_et_promotions": {
                    "résultat": 5,
                    "résultat_nombre_salariés": 6,
                    "population_favorable": "femmes",
                },
            },
        }
    )
    helpers.compute_notes(data)
    # Maximal note because this indicateur is favourable for the opposition population
    # of rémunérations indicateur
    assert data["indicateurs"]["augmentations_et_promotions"]["note"] == 35


def test_compute_augmentations_note_with_correction_measures_but_equality():
    data = models.Data(
        {
            "déclaration": {},
            "indicateurs": {
                "rémunérations": {"résultat": 0, "population_favorable": "hommes"},
                "augmentations_et_promotions": {
                    "résultat": 5,
                    "résultat_nombre_salariés": 6,
                    "population_favorable": "femmes",
                },
            },
        }
    )
    helpers.compute_notes(data)
    # rémuénrations.résultat == 0, this means equality, so whatever the value of
    # population_favorable, we do not follow it
    assert data["indicateurs"]["augmentations_et_promotions"]["note"] == 25


def test_compute_augmentations_hp_note_with_correction_measures_but_equality():
    data = models.Data(
        {
            "déclaration": {},
            "indicateurs": {
                "rémunérations": {
                    "note": 40,
                    "résultat": 0.0,
                    "population_favorable": "femmes",
                },
                "augmentations": {
                    "résultat": 4.0,
                    "population_favorable": "hommes",
                },
            },
        }
    )
    helpers.compute_notes(data)
    assert data["indicateurs"]["augmentations"]["note"] == 10


def test_extract_ft():
    data = {"entreprise": {"raison_sociale": "blablabar"}}
    assert helpers.extract_ft(models.Data(data)) == "blablabar"
    data = {"entreprise": {"raison_sociale": "blablabar", "ues": {"nom": "nom ues"}}}
    assert helpers.extract_ft(models.Data(data)) == "blablabar nom ues"
    data = {
        "entreprise": {
            "raison_sociale": "blablabar",
            "ues": {
                "nom": "nom ues",
                "entreprises": [
                    {"siren": "123456789", "raison_sociale": "entreprise une"},
                    {"siren": "123456780", "raison_sociale": "entreprise deux"},
                ],
            },
        }
    }
    assert (
        helpers.extract_ft(models.Data(data))
        == "blablabar nom ues entreprise une entreprise deux"
    )


@pytest.mark.asyncio
async def test_recherche_entreprise(monkeypatch):
    async def mock_get(*args, **kwargs):
        return RECHERCHE_ENTREPRISE_SAMPLE

    monkeypatch.setattr("egapro.helpers.get", mock_get)
    data = await helpers.get_entreprise_details("481912999")
    assert data == {
        "adresse": "2 RUE FOOBAR",
        "code_naf": "62.02A",
        "code_postal": "75002",
        "commune": "PARIS 2",
        "département": "75",
        "raison_sociale": "FOOBAR",
        "région": "11",
    }


@pytest.mark.asyncio
async def test_recherche_entreprise_with_date_radiation(monkeypatch):
    RECHERCHE_ENTREPRISE_SAMPLE["etatAdministratifUniteLegale"] = "C"

    async def mock_get(*args, **kwargs):
        return RECHERCHE_ENTREPRISE_SAMPLE

    monkeypatch.setattr("egapro.helpers.get", mock_get)
    with pytest.raises(ValueError) as info:
        await helpers.get_entreprise_details("481912999")
    assert str(info.value) == (
        "Le Siren saisi correspond à une entreprise fermée, "
        "veuillez vérifier votre saisie"
    )
    RECHERCHE_ENTREPRISE_SAMPLE["etatAdministratifUniteLegale"] = "A"


@pytest.mark.asyncio
async def test_recherche_entreprise_with_foreign_company(monkeypatch):
    async def mock_get(*args, **kwargs):
        return {
            "activitePrincipale": "Activités des sièges sociaux",
            "categorieJuridiqueUniteLegale": "3120",
            "dateCreationUniteLegale": "2018-12-11",
            "caractereEmployeurUniteLegale": "O",
            "activitePrincipaleUniteLegale": "70.10Z",
            "etablissements": 2,
            "etatAdministratifUniteLegale": "A",
            "highlightLabel": "FOOBAR",
            "label": "FOOBAR",
            "matching": 2,
            "firstMatchingEtablissement": {
                "codePaysEtrangerEtablissement": "99134",
                "idccs": [],
                "categorieEntreprise": "PME",
                "siret": "84457798100013",
                "etatAdministratifEtablissement": "A",
                "etablissementSiege": True,
                "activitePrincipaleEtablissement": "70.10Z",
            },
            "simpleLabel": "FOOBAR",
            "siren": "481912999",
        }

    monkeypatch.setattr("egapro.helpers.get", mock_get)
    data = await helpers.get_entreprise_details("481912999")
    assert data == {
        "code_naf": "70.10Z",
        "code_pays": "ES",
        "raison_sociale": "FOOBAR",
    }


@pytest.mark.asyncio
async def test_recherche_entreprise_with_com_company(monkeypatch):
    async def mock_get(*args, **kwargs):
        return {
            "activitePrincipale": "Activités des agences de travail temporaire",
            "categorieJuridiqueUniteLegale": "5202",
            "dateCreationUniteLegale": "2019-01-02",
            "caractereEmployeurUniteLegale": "O",
            "activitePrincipaleUniteLegale": "78.20Z",
            "conventions": [{"idcc": 1413}, {"idcc": 2378}],
            "etablissements": 1,
            "etatAdministratifUniteLegale": "A",
            "highlightLabel": "FOOBAR SAINT BARTHELEMY",
            "label": "FOOBAR SAINT BARTHELEMY",
            "matching": 1,
            "firstMatchingEtablissement": {
                "address": "RUE POUET FOO 97133 SAINT BARTHELEMY",
                "codeCommuneEtablissement": "97701",
                "codePostalEtablissement": "97133",
                "libelleCommuneEtablissement": "SAINT BARTHELEMY",
                "idccs": ["1413", "2378"],
                "categorieEntreprise": "ETI",
                "siret": "85069932300018",
                "etatAdministratifEtablissement": "A",
                "etablissementSiege": True,
                "activitePrincipaleEtablissement": "78.20Z",
            },
            "simpleLabel": "FOOBAR SAINT BARTHELEMY",
            "siren": "481912999",
        }

    monkeypatch.setattr("egapro.helpers.get", mock_get)
    data = await helpers.get_entreprise_details("481912999")
    assert data == {
        "adresse": "RUE POUET FOO",
        "code_naf": "78.20Z",
        "code_postal": "97133",
        "commune": "SAINT BARTHELEMY",
        "raison_sociale": "FOOBAR SAINT BARTHELEMY",
    }


@pytest.mark.asyncio
async def test_recherche_entreprise_is_cached(monkeypatch):
    RECHERCHE_ENTREPRISE_SAMPLE["label"] = "123 je vais dans les bois"
    RECHERCHE_ENTREPRISE_SAMPLE["simpleLabel"] = "123 je vais dans les bois"

    async def mock_get(*args, **kwargs):
        return RECHERCHE_ENTREPRISE_SAMPLE

    monkeypatch.setattr("egapro.helpers.get", mock_get)
    res = await helpers.get_entreprise_details("481912999")
    assert res["raison_sociale"] == "123 je vais dans les bois"

    async def mock_get(*args, **kwargs):
        assert False, "Should not be called because of the cache"

    monkeypatch.setattr("egapro.helpers.get", mock_get)
    res = await helpers.get_entreprise_details("481912999")
    assert res["raison_sociale"] == "123 je vais dans les bois"


@pytest.mark.asyncio
async def test_recherche_entreprise_with_date_radiation_current_year(monkeypatch):
    # Older than active year
    API_ENTREPRISES_SAMPLE["entreprise"]["date_radiation"] = "2019-03-12"

    async def mock_get(*args, **kwargs):
        return API_ENTREPRISES_SAMPLE

    monkeypatch.setattr("egapro.config.API_ENTREPRISES", "foobar")  # Use API Entreprise
    monkeypatch.setattr("egapro.helpers.get", mock_get)
    with pytest.raises(ValueError) as info:
        await helpers.get_entreprise_details("481912999")
    assert str(info.value) == (
        "Le Siren saisi correspond à une entreprise fermée, "
        "veuillez vérifier votre saisie"
    )

    # Closed during active year, should not raise
    API_ENTREPRISES_SAMPLE["entreprise"][
        "date_radiation"
    ] = f"{constants.CURRENT_YEAR}-03-12"
    res = await helpers.get_entreprise_details("481912999")
    assert res == {
        "adresse": "2 RUE FOOBAR",
        "code_naf": "62.02A",
        "code_postal": "75002",
        "commune": "PARIS 2",
        "département": "75",
        "raison_sociale": "FOOBAR",
        "région": "11",
    }


@pytest.mark.parametrize(
    "code,expected",
    [("77480", "77"), ("97480", "974"), ("2A123", "2A"), (None, None)],
)
def test_code_insee_to_departement(code, expected):
    assert helpers.code_insee_to_departement(code) == expected
