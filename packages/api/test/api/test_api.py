import json
from datetime import datetime, timezone
from unittest import mock

import pytest

from egapro import db, constants

pytestmark = pytest.mark.asyncio


async def test_request_token(client, monkeypatch):
    calls = 0

    def mock_send(to, subject, body):
        assert to == "foo@bar.org"
        assert "https://mycustomurl.org/declaration/token/" in body
        nonlocal calls
        calls += 1

    client.logout()
    monkeypatch.setattr("egapro.emails.send", mock_send)
    resp = await client.post(
        "/token",
        body={
            "email": "foo@bar.org",
            "url": "https://mycustomurl.org/declaration/token/",
        },
    )
    assert resp.status == 204
    assert calls == 1


async def test_request_token_with_allowed_ips(client, monkeypatch):
    calls = 0

    def mock_send(to, subject, body):
        nonlocal calls
        calls += 1

    client.logout()
    monkeypatch.setattr("egapro.emails.send", mock_send)
    monkeypatch.setattr("egapro.config.ALLOWED_IPS", ["1.1.1.1"])
    resp = await client.post(
        "/token", body={"email": "foo@bar.org"}, headers={"X-REAL-IP": "1.1.1.1"}
    )
    assert resp.status == 200
    assert list(json.loads(resp.body).keys()) == ["token"]
    assert calls == 0


async def test_search_endpoint(client):
    await db.declaration.put(
        "12345671",
        2020,
        "foo@bar.org",
        {
            "déclaration": {"index": 95, "année_indicateurs": 2020},
            "id": "12345678-1234-5678-9012-123456789013",
            "entreprise": {
                "raison_sociale": "Bio c Bon",
                "effectif": {"tranche": "1000:"},
            },
        },
    )
    resp = await client.get("/search?q=bio")
    assert resp.status == 200
    assert json.loads(resp.body) == {
        "data": [
            {
                "entreprise": {
                    "raison_sociale": "Bio c Bon",
                    "département": None,
                    "région": None,
                    "code_naf": None,
                    "effectif": {"tranche": "1000:"},
                    "siren": "12345671",
                    "ues": None,
                },
                "notes": {"2020": 95},
                "notes_augmentations": {"2020": None},
                "notes_augmentations_et_promotions": {"2020": None},
                "notes_conges_maternite": {"2020": None},
                "notes_hautes_rémunérations": {"2020": None},
                "notes_promotions": {"2020": None},
                "notes_remunerations": {"2020": None},
                "label": "Bio c Bon",
            },
        ],
        "count": 1,
    }
    resp = await client.get("/search?q=bio&limit=1")
    assert resp.status == 200
    assert len(json.loads(resp.body)["data"]) == 1
    resp = await client.get("/search")
    assert resp.status == 200
    assert len(json.loads(resp.body)["data"]) == 1

async def test_search_representation_equilibree_endpoint(client):
    await db.representation_equilibree.put(
        "12345671",
        2020,
        {
            "déclaration": {"année_indicateurs": 2020},
            "entreprise": {
                "raison_sociale": "Bio c Bon",
            },
        },
    )
    resp = await client.get("/representation-equilibree/search?q=bio")
    print("weqsh", resp.body)
    assert resp.status == 200
    assert json.loads(resp.body) == {
        "data": [
            {
                "entreprise": {
                    "raison_sociale": "Bio c Bon",
                    "département": None,
                    "région": None,
                    "code_naf": None,
                    "siren": "12345671",
                },
                "représentation_équilibrée": {
                    "2020": {
                        "pourcentage_femmes_cadres": None,
                        "pourcentage_hommes_cadres": None,
                        "pourcentage_femmes_membres": None,
                        "pourcentage_hommes_membres": None,
                        "motif_non_calculabilité_cadres": None,
                        "motif_non_calculabilité_membres": None,
                    },
                },
                "label": "Bio c Bon",
            },
        ],
        "count": 1,
    }
    resp = await client.get("/representation-equilibree/search?q=bio&limit=1")
    assert resp.status == 200
    assert len(json.loads(resp.body)["data"]) == 1
    resp = await client.get("/representation-equilibree/search")
    assert resp.status == 200
    assert len(json.loads(resp.body)["data"]) == 1


