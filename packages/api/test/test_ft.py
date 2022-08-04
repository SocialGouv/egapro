from datetime import datetime

import pytest

from egapro import db

pytestmark = pytest.mark.asyncio


@pytest.fixture(autouse=True)
async def init_db():
    await db.init()
    yield
    await db.terminate()


async def test_search(client):
    rows = [
        ("123456781", "Total"),
        ("123456782", "Somme"),
        ("123456783", "Biocoop"),
        ("123456784", "Bio c bon"),
        ("123456785", "Bio c pas bon"),
        ("123456786", "Pyrénées"),
        ("123456787", "Decathlon"),
    ]
    for siren, nom in rows:
        await db.declaration.put(
            siren,
            2019,
            "foo@bar.org",
            {
                "entreprise": {
                    "raison_sociale": nom,
                    "effectif": {"tranche": "1000:"},
                    "code_naf": "33.11Z",
                    "département": "77",
                    "région": "11",
                    "ues": {
                        "nom": "Nom UES",
                        "entreprises": [
                            {"siren": "987654321", "raison_sociale": "foobabar"}
                        ],
                    },
                },
                "déclaration": {"date": datetime.now()},
            },
        )
    results = await db.search.run("total")
    assert len(results) == 1
    assert results[0] == {
        "entreprise": {
            "raison_sociale": "Total",
            "département": "77",
            "région": "11",
            "siren": "123456781",
            "ues": {
                "entreprises": [
                    {"raison_sociale": "Total", "siren": "123456781"},
                    {"raison_sociale": "foobabar", "siren": "987654321"},
                ],
                "nom": "Nom UES",
            },
            "code_naf": "33.11Z",
            "effectif": {"tranche": "1000:"},
        },
        "notes": {"2019": None},
        "notes_augmentations": {"2019": None},
        "notes_augmentations_et_promotions": {"2019": None},
        "notes_conges_maternite": {"2019": None},
        "notes_hautes_rémunérations": {"2019": None},
        "notes_promotions": {"2019": None},
        "notes_remunerations": {"2019": None},
        "label": "Nom UES (Total)",
    }
    results = await db.search.run("pyrenées")
    assert len(results) == 1
    results = await db.search.run("décathlon")
    assert len(results) == 1
    results = await db.search.run("bio")
    assert len(results) == 3
    results = await db.search.run("bio", limit=1)
    assert len(results) == 1


async def test_company_should_return_a_note_for_each_year(declaration):
    await declaration(
        company="Mala Bar",
        siren="87654321",
        year=2019,
        entreprise={"effectif": {"tranche": "1000:"}},
    )
    await declaration(
        company="Mala Bar",
        siren="87654321",
        year=2018,
        entreprise={"effectif": {"tranche": "1000:"}},
    )
    results = await db.search.run("bar")
    assert len(results) == 1
    assert set(results[0]["notes"].keys()) == {"2018", "2019"}


async def test_search_from_ues_name(client):
    await db.declaration.put(
        "123456781",
        2019,
        "foo@bar.org",
        {
            "entreprise": {
                "raison_sociale": "Babar",
                "effectif": {"tranche": "1000:"},
                "département": "77",
                "région": "11",
                "ues": {
                    "nom": "Nom UES",
                    "entreprises": [
                        {"siren": "987654321", "raison_sociale": "foobabar"}
                    ],
                },
            },
            "déclaration": {"date": datetime.now()},
        },
    )
    results = await db.search.run("ues")
    assert len(results) == 1
    assert results[0] == {
        "entreprise": {
            "raison_sociale": "Babar",
            "département": "77",
            "région": "11",
            "siren": "123456781",
            "code_naf": None,
            "effectif": {"tranche": "1000:"},
            "ues": {
                "entreprises": [
                    {"raison_sociale": "Babar", "siren": "123456781"},
                    {"raison_sociale": "foobabar", "siren": "987654321"},
                ],
                "nom": "Nom UES",
            },
        },
        "notes": {"2019": None},
        "notes_augmentations": {"2019": None},
        "notes_augmentations_et_promotions": {"2019": None},
        "notes_conges_maternite": {"2019": None},
        "notes_hautes_rémunérations": {"2019": None},
        "notes_promotions": {"2019": None},
        "notes_remunerations": {"2019": None},
        "label": "Nom UES",
    }


