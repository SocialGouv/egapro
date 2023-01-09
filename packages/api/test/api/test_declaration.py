import json
from datetime import timedelta
from unittest import mock

import pytest

from egapro import db, schema, utils, constants

pytestmark = pytest.mark.asyncio


# Minimal body to send post requests
@pytest.fixture
def body():
    return {
        "id": "1234",
        "source": "formulaire",
        "déclaration": {
            "date": "2020-11-04T10:37:06+00:00",
            "année_indicateurs": 2019,
            "fin_période_référence": "2019-12-31",
            "publication": {"date": "2020-11-01", "modalités": "Affichage"},
        },
        "déclarant": {
            "email": "foo@bar.org",
            "prénom": "Foo",
            "nom": "Bar",
            "téléphone": "+33123456789",
        },
        "entreprise": {
            "raison_sociale": "FooBar",
            "siren": "514027945",
            "code_naf": "47.25Z",
            "code_postal": "12345",
            "région": "76",
            "département": "12",
            "adresse": "12, rue des adresses",
            "commune": "Y",
            "effectif": {"total": 312, "tranche": "251:999"},
        },
        "indicateurs": {
            "rémunérations": {"mode": "csp", "résultat": 1.28},
            "augmentations": {"résultat": 1.03},
            "promotions": {"résultat": 2.03},
            "congés_maternité": {"résultat": 88},
            "hautes_rémunérations": {"résultat": 3},
        },
    }


async def test_cannot_put_declaration_without_token(client, body):
    client.logout()
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 401


async def test_cannot_get_declaration_without_token(client):
    client.logout()
    resp = await client.get("/declaration/514027945/2019")
    assert resp.status == 401


async def test_invalid_siren_should_raise(client, body):
    resp = await client.put("/declaration/111111111/2019", body=body)
    assert resp.status == 422
    assert json.loads(resp.body) == {"error": "Numéro SIREN invalide: 111111111"}


async def test_wrong_year_should_raise(client, body):
    resp = await client.put("/declaration/514027945/2017", body=body)
    assert resp.status == 422
    assert json.loads(resp.body) == {
        "error": "Il est possible de déclarer seulement pour les années 2018, 2019, 2020, 2021"
    }


async def test_invalid_year_should_raise(client, body):
    resp = await client.put("/declaration/514027945/undefined", body=body)
    assert resp.status == 404
    assert json.loads(resp.body) == {
        "error": "/declaration/514027945/undefined"
    }


async def test_put_declaration_with_empty_body(client):
    resp = await client.put("/declaration/514027945/2019", body="")
    assert resp.status == 400


async def test_put_declaration_with_invalid_json(client):
    resp = await client.put("/declaration/514027945/2019", body="<foo>bar</foo>")
    assert resp.status == 400


async def test_put_declaration_with_empty_json(client):
    resp = await client.put("/declaration/514027945/2019", body="{}")
    assert resp.status == 422


async def test_put_declaration_with_json_list(client):
    resp = await client.put("/declaration/514027945/2019", body="[{}]")
    assert resp.status == 400
    assert json.loads(resp.body) == {"error": "`data` doit être de type objet JSON"}


async def test_put_declaration_with_json_list_and_namespace(client):
    resp = await client.put("/declaration/514027945/2019", body='{"data": []}')
    assert resp.status == 422


async def test_cannot_put_in_readonly(client, declaration, monkeypatch, body):
    monkeypatch.setattr("egapro.config.READONLY", True)
    await declaration(
        "514027945",
        2019,
        "foo@bar.org",
        modified_at=utils.utcnow() - timedelta(days=366),
    )
    resp = await client.get("/declaration/514027945/2019")
    assert resp.status == 200
    resp = await client.put(
        "/declaration/514027945/2019", body=body, headers={"X-REAL-IP": "1.1.1.1"}
    )
    assert resp.status == 405
    assert json.loads(resp.body) == {"error": "Ooops, le site est en maintenance"}


