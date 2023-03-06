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
        "source": "api",
        "déclaration": {
            "date": "2020-11-04T10:37:06+00:00",
            "année_indicateurs": 2021,
            "fin_période_référence": "2021-12-31",
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
            "représentation_équilibrée": {
                "pourcentage_femmes_membres": 40,
                "pourcentage_hommes_membres": 60,
                "pourcentage_femmes_cadres": 70,
                "pourcentage_hommes_cadres": 30,
                "motif_non_calculabilité_cadres": "aucun_cadre_dirigeant",
                "motif_non_calculabilité_membres": "aucune_instance_dirigeante"
            }
        }
    }


async def test_cannot_put_representation_without_token(client, body):
    client.logout()
    resp = await client.put("/representation-equilibree/514027945/2021", body=body)
    assert resp.status == 401


async def test_cannot_get_representation_without_token(client):
    client.logout()
    resp = await client.get("/representation-equilibree/514027945/2021")
    assert resp.status == 401


async def test_invalid_siren_should_raise(client, body):
    resp = await client.put("/representation-equilibree/111111111/2021", body=body)
    assert resp.status == 422
    assert json.loads(resp.body) == {"error": "Numéro SIREN invalide: 111111111"}


async def test_wrong_year_should_raise(client, body):
    resp = await client.put("/representation-equilibree/514027945/2017", body=body)
    assert resp.status == 422
    assert json.loads(resp.body) == {
        "error": "Il est possible de déclarer seulement pour les années " + ", ".join(str(x) for x in constants.YEARS_REPEQ)
    }


async def test_invalid_year_should_raise(client, body):
    resp = await client.put("/representation-equilibree/514027945/undefined", body=body)
    assert resp.status == 404
    assert json.loads(resp.body) == {
        "error": "/representation-equilibree/514027945/undefined"
    }


async def test_put_representation_with_empty_body(client):
    resp = await client.put("/representation-equilibree/514027945/2021", body="")
    assert resp.status == 400


async def test_put_representation_with_invalid_json(client):
    resp = await client.put("/representation-equilibree/514027945/2021", body="<foo>bar</foo>")
    assert resp.status == 400


async def test_put_representation_with_empty_json(client):
    resp = await client.put("/representation-equilibree/514027945/2021", body="{}")
    assert resp.status == 422


async def test_put_representation_with_json_list(client):
    resp = await client.put("/representation-equilibree/514027945/2021", body="[{}]")
    assert resp.status == 400
    assert json.loads(resp.body) == {"error": "`data` doit être de type objet JSON"}


async def test_put_representation_with_json_list_and_namespace(client):
    resp = await client.put("/representation-equilibree/514027945/2021", body='{"data": []}')
    assert resp.status == 422


async def test_cannot_put_in_readonly(client, representation_equilibree, monkeypatch, body):
    monkeypatch.setattr("egapro.config.READONLY", True)
    await representation_equilibree(
        "514027945",
        2021,
        "foo@bar.org",
        modified_at=utils.utcnow() - timedelta(days=366),
    )
    resp = await client.get("/representation-equilibree/514027945/2021")
    assert resp.status == 200
    resp = await client.put(
        "/representation-equilibree/514027945/2021", body=body, headers={"X-REAL-IP": "1.1.1.1"}
    )
    assert resp.status == 405
    assert json.loads(resp.body) == {"error": "Ooops, le site est en maintenance"}