async def test_search_from_ues_member_name(client):
    await db.declaration.put(
        "123456781",
        2019,
        "foo@bar.org",
        {
            "entreprise": {
                "raison_sociale": "Babar",
                "département": "77",
                "région": "11",
                "ues": {
                    "nom": "Nom UES",
                    "entreprises": [
                        {"siren": "987654321", "raison_sociale": "foobabar"}
                    ],
                },
                "effectif": {"tranche": "1000:"},
            },
            "déclaration": {"date": datetime.now()},
            "notes": {"2019": None},
        },
    )
    results = await db.search.run("foo")
    assert len(results) == 1
    assert results[0] == {
        "entreprise": {
            "raison_sociale": "Babar",
            "département": "77",
            "région": "11",
            "siren": "123456781",
            "ues": {
                "entreprises": [
                    {"raison_sociale": "Babar", "siren": "123456781"},
                    {"raison_sociale": "foobabar", "siren": "987654321"},
                ],
                "nom": "Nom UES",
            },
            "code_naf": None,
            "effectif": {"tranche": "1000:"},
        },
        "notes": {"2019": None},
        "notes_augmentations": {"2019": None},
        "notes_augmentations_et_promotions": {"2019": None},
        "notes_conges_maternite": {"2019": None},
        "notes_hautes_rémunérations": {"2019": None},
        "notes_promotions": {"2019": None},
        "notes_remunerations": {"2019": None},
        "label": "Nom UES (foobabar)",
    }


async def test_search_with_filters(client):
    await db.declaration.put(
        "123456781",
        2019,
        "foo@bar.org",
        {
            "entreprise": {
                "raison_sociale": "Oran Bar",
                "effectif": {"tranche": "1000:"},
                "département": "77",
                "région": "11",
            },
            "déclaration": {"date": datetime.now()},
        },
    )
    await db.declaration.put(
        "987654321",
        2019,
        "foo@bar.org",
        {
            "entreprise": {
                "raison_sociale": "Open Bar",
                "effectif": {"tranche": "1000:"},
                "département": "78",
                "région": "11",
            },
            "déclaration": {"date": datetime.now()},
        },
    )
    results = await db.search.run("bar", departement="78", region="11")
    assert len(results) == 1
    assert results[0] == {
        "entreprise": {
            "département": "78",
            "ues": None,
            "raison_sociale": "Open Bar",
            "région": "11",
            "siren": "987654321",
            "code_naf": None,
            "effectif": {"tranche": "1000:"},
        },
        "notes": {"2019": None},
        "notes_augmentations": {"2019": None},
        "notes_augmentations_et_promotions": {"2019": None},
        "notes_conges_maternite": {"2019": None},
        "notes_hautes_rémunérations": {"2019": None},
        "notes_promotions": {"2019": None},
        "notes_remunerations": {"2019": None},
        "label": "Open Bar",
    }


async def test_search_from_section_naf(client):
    await db.declaration.put(
        "123456781",
        2019,
        "foo@bar.org",
        {
            "entreprise": {
                "raison_sociale": "Oran Bar",
                "effectif": {"tranche": "1000:"},
                "département": "77",
                "région": "11",
                "code_naf": "33.11Z",
            },
            "déclaration": {"date": datetime.now()},
        },
    )
    await db.declaration.put(
        "987654321",
        2019,
        "foo@bar.org",
        {
            "entreprise": {
                "raison_sociale": "Open Bar",
                "effectif": {"tranche": "1000:"},
                "département": "78",
                "région": "11",
                "code_naf": "47.11F",
            },
            "déclaration": {"date": datetime.now()},
        },
    )
    results = await db.search.run("bar", section_naf="G")
    assert len(results) == 1
    assert results[0] == {
        "entreprise": {
            "département": "78",
            "ues": None,
            "raison_sociale": "Open Bar",
            "région": "11",
            "siren": "987654321",
            "code_naf": "47.11F",
            "effectif": {"tranche": "1000:"},
        },
        "notes": {"2019": None},
        "notes_augmentations": {"2019": None},
        "notes_augmentations_et_promotions": {"2019": None},
        "notes_conges_maternite": {"2019": None},
        "notes_hautes_rémunérations": {"2019": None},
        "notes_promotions": {"2019": None},
        "notes_remunerations": {"2019": None},
        "label": "Open Bar",
    }