async def test_basic_declaration_should_save_data(client, body, monkeypatch):
    logger = mock.Mock()
    monkeypatch.setattr("egapro.loggers.logger.info", logger)
    resp = await client.put(
        "/declaration/514027945/2019", body=body, headers={"X-REAL-IP": "1.1.1.1"}
    )
    assert resp.status == 204
    logger.assert_called_with("514027945/2019 BY foo@bar.org FROM 1.1.1.1")
    resp = await client.get("/declaration/514027945/2019")
    assert resp.status == 200
    data = json.loads(resp.body)
    assert "modified_at" in data
    del data["modified_at"]
    assert data["declared_at"]
    del data["declared_at"]
    del data["data"]["déclaration"]["date"]
    del body["déclaration"]["date"]
    expected = {
        "siren": "514027945",
        "year": 2019,
        "data": {
            "id": "1234",
            "source": "formulaire",
            "déclarant": {
                "nom": "Bar",
                "email": "foo@bar.org",
                "prénom": "Foo",
                "téléphone": "+33123456789",
            },
            "entreprise": {
                "siren": "514027945",
                "adresse": "12, rue des adresses",
                "commune": "Y",
                "région": "76",
                "code_naf": "47.25Z",
                "effectif": {"total": 312, "tranche": "251:999"},
                "code_postal": "12345",
                "département": "12",
                "raison_sociale": "FooBar",
            },
            "indicateurs": {
                "promotions": {"note": 15, "résultat": 2.03},
                "augmentations": {"note": 20, "résultat": 1.03},
                "rémunérations": {"mode": "csp", "note": 38, "résultat": 1.28},
                "congés_maternité": {"note": 0, "résultat": 88},
                "hautes_rémunérations": {"note": 5, "résultat": 3},
            },
            "déclaration": {
                "index": 78,
                "points": 78,
                "année_indicateurs": 2019,
                "points_calculables": 100,
                "fin_période_référence": "2019-12-31",
                "publication": {"date": "2020-11-01", "modalités": "Affichage"},
            },
        },
    }
    assert data == expected
    # Just to make sure we have the same result on an existing declaration
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 204
    resp = await client.get("/declaration/514027945/2019")
    assert resp.status == 200
    data = json.loads(resp.body)
    assert "modified_at" in data
    del data["modified_at"]
    assert data["declared_at"]
    del data["declared_at"]
    del data["data"]["déclaration"]["date"]
    assert data == expected
    count = await db.table.fetchval(
        "SELECT COUNT(*) FROM archive WHERE siren=$1 AND year=$2;", "514027945", 2019
    )
    assert count == 2


async def test_draft_declaration_should_save_data(client, body):
    # Draft
    body["déclaration"]["brouillon"] = True
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 204
    resp = await client.get("/declaration/514027945/2019")
    assert resp.status == 200
    data = json.loads(resp.body)
    assert "modified_at" in data
    del data["modified_at"]
    assert not data.get("declared_at")
    assert "date" not in data["data"]["déclaration"]
    assert data["data"]["déclaration"]["brouillon"] is True
    del data["data"]["déclaration"]["brouillon"]
    assert not data.get("declared_at")
    del data["declared_at"]

    # With notes.
    expected = {
        "siren": "514027945",
        "year": 2019,
        "data": {
            "id": "1234",
            "source": "formulaire",
            "déclarant": {
                "nom": "Bar",
                "email": "foo@bar.org",
                "prénom": "Foo",
                "téléphone": "+33123456789",
            },
            "entreprise": {
                "siren": "514027945",
                "adresse": "12, rue des adresses",
                "commune": "Y",
                "région": "76",
                "code_naf": "47.25Z",
                "effectif": {"total": 312, "tranche": "251:999"},
                "code_postal": "12345",
                "département": "12",
                "raison_sociale": "FooBar",
            },
            "indicateurs": {
                "promotions": {"note": 15, "résultat": 2.03},
                "augmentations": {"note": 20, "résultat": 1.03},
                "rémunérations": {"mode": "csp", "note": 38, "résultat": 1.28},
                "congés_maternité": {"note": 0, "résultat": 88},
                "hautes_rémunérations": {"note": 5, "résultat": 3},
            },
            "déclaration": {
                "index": 78,
                "points": 78,
                "année_indicateurs": 2019,
                "points_calculables": 100,
                "fin_période_référence": "2019-12-31",
                "publication": {"date": "2020-11-01", "modalités": "Affichage"},
            },
        },
    }
    assert data == expected

    # Real
    del body["déclaration"]["brouillon"]
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 204
    resp = await client.get("/declaration/514027945/2019")
    assert resp.status == 200
    data = json.loads(resp.body)
    assert "modified_at" in data
    del data["modified_at"]
    assert data.get("declared_at")
    del data["declared_at"]
    assert data["data"]["déclaration"]["date"]
    del data["data"]["déclaration"]["date"]
    assert data == expected
    # Draft again
    body["déclaration"]["brouillon"] = True
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 204
    resp = await client.get("/declaration/514027945/2019")
    assert resp.status == 200
    data = json.loads(resp.body)
    assert "modified_at" in data
    del data["modified_at"]
    assert data.get("declared_at")
    del data["declared_at"]
    assert data["data"]["déclaration"]["date"]
    del data["data"]["déclaration"]["date"]
    assert data["data"]["déclaration"]["brouillon"] is True
    expected["data"]["déclaration"]["brouillon"] = True
    assert data == expected


