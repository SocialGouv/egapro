import json

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


async def test_start_new_simulation_send_email_if_given(client, monkeypatch):
    calls = 0
    email_body = ""

    def mock_send(to, subject, txt, html=None, reply_to=None, attachment=None):
        assert to == "foo@bar.org"
        nonlocal calls
        nonlocal email_body
        email_body = txt
        calls += 1

    monkeypatch.setattr("egapro.emails.send", mock_send)
    resp = await client.post("/simulation", body={"foo": "bar"})
    assert resp.status == 200
    assert not calls
    resp = await client.post(
        "/simulation",
        body={"data": {"informationsDeclarant": {"email": "foo@bar.org"}}},
    )
    assert resp.status == 200
    data = json.loads(resp.body)
    assert data["id"] in email_body


async def test_send_code_endpoint(client, monkeypatch, body):
    calls = 0
    email_body = ""
    recipient = None

    def mock_send(to, subject, txt, html=None, reply_to=None, attachment=None):
        assert to == "foo@bar.org"
        nonlocal calls
        nonlocal email_body
        nonlocal recipient
        email_body = txt
        recipient = to
        calls += 1

    monkeypatch.setattr("egapro.emails.send", mock_send)

    # Invalid UUID
    resp = await client.post("/simulation/unknown/send-code", body=body)
    assert resp.status == 400
    assert json.loads(resp.body) == {
        "error": 'Invalid data: invalid input syntax for type uuid: "unknown"'
    }
    assert not calls

    # Not found UUID
    resp = await client.post(
        "/simulation/12345678-1234-5678-9012-123456789012/send-code",
        body=body,
    )
    assert resp.status == 404
    assert not calls

    # Create simulation
    uid = await db.simulation.create(
        {
            "déclaration": {"formValidated": "Valid"},
            "entreprise": {"siren": "12345678"},
            "informations": {"année_indicateurs": 2019},
        }
    )

    # Missing email
    resp = await client.post(f"/simulation/{uid}/send-code", body=body)
    assert resp.status == 400
    assert json.loads(resp.body) == {"error": "Missing `email` key"}
    assert not calls

    # Valid request.
    resp = await client.post(
        f"/simulation/{uid}/send-code", body={"email": "foo@bar.org"}
    )
    assert resp.status == 204
    assert uid in email_body
    assert recipient == "foo@bar.org"


async def test_put_simulation_set_cookie_if_email_is_given(client, monkeypatch):
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
    assert resp.cookies["api-key"]


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