async def test_basic_representation_should_save_data(client, body, monkeypatch):
    logger = mock.Mock()
    monkeypatch.setattr("egapro.loggers.logger.info", logger)
    resp = await client.put(
        "/representation-equilibree/514027945/2021", body=body, headers={"X-REAL-IP": "1.1.1.1"}
    )
    assert resp.status == 204
    logger.assert_called_with("514027945/2021 BY foo@bar.org FROM 1.1.1.1")
    resp = await client.get("/representation-equilibree/514027945/2021")
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
        "year": 2021,
        "data": {
            "id": "1234",
            "source": "api",
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
		        "représentation_équilibrée": {
			        "pourcentage_femmes_membres": 40,
                    "pourcentage_hommes_membres": 60,
                    "pourcentage_femmes_cadres": 70,
                    "pourcentage_hommes_cadres": 30,
                    "motif_non_calculabilité_cadres": "aucun_cadre_dirigeant",
                    "motif_non_calculabilité_membres": "aucune_instance_dirigeante"
		        }
            },
            "déclaration": {
                "année_indicateurs": 2021,
                "fin_période_référence": "2021-12-31",
                "publication": {"date": "2020-11-01", "modalités": "Affichage"},
            },
        },
    }
    assert data == expected
    # Just to make sure we have the same result on an existing representation
    resp = await client.put("/representation-equilibree/514027945/2021", body=body)
    assert resp.status == 204
    resp = await client.get("/representation-equilibree/514027945/2021")
    assert resp.status == 200
    data = json.loads(resp.body)
    assert "modified_at" in data
    del data["modified_at"]
    assert data["declared_at"]
    del data["declared_at"]
    del data["data"]["déclaration"]["date"]
    assert data == expected


async def test_basic_representation_should_remove_data_namespace_if_present(client, body):
    await client.put("/representation-equilibree/514027945/2021", body={"data": body})
    data = await db.representation_equilibree.get("514027945", "2021")
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
    resp = await client.put("/representation-equilibree/514027945/2021", body=body)
    assert resp.status == 204
    resp = await client.get("/representation-equilibree/514027945/2021")
    assert resp.status == 200
    data = json.loads(resp.body)
    assert "adresse" not in data["data"]["entreprise"]


async def test_cannot_load_not_owned_representation(client, representation_equilibree):
    await representation_equilibree("514027945", 2021, "foo@bar.baz")

    client.login("other@email.com")
    resp = await client.get("/representation-equilibree/514027945/2021")
    assert resp.status == 403
    assert json.loads(resp.body) == {
        "error": "Vous n'avez pas les droits nécessaires pour le siren 514027945"
    } or {
        "error": constants.ERROR_ENSURE_OWNER
    }


async def test_staff_can_load_not_owned_representation(client, monkeypatch, representation_equilibree):
    await representation_equilibree(siren="514027945", year=2021, owner="foo@bar.baz")
    monkeypatch.setattr("egapro.config.STAFF", ["staff@email.com"])
    client.login("Staff@email.com")
    resp = await client.get("/representation-equilibree/514027945/2021")
    assert resp.status == 200


async def test_staff_can_put_not_owned_representation(
    client, monkeypatch, representation_equilibree, body
):
    await representation_equilibree(siren="514027945", year=2021, owner="foo@bar.baz")
    monkeypatch.setattr("egapro.config.STAFF", ["staff@email.com"])
    client.login("Staff@email.com")
    body["entreprise"]["raison_sociale"] = "New Name"
    resp = await client.put("/representation-equilibree/514027945/2021", body)
    assert resp.status == 204
    saved = await db.representation_equilibree.get(siren="514027945", year=2021)
    assert saved["data"]["entreprise"]["raison_sociale"] == "New Name"
    # Staff should not be set as owner.
    assert await db.ownership.emails("514027945") == ["foo@bar.baz"]


async def test_cannot_put_not_owned_representation(client, monkeypatch):
    await db.ownership.put("514027945", "foo@bar.baz")
    client.login("other@email.com")
    resp = await client.put("/representation-equilibree/514027945/2021")
    assert resp.status == 403
    assert json.loads(resp.body) == {
        "error": "Vous n'avez pas les droits nécessaires pour le siren 514027945"
    }


async def test_owner_check_is_lower_case(client, body):
    client.login("FOo@baR.com")
    await client.put("/representation-equilibree/514027945/2021", body=body)
    client.login("FOo@BAR.COM")
    body["entreprise"]["raison_sociale"] = "newnew"
    resp = await client.put("/representation-equilibree/514027945/2021", body=body)
    assert resp.status == 204
    record = await db.representation_equilibree.get("514027945", 2021)
    assert record["data"]["entreprise"]["raison_sociale"] == "newnew"


async def test_declaring_twice_should_not_duplicate(client, app, body):
    resp = await client.put("/representation-equilibree/514027945/2021", body=body)
    assert resp.status == 204
    resp = await client.put("/representation-equilibree/514027945/2021", body=body)
    assert resp.status == 204
    async with db.representation_equilibree.pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT data FROM representation_equilibree WHERE siren=$1 and year=$2",
            "514027945",
            2021,
        )
    assert len(rows) == 1