async def test_basic_declaration_without_declarant_should_be_ok(client, body):
    del body["déclarant"]
    del body["déclaration"]["date"]
    body["déclaration"]["brouillon"] = True
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 204
    resp = await client.get("/declaration/514027945/2019")
    assert resp.status == 200
    data = json.loads(resp.body)
    assert "modified_at" in data
    assert data["data"]["déclarant"] == {"email": "foo@bar.org"}


async def test_owner_email_should_be_lower_cased(client, body):
    client.login("FoO@BAZ.baR")
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 204
    assert await db.ownership.emails("514027945") == ["foo@baz.bar"]


async def test_basic_declaration_should_remove_data_namespace_if_present(client, body):
    await client.put("/declaration/514027945/2019", body={"data": body})
    data = await db.declaration.get("514027945", "2019")
    del data["data"]["déclaration"]["date"]
    del body["déclaration"]["date"]
    assert set(data["data"].keys()) == {
        "indicateurs",
        "déclaration",
        "déclarant",
        "entreprise",
        "id",
        "source",
    }


async def test_entreprise_adresse_is_not_mandatory(client, body):
    del body["entreprise"]["adresse"]
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 204
    resp = await client.get("/declaration/514027945/2019")
    assert resp.status == 200
    data = json.loads(resp.body)
    assert "adresse" not in data["data"]["entreprise"]


async def test_cannot_edit_declaration_after_one_year(client, declaration, body):
    await declaration(
        "514027945",
        2019,
        "foo@bar.org",
        modified_at=utils.utcnow() - timedelta(days=366),
    )

    resp = await client.put("/declaration/514027945/2019", body)
    assert resp.status == 403
    assert json.loads(resp.body) == {"error": "Le délai de modification est écoulé."}


async def test_staff_can_edit_declaration_after_one_year(
    client, declaration, body, monkeypatch
):
    await declaration(
        "514027945",
        2019,
        "foo@bar.org",
        modified_at=utils.utcnow() - timedelta(days=366),
    )

    monkeypatch.setattr("egapro.config.STAFF", ["staff@email.com"])
    client.login("Staff@email.com")
    resp = await client.put("/declaration/514027945/2019", body)
    assert resp.status == 204


async def test_cannot_load_not_owned_declaration(client, declaration):
    await declaration("514027945", 2019, "foo@bar.baz")

    client.login("other@email.com")
    resp = await client.get("/declaration/514027945/2019")
    assert resp.status == 403
    assert json.loads(resp.body) == {
        "error": "Vous n'avez pas les droits nécessaires pour le siren 514027945"
    } or {
        "error": constants.ERROR_ENSURE_OWNER
    }


async def test_draft_declaration_is_not_owned(client, declaration, body):
    body["déclaration"]["brouillon"] = True
    client.login("foo@bar.baz")
    resp = await client.put("/declaration/514027945/2019", body)
    assert resp.status == 204
    client.login("other@email.com")
    del body["déclaration"]["brouillon"]
    resp = await client.put("/declaration/514027945/2019", body)
    assert resp.status == 204
    client.login("foo@bar.baz")
    resp = await client.put("/declaration/514027945/2019", body)
    assert resp.status == 403


async def test_staff_can_load_not_owned_declaration(client, monkeypatch, declaration):
    await declaration(siren="514027945", year=2019, owner="foo@bar.baz")
    monkeypatch.setattr("egapro.config.STAFF", ["staff@email.com"])
    client.login("Staff@email.com")
    resp = await client.get("/declaration/514027945/2019")
    assert resp.status == 200


async def test_staff_can_put_not_owned_declaration(
    client, monkeypatch, declaration, body
):
    await declaration(siren="514027945", year=2019, owner="foo@bar.baz")
    monkeypatch.setattr("egapro.config.STAFF", ["staff@email.com"])
    client.login("Staff@email.com")
    body["entreprise"]["raison_sociale"] = "New Name"
    resp = await client.put("/declaration/514027945/2019", body)
    assert resp.status == 204
    saved = await db.declaration.get(siren="514027945", year=2019)
    assert saved["declarant"] == "foo@bar.baz"
    assert saved["data"]["entreprise"]["raison_sociale"] == "New Name"
    # Staff should not be set as owner.
    assert await db.ownership.emails("514027945") == ["foo@bar.baz"]
    # Staff should still be noted as declarant in archive entry
    history = await db.archive.list("514027945", 2019)
    assert history[0]["by"] == "staff@email.com"


