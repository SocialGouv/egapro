import json
from unittest import mock

import pytest
from egapro import db

pytestmark = pytest.mark.asyncio


# Minimal simulation body
@pytest.fixture
def body():
    return {
        "id": "1234",
    }


async def test_start_new_simulation(client, body):
    resp = await client.post("/simulation", body=body)
    assert resp.status == 200
    data = json.loads(resp.body)
    assert "id" in data
    assert await db.simulation.get(data["id"])


async def test_get_simulation(client):
    uid = await db.simulation.create({"foo": "bar"})
    resp = await client.get(f"/simulation/{uid}")
    assert resp.status == 200
    data = json.loads(resp.body)
    assert "modified_at" in data
    del data["modified_at"]
    assert data == {
        "data": {"foo": "bar"},
        "id": uid,
    }


async def test_get_simulation_with_unknown_id(client):
    resp = await client.get("/simulation/12345678-1234-5678-9012-123456789012")
    assert resp.status == 404


async def test_get_simulation_with_invalid_uuid(client):
    resp = await client.get("/simulation/foo")
    assert resp.status == 400


async def test_basic_simulation_should_save_data(client):
    resp = await client.put(
        "/simulation/12345678-1234-5678-9012-123456789012",
        body={
            "data": {
                "informations": {"anneeDeclaration": 2018},
                "informationsDeclarant": {"email": "foo@bar.org"},
                "informationsEntreprise": {"siren": "123456782"},
            }
        },
    )
    assert resp.status == 200
    data = json.loads(resp.body)
    assert "modified_at" in data
    del data["modified_at"]
    assert data == {
        "data": {
            "informations": {"anneeDeclaration": 2018},
            "informationsDeclarant": {"email": "foo@bar.org"},
            "informationsEntreprise": {"siren": "123456782"},
        },
        "id": "12345678-1234-5678-9012-123456789012",
    }


async def test_empty_simulation_should_save_data(client):
    posted_data = {
        "id": "03a50ee2-4138-11eb-b1b6-38f9d356f022",
        "data": {
            "informations": {
                "formValidated": "None",
                "nomEntreprise": "",
                "trancheEffectifs": "50 à 250",
                "debutPeriodeReference": "",
                "finPeriodeReference": "",
                "anneeDeclaration": 2018,
            },
            "effectif": {
                "formValidated": "None",
                "nombreSalaries": [
                    {
                        "categorieSocioPro": 0,
                        "tranchesAges": [
                            {"trancheAge": 0},
                            {"trancheAge": 1},
                            {"trancheAge": 2},
                            {"trancheAge": 3},
                        ],
                    },
                    {
                        "categorieSocioPro": 1,
                        "tranchesAges": [
                            {"trancheAge": 0},
                            {"trancheAge": 1},
                            {"trancheAge": 2},
                            {"trancheAge": 3},
                        ],
                    },
                    {
                        "categorieSocioPro": 2,
                        "tranchesAges": [
                            {"trancheAge": 0},
                            {"trancheAge": 1},
                            {"trancheAge": 2},
                            {"trancheAge": 3},
                        ],
                    },
                    {
                        "categorieSocioPro": 3,
                        "tranchesAges": [
                            {"trancheAge": 0},
                            {"trancheAge": 1},
                            {"trancheAge": 2},
                            {"trancheAge": 3},
                        ],
                    },
                ],
            },
            "indicateurUn": {
                "formValidated": "None",
                "csp": True,
                "coef": False,
                "autre": False,
                "remunerationAnnuelle": [
                    {
                        "categorieSocioPro": 0,
                        "tranchesAges": [
                            {"trancheAge": 0},
                            {"trancheAge": 1},
                            {"trancheAge": 2},
                            {"trancheAge": 3},
                        ],
                    },
                    {
                        "categorieSocioPro": 1,
                        "tranchesAges": [
                            {"trancheAge": 0},
                            {"trancheAge": 1},
                            {"trancheAge": 2},
                            {"trancheAge": 3},
                        ],
                    },
                    {
                        "categorieSocioPro": 2,
                        "tranchesAges": [
                            {"trancheAge": 0},
                            {"trancheAge": 1},
                            {"trancheAge": 2},
                            {"trancheAge": 3},
                        ],
                    },
                    {
                        "categorieSocioPro": 3,
                        "tranchesAges": [
                            {"trancheAge": 0},
                            {"trancheAge": 1},
                            {"trancheAge": 2},
                            {"trancheAge": 3},
                        ],
                    },
                ],
                "coefficientGroupFormValidated": "None",
                "coefficientEffectifFormValidated": "None",
                "coefficient": [],
            },
            "indicateurDeux": {
                "formValidated": "None",
                "presenceAugmentation": True,
                "tauxAugmentation": [
                    {"categorieSocioPro": 0},
                    {"categorieSocioPro": 1},
                    {"categorieSocioPro": 2},
                    {"categorieSocioPro": 3},
                ],
            },
            "indicateurTrois": {
                "formValidated": "None",
                "presencePromotion": True,
                "tauxPromotion": [
                    {"categorieSocioPro": 0},
                    {"categorieSocioPro": 1},
                    {"categorieSocioPro": 2},
                    {"categorieSocioPro": 3},
                ],
            },
            "indicateurDeuxTrois": {
                "formValidated": "None",
                "presenceAugmentationPromotion": True,
                "periodeDeclaration": "unePeriodeReference",
            },
            "indicateurQuatre": {"formValidated": "None", "presenceCongeMat": True},
            "indicateurCinq": {"formValidated": "None"},
            "informationsEntreprise": {
                "formValidated": "None",
                "nomEntreprise": "",
                "siren": "",
                "codeNaf": "",
                "region": "",
                "departement": "",
                "adresse": "",
                "codePostal": "",
                "commune": "",
                "structure": "Entreprise",
                "nomUES": "",
                "entreprisesUES": [],
            },
            "informationsDeclarant": {
                "formValidated": "None",
                "nom": "",
                "prenom": "",
                "tel": "",
                "email": "",
                "acceptationCGU": False,
            },
            "declaration": {
                "formValidated": "None",
                "mesuresCorrection": "",
                "dateConsultationCSE": "",
                "datePublication": "",
                "lienPublication": "",
                "dateDeclaration": "",
                "totalPoint": 0,
                "totalPointCalculable": 0,
            },
        },
    }
    resp = await client.put(
        "/simulation/03a50ee2-4138-11eb-b1b6-38f9d356f022",
        body=posted_data,
    )
    assert resp.status == 200
    data = json.loads(resp.body)
    assert "modified_at" in data
    del data["modified_at"]
    assert "id" in data["data"]
    del data["data"]["id"]
    assert data == posted_data