async def test_stats_endpoint(client):
    await db.declaration.put(
        "12345671",
        constants.CURRENT_YEAR,
        "foo@bar.org",
        {
            "déclaration": {"index": 95, "année_indicateurs": constants.CURRENT_YEAR},
            "id": "12345678-1234-5678-9012-123456789013",
            "entreprise": {
                "raison_sociale": "Bio c Bon",
                "effectif": {"tranche": "1000:"},
                "département": "12",
            },
        },
    )
    await db.declaration.put(
        "123456782",
        constants.CURRENT_YEAR,
        "foo@bar.org",
        {
            "déclaration": {"index": 93, "année_indicateurs": constants.CURRENT_YEAR},
            "id": "12345678-1234-5678-9012-123456789012",
            "entreprise": {
                "raison_sociale": "RoboCoop",
                "effectif": {"tranche": "251:999"},
                "département": "11",
            },
        },
    )
    resp = await client.get("/stats")
    assert resp.status == 200
    assert json.loads(resp.body) == {
        "count": 2,
        "max": 95,
        "min": 93,
        "avg": 94,
    }
    resp = await client.get("/stats?departement=11")
    assert resp.status == 200
    assert json.loads(resp.body) == {
        "count": 1,
        "max": 93,
        "min": 93,
        "avg": 93,
    }


async def test_config_endpoint(client):
    resp = await client.get("/config")
    assert resp.status == 200
    assert list(json.loads(resp.body).keys()) == [
        "YEARS",
        "PUBLIC_YEARS",
        "EFFECTIFS",
        "DEPARTEMENTS",
        "REGIONS",
        "REGIONS_TO_DEPARTEMENTS",
        "NAF",
        "SECTIONS_NAF",
        "READONLY",
    ]
    assert json.loads(resp.body)["YEARS"] == constants.YEARS
    resp = await client.get("/config?key=YEARS&key=REGIONS")
    assert resp.status == 200
    assert list(json.loads(resp.body).keys()) == [
        "YEARS",
        "REGIONS",
    ]


async def test_validate_siren(client, monkeypatch):
    metadata = {
        "adresse": "2 RUE FOOBAR",
        "code_naf": "62.02A",
        "code_postal": "75002",
        "commune": "PARIS 2",
        "département": "75",
        "raison_sociale": "FOOBAR",
        "région": "11",
    }

    async def patch(siren, year):
        return metadata

    monkeypatch.setattr("egapro.helpers.get_entreprise_details", patch)
    resp = await client.get("/validate-siren?siren=1234567")
    assert resp.status == 422
    assert json.loads(resp.body) == {"error": "Numéro SIREN invalide: 1234567"}
    resp = await client.get("/validate-siren?siren=123456789")
    assert resp.status == 422
    assert json.loads(resp.body) == {"error": "Numéro SIREN invalide: 123456789"}
    resp = await client.get("/validate-siren?siren=123456782")
    assert resp.status == 200
    assert json.loads(resp.body) == metadata


async def test_validate_unknown_siren(client, monkeypatch):
    async def patch(siren, year):
        return {}

    monkeypatch.setattr("egapro.helpers.load_from_recherche_entreprises", patch)
    resp = await client.get("/validate-siren?siren=123456782")
    assert resp.status == 404
    assert json.loads(resp.body) == {"error": "Numéro SIREN inconnu: 123456782"}


async def test_get_entreprise_data(client, declaration):
    await declaration(
        siren="123456789",
        year=2020,
        entreprise={"code_naf": "6202A", "raison_sociale": "Lilly Wood"},
    )
    resp = await client.get("/entreprise/123456789")
    assert json.loads(resp.body) == {
        "code_naf": "6202A",
        "département": "26",
        "effectif": {"tranche": "50:250"},
        "raison_sociale": "Lilly Wood",
        "région": "84",
        "siren": "123456789",
        "ues": None,
    }
    resp = await client.get("/entreprise/987654321")
    assert resp.status == 404


async def test_get_entreprise_data_from_draft(client, declaration):
    await declaration(
        siren="123456789",
        year=2020,
        entreprise={"code_naf": "6202A", "raison_sociale": "Lilly Wood"},
        déclaration={"brouillon": True},
    )
    resp = await client.get("/entreprise/123456789")
    assert resp.status == 404


async def test_me(client, declaration):
    at = datetime(2021, 2, 3, 4, 5, 6, tzinfo=timezone.utc)
    await declaration(owner="foo@bar.org", modified_at=at)
    resp = await client.get("/me")
    assert resp.status == 200
    assert json.loads(resp.body) == {
        "email": "foo@bar.org",
        "staff": False,
        "déclarations": [
            {
                "modified_at": at.timestamp(),
                "declared_at": at.timestamp(),
                "name": "Total Recall",
                "siren": "123456782",
                "year": 2020,
            }
        ],
        "ownership": ["123456782"],
    }