async def test_cannot_put_not_owned_declaration(client, monkeypatch):
    await db.ownership.put("514027945", "foo@bar.baz")
    client.login("other@email.com")
    resp = await client.put("/declaration/514027945/2019")
    assert resp.status == 403
    assert json.loads(resp.body) == {
        "error": "Vous n'avez pas les droits nécessaires pour le siren 514027945"
    }


async def test_owner_check_is_lower_case(client, body):
    client.login("FOo@baR.com")
    await client.put("/declaration/514027945/2019", body=body)
    client.login("FOo@BAR.COM")
    body["entreprise"]["raison_sociale"] = "newnew"
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 204
    record = await db.declaration.get("514027945", 2019)
    assert record["data"]["entreprise"]["raison_sociale"] == "newnew"


async def test_declaring_twice_should_not_duplicate(client, app, body):
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 204
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 204
    async with db.declaration.pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT data FROM declaration WHERE siren=$1 and year=$2",
            "514027945",
            2019,
        )
    assert len(rows) == 1


async def test_confirmed_declaration_should_send_email(client, monkeypatch, body):
    sender = mock.Mock()
    del body["id"]
    await db.ownership.put("514027945", "foo@bar.org")
    # Add another owner, that should be in the email recipients
    await db.ownership.put("514027945", "foo@foo.foo")
    body["déclaration"]["brouillon"] = True
    monkeypatch.setattr("egapro.emails.send", sender)
    monkeypatch.setattr("egapro.emails.REPLY_TO", {"12": "Foo Bar <foo@baz.fr>"})
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 204
    assert not sender.call_count
    del body["déclaration"]["brouillon"]
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 204
    assert sender.call_count == 1
    to, subject, txt, html = sender.call_args.args
    assert to == ["foo@bar.org", "foo@foo.foo"]
    assert "/index-egapro/declaration/?siren=514027945&year=2019" in txt
    assert "/index-egapro/declaration/?siren=514027945&year=2019" in html
    assert sender.call_args.kwargs["reply_to"] == "Foo Bar <foo@baz.fr>"
    assert sender.call_args.kwargs["attachment"][1] == "declaration_514027945_2020.pdf"


async def test_confirmed_declaration_should_send_email_for_legacy_call(
    client, monkeypatch, body
):
    sender = mock.Mock()
    id = "1234"
    body["source"] = "simulateur"
    body["déclaration"]["brouillon"] = True
    monkeypatch.setattr("egapro.emails.send", sender)
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 204
    assert not sender.call_count
    del body["déclaration"]["brouillon"]
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 204
    assert sender.call_count == 1
    to, subject, txt, html = sender.call_args.args
    assert to == ["foo@bar.org"]
    assert id in txt
    assert id in html


async def test_confirmed_declaration_should_raise_if_missing_entreprise_data(
    client, monkeypatch, body
):
    del body["entreprise"]["code_naf"]
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 422
    body = json.loads(resp.body)
    assert body == {"error": "Le champ entreprise.code_naf doit être défini"}


async def test_confirmed_declaration_should_raise_if_missing_fin_periode_reference(
    client, monkeypatch, body
):
    del body["déclaration"]["fin_période_référence"]
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 422
    body = json.loads(resp.body)
    assert body == {
        "error": "Le champ déclaration.fin_période_référence doit être défini"
    }


async def test_confirmed_declaration_should_raise_if_invalid_fin_periode_reference(
    client, monkeypatch, body
):
    body["déclaration"]["fin_période_référence"] = "0219-12-31"
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 422
    body = json.loads(resp.body)
    assert body == {
        "error": "L'année de la date de fin de période ne peut pas être différente de l'année au titre de laquelle les indicateurs sont calculés."
    }


async def test_with_unknown_siren_or_year(client):
    resp = await client.get("/declaration/514027945/2019")
    assert resp.status == 404


async def test_invalid_declaration_data_should_raise_on_put(client, monkeypatch):
    capture_message = mock.Mock()
    monkeypatch.setattr("sentry_sdk.capture_message", capture_message)
    resp = await client.put(
        "/declaration/514027945/2019",
        body={"foo": "bar"},
    )
    assert resp.status == 422
    assert json.loads(resp.body) == {
        "error": "data must contain "
        "['déclaration', 'déclarant', 'entreprise'] properties",
    }
    assert capture_message.called_once


async def test_uncaught_error_is_sent_to_sentry(client, monkeypatch, body):
    capture_exception = mock.Mock()
    monkeypatch.setattr("sentry_sdk.capture_exception", capture_exception)

    def mock_validate():
        raise AttributeError

    monkeypatch.setattr("egapro.schema.validate", mock_validate)
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 500
    assert capture_exception.called_once