async def test_start_new_simulation_never_sends_email(client, monkeypatch):
    # Anonymous endpoint: it must not be usable to have us email any address.
    send = mock.Mock()
    monkeypatch.setattr("egapro.emails.send", send)
    resp = await client.post(
        "/simulation",
        body={"data": {"informationsDeclarant": {"email": "victim@example.org"}}},
    )
    assert resp.status == 200
    assert "id" in json.loads(resp.body)
    send.assert_not_called()


async def test_send_code_endpoint_is_gone(client, monkeypatch):
    send = mock.Mock()
    monkeypatch.setattr("egapro.emails.send", send)
    uid = await db.simulation.create({"foo": "bar"})
    resp = await client.post(f"/simulation/{uid}/send-code", body={"email": "victim@example.org"})
    assert resp.status in (404, 405)
    send.assert_not_called()


async def test_put_simulation_never_sets_session_cookie(client):
    # Non regression: saving a simulation is an anonymous operation, it must
    # not return any credential, whatever the body contains.
    resp = await client.put(
        "/simulation/12345678-1234-5678-9012-123456789012", body={"foo": "bar"}
    )
    assert resp.status == 200
    assert not resp.cookies

    body = {
        "data": {
            "informationsDeclarant": {"email": "foo@bar.org"},
            "declaration": {"formValidated": "Valid"},
        }
    }
    resp = await client.put(
        "/simulation/12345678-1234-5678-9012-123456789012",
        body=body,
    )
    assert resp.status == 200
    assert not resp.cookies


async def test_put_simulation_does_not_grant_access_to_protected_endpoints(
    client, monkeypatch
):
    monkeypatch.setattr("egapro.config.STAFF", ["staff@email.com"])
    client.logout()

    body = {
        "data": {
            "informationsDeclarant": {"email": "staff@email.com"},
            "declaration": {"formValidated": "Valid"},
        }
    }
    resp = await client.put(
        "/simulation/12345678-1234-5678-9012-123456789012",
        body=body,
    )
    assert resp.status == 200
    assert not resp.cookies

    # Nothing was handed out, the caller is still anonymous.
    resp = await client.get("/me")
    assert resp.status == 401


async def test_put_simulation_with_empty_body(client):
    resp = await client.put("/simulation/12345678-1234-5678-9012-123456789012", body="")
    assert resp.status == 400


async def test_put_simulation_with_invalid_json(client):
    resp = await client.put(
        "/simulation/12345678-1234-5678-9012-123456789012", body="<foo>bar</foo>"
    )
    assert resp.status == 400


async def test_put_simulation_with_non_dict_json(client):
    resp = await client.put(
        "/simulation/12345678-1234-5678-9012-123456789012", body='"bar"'
    )
    assert resp.status == 400