async def test_me_without_token(client):
    client.logout()
    resp = await client.get("/me")
    assert resp.status == 401


async def test_me_for_staff(client, declaration, monkeypatch):
    monkeypatch.setattr("egapro.config.STAFF", ["staff@email.com"])
    client.login("Staff@email.com")
    resp = await client.get("/me")
    assert resp.status == 200
    assert json.loads(resp.body) == {
        "email": "staff@email.com",
        "staff": True,
        "déclarations": [],
        "ownership": [],
    }


async def test_resend_receipt_endpoint(client, monkeypatch, declaration):
    sender = mock.Mock()
    await db.ownership.put("514027945", "foo@bar.org")
    # Add another owner, that should be in the email recipients
    await db.ownership.put("514027945", "foo@foo.foo")
    await declaration(
        siren="514027945",
        year=2020,
        owner="foo@bar.org",
        entreprise={
            "adresse": "1 rue de Trois",
            "code_postal": "77480",
            "commune": "Quatre",
        },
    )
    monkeypatch.setattr("egapro.emails.send", sender)
    resp = await client.post("/declaration/514027945/2020/receipt")
    assert resp.status == 204
    assert sender.call_count == 1
    to, subject, txt, html = sender.call_args.args
    assert to == ["foo@bar.org", "foo@foo.foo"]
    assert "/index-egapro/declaration/?siren=514027945&year=2020" in txt
    assert "/index-egapro/declaration/?siren=514027945&year=2020" in html
    assert sender.call_args.kwargs["attachment"][1] == "declaration_514027945_2021.pdf"


async def test_resend_receipt_endpoint_by_staff(client, monkeypatch, declaration):
    sender = mock.Mock()
    await db.ownership.put("514027945", "foo@bar.org")
    # Add another owner, that should be in the email recipients
    await db.ownership.put("514027945", "foo@foo.foo")
    await declaration(
        siren="514027945",
        year=2020,
        owner="foo@bar.org",
        entreprise={
            "adresse": "1 rue de Trois",
            "code_postal": "77480",
            "commune": "Quatre",
        },
    )
    monkeypatch.setattr("egapro.emails.send", sender)
    monkeypatch.setattr("egapro.config.STAFF", ["staff@email.com"])
    client.login("Staff@email.com")
    resp = await client.post("/declaration/514027945/2020/receipt")
    assert resp.status == 204
    assert sender.call_count == 1
    to, subject, txt, html = sender.call_args.args
    assert to == ["foo@bar.org", "foo@foo.foo"]
    assert "/index-egapro/declaration/?siren=514027945&year=2020" in txt
    assert "/index-egapro/declaration/?siren=514027945&year=2020" in html
    assert sender.call_args.kwargs["attachment"][1] == "declaration_514027945_2021.pdf"


async def test_resend_receipt_endpoint_by_non_owner(client, monkeypatch, declaration):
    sender = mock.Mock()
    await db.ownership.put("514027945", "foo@bar.org")
    # Add another owner, that should be in the email recipients
    await db.ownership.put("514027945", "foo@foo.foo")
    await declaration(
        siren="514027945",
        year=2020,
        owner="foo@bar.org",
        entreprise={
            "adresse": "1 rue de Trois",
            "code_postal": "77480",
            "commune": "Quatre",
        },
    )
    monkeypatch.setattr("egapro.emails.send", sender)
    client.login("non@owner.com")
    resp = await client.post("/declaration/514027945/2020/receipt")
    assert resp.status == 403
    assert not sender.called


async def test_resend_receipt_endpoint_with_unknown_declaration(client, monkeypatch):
    sender = mock.Mock()
    await db.ownership.put("514027945", "foo@bar.org")
    monkeypatch.setattr("egapro.emails.send", sender)
    resp = await client.post("/declaration/514027945/2019/receipt")
    assert resp.status == 404
    assert not sender.called


async def test_get_token_from_staff(client, monkeypatch):
    monkeypatch.setattr("egapro.config.STAFF", ["staff@email.com"])
    client.login("Staff@email.com")
    resp = await client.get(
        "/token?email=foo@bar.org",
    )
    assert resp.status == 200
    body = json.loads(resp.body)
    assert "token" in body


async def test_get_token_from_non_staff(client, monkeypatch):
    resp = await client.get(
        "/token?email=foo@bar.org",
    )
    assert resp.status == 403
    assert json.loads(resp.body) == {"error": "Vous n'avez pas l'autorisation"}