async def test_must_set_augmentation_et_promotions_if_tranche_is_50_250(client, body):
    body["indicateurs"] = {
        "rémunérations": {"non_calculable": "egvi40pcet"},
        "congés_maternité": {"non_calculable": "absaugpdtcm"},
        "hautes_rémunérations": {
            "note": 0,
            "résultat": 1,
            "population_favorable": "femmes",
        },
        "augmentations_et_promotions": {},
    }
    body["entreprise"]["effectif"]["tranche"] = "50:250"
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 422
    assert (
        json.loads(resp.body)["error"]
        == "L'indicateur indicateurs.augmentations_et_promotions doit être défini pour la tranche 50 à 250"
    )


async def test_cannot_set_augmentations_if_tranche_is_not_50_250(client, body):
    body["indicateurs"] = {
        "rémunérations": {"mode": "csp", "résultat": 5.28},
        "augmentations": {"résultat": 5.03},
        "augmentations_et_promotions": {
            "résultat": 4.73,
            "résultat_nombre_salariés": 5.5,
        },
        "promotions": {"résultat": 2.03},
        "congés_maternité": {"résultat": 88},
        "hautes_rémunérations": {"résultat": 3},
    }
    body["déclaration"]["mesures_correctives"] = "mmo"
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 422
    assert (
        json.loads(resp.body)["error"]
        == "L'indicateur indicateurs.augmentations_et_promotions ne peut être défini que pour la tranche 50 à 250"
    )


async def test_population_favorable_must_be_empty_if_resultat_is_zero(client, body):
    body["indicateurs"] = {
        "rémunérations": {
            "mode": "csp",
            "résultat": 0,
            "population_favorable": "femmes",
        },
        "augmentations": {"résultat": 5.03},
        "promotions": {"résultat": 2.03},
        "congés_maternité": {"résultat": 88},
        "hautes_rémunérations": {"résultat": 3},
    }
    body["déclaration"]["mesures_correctives"] = "mmo"
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 422
    assert (
        json.loads(resp.body)["error"]
        == "indicateurs.rémunérations.population_favorable doit être vide si le résultat est 0"
    )


async def test_population_favorable_must_be_empty_if_resultat_is_0_on2et3(client, body):
    body["entreprise"]["effectif"]["tranche"] = "50:250"
    body["indicateurs"] = {
        "augmentations_et_promotions": {
            "résultat": 0,
            "résultat_nombre_salariés": 0,
            "population_favorable": "femmes",
        },
    }
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 422
    assert (
        json.loads(resp.body)["error"]
        == "indicateurs.augmentations_et_promotions.population_favorable ne doit pas être défini si résultat=0 et résultat_nombre_salariés=0"
    )


async def test_population_favorable_must_be_empty_if_resultat_is_five(client, body):
    body["indicateurs"] = {
        "rémunérations": {
            "mode": "csp",
            "résultat": 20,
        },
        "augmentations": {"résultat": 5.03},
        "promotions": {"résultat": 2.03},
        "congés_maternité": {"résultat": 88},
        "hautes_rémunérations": {"résultat": 5, "population_favorable": "femmes"},
    }
    body["déclaration"]["mesures_correctives"] = "mmo"
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 422
    assert (
        json.loads(resp.body)["error"]
        == "indicateurs.hautes_rémunérations.population_favorable ne doit pas être défini si résultat vaut 5"
    )


async def test_mesures_correctives_must_be_set_if_index_below_75(client, body):
    body["indicateurs"] = {
        "rémunérations": {
            "mode": "csp",
            "résultat": 10,
            "population_favorable": "femmes",
        },
        "augmentations": {"résultat": 15.03},
        "promotions": {"résultat": 15.03},
        "congés_maternité": {"résultat": 88},
        "hautes_rémunérations": {"résultat": 3},
    }
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 422
    assert (
        json.loads(resp.body)["error"]
        == "Les mesures correctives doivent être définies pour un index inférieur à 75"
    )


async def test_mesures_correctives_must_not_be_set_if_index_above_75(client, body):
    body["indicateurs"] = {
        "rémunérations": {
            "mode": "csp",
            "résultat": 0,
        },
        "augmentations": {"résultat": 1.03},
        "promotions": {"résultat": 2.03},
        "congés_maternité": {"résultat": 88},
        "hautes_rémunérations": {"résultat": 1},
    }
    body["déclaration"]["mesures_correctives"] = "mmo"
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 422
    assert (
        json.loads(resp.body)["error"]
        == "Les mesures correctives ne doivent pas être définies pour un index de 75 ou plus"
    )