async def test_confirmed_representation_should_send_email(client, monkeypatch, body):
    sender = mock.Mock()
    del body["id"]
    await db.ownership.put("514027945", "foo@bar.org")
    # Add another owner, that should be in the email recipients
    await db.ownership.put("514027945", "foo@foo.foo")
    monkeypatch.setattr("egapro.emails.send", sender)
    monkeypatch.setattr("egapro.emails.REPLY_TO", {"12": "Foo Bar <foo@baz.fr>"})
    resp = await client.put("/representation-equilibree/514027945/2021", body=body)
    assert resp.status == 204
    assert sender.call_count == 1
    to, subject, txt, html = sender.call_args.args
    assert to == ["foo@bar.org", "foo@foo.foo"]
    assert sender.call_args.kwargs["reply_to"] == "Foo Bar <foo@baz.fr>"


async def test_confirmed_representation_should_send_email_for_legacy_call(
    client, monkeypatch, body
):
    sender = mock.Mock()
    id = "1234"
    body["source"] = "simulateur"
    body["déclaration"]["brouillon"] = True
    monkeypatch.setattr("egapro.emails.send", sender)
    resp = await client.put("/representation-equilibree/514027945/2021", body=body)
    assert resp.status == 204
    assert sender.call_count == 1
    to, subject, txt, html = sender.call_args.args
    assert to == ["foo@bar.org"]
    assert id in txt
    assert id in html


async def test_confirmed_representation_should_raise_if_missing_entreprise_data(
    client, monkeypatch, body
):
    del body["entreprise"]["code_naf"]
    resp = await client.put("/representation-equilibree/514027945/2021", body=body)
    assert resp.status == 422
    body = json.loads(resp.body)
    assert body == {"error": "Le champ entreprise.code_naf doit être défini"}


async def test_with_unknown_siren_or_year(client):
    resp = await client.get("/representation-equilibree/514027946/2021")
    assert resp.status == 404


async def test_invalid_representation_data_should_raise_on_put(client, monkeypatch):
    capture_message = mock.Mock()
    monkeypatch.setattr("sentry_sdk.capture_message", capture_message)
    resp = await client.put(
        "/representation-equilibree/514027945/2021",
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
    resp = await client.put("/representation-equilibree/514027945/2021", body=body)
    assert resp.status == 500
    assert capture_exception.called_once


async def test_percentage_must_be_100(client, body):
    body["indicateurs"]["représentation_équilibrée"]["pourcentage_femmes_cadres"] = 41
    body["indicateurs"]["représentation_équilibrée"]["pourcentage_hommes_cadres"] = 60

    resp = await client.put("/representation-equilibree/514027945/2021", body=body)
    assert resp.status == 422
    body = json.loads(resp.body)
    assert body == {"error": "Les pourcentages doivent additionner à 100"}


async def test_put_representation_with_invalid_region(client, body):
    body["entreprise"]["région"] = "88"
    resp = await client.put("/representation-equilibree/514027945/2021", body=body)
    assert resp.status == 422


async def test_put_representation_without_source(client, body):
    del body["source"]
    resp = await client.put("/representation-equilibree/514027945/2021", body=body)
    assert resp.status == 204


async def test_non_staff_cannot_delete(client, representation_equilibree):
    client.login("foo@bar.org")
    await representation_equilibree("514027945", 2021, "foo@bar.org")
    resp = await client.delete("/representation-equilibree/514027945/2021")
    assert resp.status == 403 or 405
    assert json.loads(resp.body) == {"error": "Vous n'avez pas l'autorisation"} or {"error": "Method Not Allowed"}


async def test_staff_can_delete(client, representation_equilibree, monkeypatch):
    monkeypatch.setattr("egapro.config.STAFF", ["staff@email.com"])
    client.login("Staff@email.com")
    await representation_equilibree("514027945", 2021, "foo@bar.org")
    resp = await client.delete("/representation-equilibree/514027945/2021")
    assert resp.status == 204 or 405