async def test_filters_without_query(client):
    await db.declaration.put(
        "123456781",
        2019,
        "foo@bar.org",
        {
            "entreprise": {
                "raison_sociale": "Oran Bar",
                "effectif": {"tranche": "1000:"},
                "département": "77",
                "région": "11",
            },
            "déclaration": {"date": datetime.now()},
        },
    )
    await db.declaration.put(
        "987654321",
        2019,
        "foo@bar.org",
        {
            "entreprise": {
                "raison_sociale": "Open Bar",
                "effectif": {"tranche": "1000:"},
                "département": "78",
                "région": "11",
            },
            "déclaration": {"date": datetime.now()},
        },
    )
    results = await db.search.run(departement="78", region="11")
    assert len(results) == 1
    assert results[0] == {
        "entreprise": {
            "département": "78",
            "ues": None,
            "raison_sociale": "Open Bar",
            "région": "11",
            "code_naf": None,
            "effectif": {"tranche": "1000:"},
            "siren": "987654321",
        },
        "notes": {"2019": None},
        "notes_augmentations": {"2019": None},
        "notes_augmentations_et_promotions": {"2019": None},
        "notes_conges_maternite": {"2019": None},
        "notes_hautes_rémunérations": {"2019": None},
        "notes_promotions": {"2019": None},
        "notes_remunerations": {"2019": None},
        "label": "Open Bar",
    }


async def test_search_with_offset(client):
    await db.declaration.put(
        "123456781",
        2019,
        "foo@bar.org",
        {
            "entreprise": {
                "raison_sociale": "Oran Bar",
                "effectif": {"tranche": "1000:"},
                "département": "77",
                "région": "11",
            },
            "déclaration": {"date": datetime.now()},
        },
    )
    await db.declaration.put(
        "987654321",
        2019,
        "foo@bar.org",
        {
            "entreprise": {
                "raison_sociale": "Open Bar",
                "effectif": {"tranche": "1000:"},
                "département": "78",
                "région": "11",
            },
            "déclaration": {"date": datetime.now()},
        },
    )
    results = await db.search.run(region="11")
    assert len(results) == 2
    results = await db.search.run(region="11", limit=1)
    assert len(results) == 1
    assert results[0] == {
        "entreprise": {
            "département": "78",
            "ues": None,
            "raison_sociale": "Open Bar",
            "code_naf": None,
            "région": "11",
            "siren": "987654321",
            "effectif": {"tranche": "1000:"},
        },
        "notes": {"2019": None},
        "notes_augmentations": {"2019": None},
        "notes_augmentations_et_promotions": {"2019": None},
        "notes_conges_maternite": {"2019": None},
        "notes_hautes_rémunérations": {"2019": None},
        "notes_promotions": {"2019": None},
        "notes_remunerations": {"2019": None},
        "label": "Open Bar",
    }
    results = await db.search.run(region="11", limit=1, offset=1)
    assert len(results) == 1
    assert results[0] == {
        "entreprise": {
            "département": "77",
            "ues": None,
            "raison_sociale": "Oran Bar",
            "région": "11",
            "siren": "123456781",
            "code_naf": None,
            "effectif": {"tranche": "1000:"},
        },
        "notes": {"2019": None},
        "notes_augmentations": {"2019": None},
        "notes_augmentations_et_promotions": {"2019": None},
        "notes_conges_maternite": {"2019": None},
        "notes_hautes_rémunérations": {"2019": None},
        "notes_promotions": {"2019": None},
        "notes_remunerations": {"2019": None},
        "label": "Oran Bar",
    }


async def test_search_with_siren(declaration):
    await declaration(
        "123456712", year=2019, entreprise={"effectif": {"tranche": "1000:"}}
    )
    await declaration(
        "987654321", year=2019, entreprise={"effectif": {"tranche": "1000:"}}
    )
    results = await db.search.run("987654321")
    assert len(results) == 1
    assert results[0]["entreprise"]["siren"] == "987654321"


async def test_count_with_query(declaration):
    await declaration(
        "123456712",
        year=2019,
        company="Zanzi Bar",
        entreprise={"effectif": {"tranche": "1000:"}},
    )
    await declaration(
        "987654321",
        year=2019,
        company="Sli Bar",
        entreprise={"effectif": {"tranche": "1000:"}},
    )
    await declaration(
        "123456782",
        year=2019,
        company="Foo Foo",
        entreprise={"effectif": {"tranche": "1000:"}},
    )
    count = await db.search.count()
    assert count == 3
    count = await db.search.count(query="bar")
    assert count == 2


async def test_amp_and_parens_are_excaped(declaration):
    await declaration(
        "123456712",
        year=2019,
        company="Zanzi & (Bar)",
        entreprise={"effectif": {"tranche": "1000:"}},
    )
    results = await db.search.run(query="zanzi & (bar)")
    assert len(results)