async def test_cannot_set_promotions_if_tranche_is_50_250(client, body):
    body["entreprise"]["effectif"]["tranche"] = "50:250"
    body["indicateurs"] = {
        "rémunérations": {"mode": "csp", "résultat": 5.28},
        "promotions": {"résultat": 2.03},
        "augmentations": {"résultat": 5.03},
        "augmentations_et_promotions": {
            "résultat": 4.73,
            "résultat_nombre_salariés": 5.5,
        },
        "congés_maternité": {"résultat": 88},
        "hautes_rémunérations": {"résultat": 3},
    }
    body["déclaration"]["mesures_correctives"] = "mmo"
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 422
    assert (
        json.loads(resp.body)["error"]
        == "L'indicateur indicateurs.promotions ne doit pas être défini pour la tranche 50 à 250"
    )


async def test_put_declaration_should_compute_notes(client, body):
    body["indicateurs"] = {
        "rémunérations": {"mode": "csp", "résultat": 5.28},
        "augmentations": {"résultat": 5.03},
        "augmentations_et_promotions": {},
        "promotions": {"résultat": 2.03},
        "congés_maternité": {"résultat": 88},
        "hautes_rémunérations": {"résultat": 3},
    }
    body["déclaration"]["mesures_correctives"] = "mmo"
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 204
    data = (await db.declaration.get("514027945", 2019))["data"]
    assert data["indicateurs"]["rémunérations"]["note"] == 34
    assert data["indicateurs"]["augmentations"]["note"] == 10
    assert data["indicateurs"]["promotions"]["note"] == 15
    assert data["indicateurs"]["congés_maternité"]["note"] == 0
    assert data["indicateurs"]["hautes_rémunérations"]["note"] == 5
    assert data["déclaration"]["points"] == 64
    assert data["déclaration"]["points_calculables"] == 100
    assert data["déclaration"]["index"] == 64


async def test_put_declaration_should_compute_notes_for_50_250(client, body):
    body["entreprise"]["effectif"]["tranche"] = "50:250"
    body["indicateurs"] = {
        "rémunérations": {"mode": "csp", "résultat": 5.28},
        "augmentations": {},
        "augmentations_et_promotions": {
            "résultat": 4.73,
            "résultat_nombre_salariés": 5.5,
        },
        "promotions": {},
        "congés_maternité": {"résultat": 88},
        "hautes_rémunérations": {"résultat": 3},
    }
    body["déclaration"]["mesures_correctives"] = "mmo"
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 204
    data = (await db.declaration.get("514027945", 2019))["data"]
    assert data["indicateurs"]["rémunérations"]["note"] == 34
    assert (
        data["indicateurs"]["augmentations_et_promotions"]["note_nombre_salariés"] == 15
    )
    assert (
        data["indicateurs"]["augmentations_et_promotions"]["note_en_pourcentage"] == 25
    )
    assert data["indicateurs"]["augmentations_et_promotions"]["note"] == 25
    assert data["indicateurs"]["congés_maternité"]["note"] == 0
    assert data["indicateurs"]["hautes_rémunérations"]["note"] == 5
    assert data["déclaration"]["points"] == 64
    assert data["déclaration"]["points_calculables"] == 100
    assert data["déclaration"]["index"] == 64


async def test_date_consultation_cse_must_be_empty_if_mode_is_csp(client, body):
    body["indicateurs"] = {
        "rémunérations": {
            "mode": "csp",
            "date_consultation_cse": "2020-01-18",
            "résultat": 10,
        },
        "promotions": {"résultat": 1},
        "augmentations": {"résultat": 1},
    }
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 422
    assert json.loads(resp.body)["error"] == (
        "indicateurs.rémunérations.date_consultation_cse ne doit pas être défini si "
        "indicateurs.rémunérations.mode vaut 'csp'"
    )


async def test_effectif_total_must_be_integer(client, body):
    body["entreprise"]["effectif"]["total"] = 343.21
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 422
    body = json.loads(resp.body)
    assert body == {"error": "data.entreprise.effectif.total must be integer"}


async def test_basic_declaration_with_ues(client, body):
    ues = {
        "nom": "Nom UES",
        "entreprises": [{"siren": "123456782", "raison_sociale": "Foobarbaz"}],
    }
    body["entreprise"]["ues"] = ues
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 204
    resp = await client.get("/declaration/514027945/2019")
    assert resp.status == 200
    data = json.loads(resp.body)
    assert "modified_at" in data
    assert data["data"]["entreprise"]["ues"] == ues


async def test_declaration_without_ues_should_not_have_name(client, body):
    body["entreprise"]["ues"] = {
        "nom": "Nom UES",
        "entreprises": [],
    }
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 422
    assert json.loads(resp.body) == {
        "error": "Une entreprise ne doit pas avoir de nom d'UES"
    }


async def test_basic_declaration_with_ues_and_invalid_siren(client, body):
    body["entreprise"]["ues"] = {
        "nom": "Nom UES",
        "entreprises": [{"siren": "invalid", "raison_sociale": "Foobarbaz"}],
    }
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 422
    assert json.loads(resp.body) == {"error": "Invalid siren: invalid"}


async def test_basic_declaration_with_ues_and_missing_siren(client, body):
    body["entreprise"]["ues"] = {
        "nom": "Nom UES",
        "entreprises": [{"raison_sociale": "Foobarbaz"}],
    }
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 422
    assert json.loads(resp.body) == {
        "error": "data.entreprise.ues.entreprises[0] must contain ['raison_sociale', 'siren'] properties"
    }


async def test_declaration_with_ues_and_duplicate_siren(client, body):
    body["entreprise"]["ues"] = {
        "nom": "Nom UES",
        "entreprises": [
            {"siren": "123456782", "raison_sociale": "Foobarbaz"},
            {"siren": "987654321", "raison_sociale": "Barbar"},
            {"siren": "123456782", "raison_sociale": "Bazbaz"},
        ],
    }
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 422
    assert json.loads(resp.body) == {"error": "Valeur de siren en double: 123456782"}


async def test_declaration_with_ues_and_duplicate_siren_from_entreprise(client, body):
    body["entreprise"]["ues"] = {
        "nom": "Nom UES",
        "entreprises": [
            {"siren": body["entreprise"]["siren"], "raison_sociale": "Foobarbaz"},
            {"siren": "987654321", "raison_sociale": "Barbar"},
            {"siren": "123456782", "raison_sociale": "Bazbaz"},
        ],
    }
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 422
    assert json.loads(resp.body) == {
        "error": "L'entreprise déclarante ne doit pas être dupliquée dans les entreprises de l'UES"
    }


async def test_basic_declaration_with_niveau_branche(client, body):
    body["indicateurs"]["rémunérations"] = {
        "mode": "niveau_branche",
        "date_consultation_cse": "2020-12-12",
        "résultat": 5,
    }
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 204


async def test_basic_declaration_with_wrong_date_consultation_cse_format(client, body):
    body["indicateurs"]["rémunérations"] = {
        "mode": "niveau_branche",
        "date_consultation_cse": "12/12/2020",
        "résultat": 35,
    }
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 422
    assert json.loads(resp.body) == {
        "error": "data.indicateurs.rémunérations.date_consultation_cse must be date"
    }


async def test_basic_declaration_with_niveau_branche_without_cse(client, body):
    body["indicateurs"]["rémunérations"] = {"mode": "niveau_branche", "résultat": 5}
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 204


async def test_basic_declaration_without_resultat(client, body):
    body["indicateurs"]["augmentations"] = {"catégories": [1, 2, 3, 4]}
    body["déclaration"]["mesures_correctives"] = "me"
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 422
    assert json.loads(resp.body) == {
        "error": "indicateurs.augmentations.résultat doit être défini si l'indicateur est calculable"
    }


async def test_remunerations_declaration_without_resultat(client, body):
    body["indicateurs"]["rémunérations"] = {
        "mode": "csp",
        "population_favorable": "femmes",
    }
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 422
    assert json.loads(resp.body) == {
        "error": "indicateurs.rémunérations.résultat doit être défini si l'indicateur est calculable"
    }


async def test_put_declaration_with_invalid_region(client, body):
    body["entreprise"]["région"] = "88"
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 422


async def test_put_declaration_without_source(client, body):
    del body["source"]
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 204


async def test_get_empty_entreprise_should_sync_with_api_entreprises(
    client, declaration, monkeypatch
):
    async def mocked(siren):
        return {
            "adresse": "2 RUE FOOBAR",
            "code_naf": "62.02A",
            "code_postal": "75002",
            "commune": "PARIS 2",
            "département": "75",
            "raison_sociale": "FOOBAR",
            "région": "11",
        }

    monkeypatch.setattr("egapro.helpers.get_entreprise_details", mocked)

    await db.declaration.put(
        "123456782", "2020", "foo@bar.org", {"déclarant": {"nom": "Mr Babar"}}
    )
    record = await db.declaration.get("123456782", 2020)
    assert not record.data["entreprise"].get("raison_sociale")
    resp = await client.get("/declaration/123456782/2020")
    body = json.loads(resp.body)
    assert body["data"]["entreprise"]["raison_sociale"] == "FOOBAR"
    assert body["data"]["entreprise"]["commune"] == "PARIS 2"


async def test_get_filled_entreprise_should_not_sync_with_api_entreprises(
    client, declaration, monkeypatch
):
    async def mocked(siren):
        raise ValueError("Should not be called")

    monkeypatch.setattr("egapro.helpers.get_entreprise_details", mocked)

    await db.declaration.put(
        "123456782", "2020", "foo@bar.org", {"entreprise": {"raison_sociale": "foobar"}}
    )
    record = await db.declaration.get("123456782", 2020)
    assert record.data["entreprise"].get("raison_sociale") == "foobar"
    resp = await client.get("/declaration/123456782/2020")
    body = json.loads(resp.body)
    assert body["data"]["entreprise"]["raison_sociale"] == "foobar"


async def test_publication_is_required_if_calculable(client, body):
    del body["déclaration"]["publication"]
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 422
    assert json.loads(resp.body) == {
        "error": "La date de publication doit être définie"
    }


async def test_publication_modalités_or_url_is_required_if_calculable(client, body):
    del body["déclaration"]["publication"]["modalités"]
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 422
    assert json.loads(resp.body) == {
        "error": "Les modalités de publication ou le site Internet doit être défini"
    }


async def test_publication_modalités_or_url_is_required_for_2020(client, body):
    body["déclaration"]["année_indicateurs"] = 2019
    # Non calculable
    body["indicateurs"]["rémunérations"] = {"non_calculable": "egvi40pcet"}
    body["indicateurs"]["congés_maternité"] = {"non_calculable": "absaugpdtcm"}
    # Remove modalités
    del body["déclaration"]["publication"]["modalités"]
    # OK for 2019
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 204
    # NOK for 2019
    body["déclaration"]["année_indicateurs"] = 2020
    resp = await client.put("/declaration/514027945/2020", body=body)
    assert resp.status == 422
    assert json.loads(resp.body) == {
        "error": "Les modalités de publication ou le site Internet doit être défini"
    }


async def test_entreprise_plan_relance_is_required_for_2021(client, body, monkeypatch):
    monkeypatch.setattr("egapro.constants.YEARS", [2018, 2019, 2020, 2021])
    schema.init()
    # OK for 2020
    resp = await client.put("/declaration/514027945/2020", body=body)
    assert resp.status == 204
    # OK for 2021 in draft mode
    body["déclaration"]["année_indicateurs"] = 2021
    body["déclaration"]["fin_période_référence"] = "2021-12-31"
    body["déclaration"]["brouillon"] = True
    resp = await client.put("/declaration/514027945/2021", body=body)
    assert resp.status == 204
    # NOK for 2021
    del body["déclaration"]["brouillon"]
    resp = await client.put("/declaration/514027945/2021", body=body)
    assert resp.status == 422
    assert json.loads(resp.body) == {
        "error": "data.entreprise.plan_relance doit être défini"
    }
    body["entreprise"]["plan_relance"] = "wrong"
    resp = await client.put("/declaration/514027945/2021", body=body)
    assert resp.status == 422
    assert json.loads(resp.body) == {
        "error": "data.entreprise.plan_relance must be boolean"
    }
    body["entreprise"]["plan_relance"] = True
    resp = await client.put("/declaration/514027945/2021", body=body)
    assert resp.status == 204
    body["entreprise"]["plan_relance"] = False
    resp = await client.put("/declaration/514027945/2021", body=body)
    assert resp.status == 204


async def test_non_staff_cannot_delete(client, declaration):
    client.login("foo@bar.org")
    await declaration("514027945", 2019, "foo@bar.org")
    resp = await client.delete("/declaration/514027945/2019")
    assert resp.status == 403
    assert json.loads(resp.body) == {"error": "Vous n'avez pas l'autorisation"}


async def test_staff_can_delete(client, declaration, monkeypatch):
    monkeypatch.setattr("egapro.config.STAFF", ["staff@email.com"])
    client.login("Staff@email.com")
    await declaration("514027945", 2019, "foo@bar.org")
    resp = await client.delete("/declaration/514027945/2019")
    assert resp.status == 204


async def test_without_periode_suffisante(client, body):
    body["déclaration"]["période_suffisante"] = False
    del body["indicateurs"]
    del body["déclaration"]["fin_période_référence"]
    del body["entreprise"]["effectif"]["total"]
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 204


async def test_without_periode_suffisante_but_indicateurs(client, body):
    body["déclaration"]["période_suffisante"] = False
    resp = await client.put("/declaration/514027945/2019", body=body)
    assert resp.status == 422
    assert json.loads(resp.body) == {
        "error": "La période de référence ne permet pas de définir des indicateurs"
    }


async def test_declaration_with_foreign_company(client, body):
    body["entreprise"] = {
            "code_pays": "BE",
            "code_naf": "47.25Z",
            "siren": "514027945",
        }
    resp = await client.put("/declaration/514027945/2019", body=body)
    print(resp.body)
    assert resp.status == 204
