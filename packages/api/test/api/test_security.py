"""Non regression tests for the security audit remediation."""

import json
import logging
from unittest import mock

import jwt
import pytest
from asyncpg.exceptions import UndefinedTableError

from egapro import config, db, tokens

pytestmark = pytest.mark.asyncio


# PDF routes require an owner (or staff) token.


async def test_declaration_pdf_requires_token(client, declaration):
    await declaration(siren="514027945", year=2020, owner="foo@bar.org")
    client.logout()
    resp = await client.get("/declaration/514027945/2020/pdf")
    assert resp.status == 401


async def test_declaration_pdf_is_forbidden_to_non_owner(client, declaration):
    await declaration(siren="514027945", year=2020, owner="foo@bar.org")
    client.login("non@owner.com")
    resp = await client.get("/declaration/514027945/2020/pdf")
    assert resp.status == 403


async def test_declaration_pdf_for_owner(client, declaration):
    await declaration(siren="514027945", year=2020, owner="foo@bar.org")
    resp = await client.get("/declaration/514027945/2020/pdf")
    assert resp.status == 200
    assert resp.headers["Content-Type"] == "application/pdf"


async def test_declaration_pdf_for_staff(client, declaration, monkeypatch):
    await declaration(siren="514027945", year=2020, owner="foo@bar.org")
    monkeypatch.setattr("egapro.config.STAFF", ["staff@email.com"])
    client.login("staff@email.com")
    resp = await client.get("/declaration/514027945/2020/pdf")
    assert resp.status == 200


async def test_representation_pdf_requires_token(client, representation_equilibree):
    await representation_equilibree(siren="514027945", year=2021, owner="foo@bar.org")
    client.logout()
    resp = await client.get("/representation-equilibree/514027945/2021/pdf")
    assert resp.status == 401


async def test_representation_pdf_is_forbidden_to_non_owner(
    client, representation_equilibree
):
    await representation_equilibree(siren="514027945", year=2021, owner="foo@bar.org")
    client.login("non@owner.com")
    resp = await client.get("/representation-equilibree/514027945/2021/pdf")
    assert resp.status == 403


# Public endpoints never expose drafts.


async def test_public_endpoints_do_not_expose_draft(client, declaration):
    await declaration(
        siren="514027945",
        year=2020,
        owner="foo@bar.org",
        déclaration={"brouillon": True},
    )
    client.logout()
    resp = await client.get("/public/declaration")
    assert resp.status == 404
    resp = await client.get("/public/declaration/514027945")
    assert resp.status == 404
    resp = await client.get("/public/declaration/514027945/2020")
    assert resp.status == 404


async def test_public_endpoints_expose_published_version_not_pending_draft(
    client, declaration
):
    await declaration(
        siren="514027945", year=2020, owner="foo@bar.org", company="Published"
    )
    # A draft is then saved on top of the published declaration.
    await declaration(
        siren="514027945",
        year=2020,
        owner="foo@bar.org",
        company="Secret draft",
        déclaration={"brouillon": True},
    )
    client.logout()
    resp = await client.get("/public/declaration/514027945/2020")
    assert resp.status == 200
    assert json.loads(resp.body)["entreprise"]["raison_sociale"] == "Published"
    resp = await client.get("/public/declaration/514027945")
    assert resp.status == 200
    names = [d["entreprise"]["raison_sociale"] for d in json.loads(resp.body)]
    assert names == ["Published"]
    resp = await client.get("/public/declaration")
    assert resp.status == 200
    assert "Secret draft" not in resp.body.decode()


# Errors details stay server side.


async def test_database_data_error_is_generic(client, monkeypatch):
    from asyncpg.exceptions import DataError

    async def mock_run(*args, **kwargs):
        raise DataError("LIMIT must not be negative")

    monkeypatch.setattr("egapro.db.search.run", mock_run)
    resp = await client.get("/search?q=foo")
    assert resp.status == 400
    assert json.loads(resp.body) == {"error": "Invalid data"}


async def test_database_error_is_generic(client, monkeypatch):
    async def mock_run(*args, **kwargs):
        raise UndefinedTableError('relation "secret_table" does not exist')

    monkeypatch.setattr("egapro.db.search.run", mock_run)
    resp = await client.get("/search?q=foo")
    assert resp.status == 500
    assert "secret_table" not in resp.body.decode()
    assert json.loads(resp.body) == {"error": "Une erreur inattendue est survenue"}


async def test_uncaught_error_is_generic(client, monkeypatch):
    async def mock_run(*args, **kwargs):
        raise RuntimeError("some internal detail")

    monkeypatch.setattr("egapro.db.search.run", mock_run)
    resp = await client.get("/search?q=foo")
    assert resp.status == 500
    assert "internal detail" not in resp.body.decode()


# CORS.


async def test_cors_default_is_wildcard_without_credentials(client):
    resp = await client.get("/config", headers={"Origin": "https://evil.com"})
    assert resp.headers["Access-Control-Allow-Origin"] == "*"
    assert "Access-Control-Allow-Credentials" not in resp.headers


async def test_cors_with_allowed_origins(client, monkeypatch):
    monkeypatch.setattr(
        "egapro.config.ALLOW_ORIGIN",
        "https://egapro.travail.gouv.fr, http://localhost:3000",
    )
    resp = await client.get("/config", headers={"Origin": "http://localhost:3000"})
    assert resp.headers["Access-Control-Allow-Origin"] == "http://localhost:3000"
    assert resp.headers["Access-Control-Allow-Credentials"] == "true"
    resp = await client.get("/config", headers={"Origin": "https://evil.com"})
    assert "Access-Control-Allow-Origin" not in resp.headers
    assert "Access-Control-Allow-Credentials" not in resp.headers


# Links sent by email do not trust the Origin header blindly.


async def test_email_links_ignore_untrusted_origin(client, monkeypatch, declaration):
    sender = mock.Mock()
    await declaration(siren="514027945", year=2020, owner="foo@bar.org")
    monkeypatch.setattr("egapro.emails.send", sender)
    resp = await client.post(
        "/declaration/514027945/2020/receipt", headers={"Origin": "https://evil.com"}
    )
    assert resp.status == 204
    to, subject, txt, html = sender.call_args.args
    assert "evil.com" not in txt
    assert "evil.com" not in html
    assert f"{config.DOMAIN}/index-egapro/declaration/?siren=514027945" in txt


async def test_email_links_use_allowed_origin(client, monkeypatch, declaration):
    sender = mock.Mock()
    await declaration(siren="514027945", year=2020, owner="foo@bar.org")
    monkeypatch.setattr("egapro.emails.send", sender)
    monkeypatch.setattr("egapro.config.ALLOW_ORIGIN", "https://preprod.egapro.fr")
    resp = await client.post(
        "/declaration/514027945/2020/receipt",
        headers={"Origin": "https://preprod.egapro.fr"},
    )
    assert resp.status == 204
    to, subject, txt, html = sender.call_args.args
    assert "https://preprod.egapro.fr/index-egapro/declaration/?siren=514027945" in txt


@pytest.mark.parametrize(
    "headers",
    [
        {"Host": "evil.com"},
        {"Host": "evil.com", "Origin": "https://evil.com"},
    ],
)
async def test_email_links_ignore_the_host_header(
    client, monkeypatch, declaration, headers
):
    sender = mock.Mock()
    await declaration(siren="514027945", year=2020, owner="foo@bar.org")
    monkeypatch.setattr("egapro.emails.send", sender)
    resp = await client.post("/declaration/514027945/2020/receipt", headers=headers)
    assert resp.status == 204
    to, subject, txt, html = sender.call_args.args
    assert "evil.com" not in txt
    assert "evil.com" not in html
    assert f"{config.DOMAIN}/index-egapro/declaration/?siren=514027945" in txt


async def test_email_links_use_configured_domain_origin(
    client, monkeypatch, declaration
):
    sender = mock.Mock()
    await declaration(siren="514027945", year=2020, owner="foo@bar.org")
    monkeypatch.setattr("egapro.emails.send", sender)
    monkeypatch.setattr("egapro.config.DOMAIN", "https://egapro.example.fr")
    resp = await client.post(
        "/declaration/514027945/2020/receipt",
        headers={"Origin": "https://egapro.example.fr/"},
    )
    assert resp.status == 204
    to, subject, txt, html = sender.call_args.args
    assert "https://egapro.example.fr/index-egapro/declaration/?siren=514027945" in txt


# No token nor personal data in logs.


async def test_invalid_token_is_not_logged(client, caplog):
    caplog.set_level(logging.DEBUG, logger="egapro")
    client.default_headers["API-Key"] = "invalid.token.value"
    resp = await client.get("/me")
    assert resp.status == 401
    assert "invalid.token.value" not in caplog.text


@pytest.mark.parametrize(
    "payload,algorithm",
    [({"sub": "foo@bar.org"}, "HS512"), ({"exp": 4102444800}, "HS256")],
)
async def test_unexpected_token_is_unauthorized(client, payload, algorithm):
    client.default_headers["API-Key"] = jwt.encode(payload, config.SECRET, algorithm)
    resp = await client.get("/me")
    assert resp.status == 401


async def test_request_body_is_not_logged(client, caplog):
    caplog.set_level(logging.DEBUG, logger="egapro")
    resp = await client.put(
        "/declaration/514027945/2019",
        body={"foo": "bar", "déclarant": {"email": "secret@pii.org"}},
    )
    assert resp.status == 422
    assert "PUT /declaration/514027945/2019" in caplog.text
    assert "secret@pii.org" not in caplog.text


async def test_access_is_logged_without_query_string(client, caplog):
    caplog.set_level(logging.DEBUG, logger="egapro")
    resp = await client.get("/token?email=foo@bar.org")
    assert resp.status == 403
    assert "GET /token 403" in caplog.text
    assert "foo@bar.org" not in caplog.text


# The token is only read from the API-KEY header, never from a cookie (CSRF).


async def test_token_in_cookie_is_not_accepted(client, declaration):
    from egapro import tokens

    await declaration(siren="514027945", year=2020, owner="foo@bar.org")
    client.logout()
    token = tokens.create("foo@bar.org")
    resp = await client.get(
        "/declaration/514027945/2020", headers={"Cookie": f"api-key={token}"}
    )
    assert resp.status == 401
    resp = await client.get("/declaration/514027945/2020", headers={"API-KEY": token})
    assert resp.status == 200


# Token links are never logged outside local development (redirectTo is client input).


async def test_token_link_is_not_logged_in_production(client, monkeypatch, caplog):
    monkeypatch.setattr("egapro.config.DOMAIN", "https://egapro.travail.gouv.fr")
    monkeypatch.setattr("egapro.emails.send", mock.Mock())
    resp = await client.post("/token", body={"email": "staff@example.org", "redirectTo": "localhost"})
    assert resp.status == 204
    assert not any("token=" in r.getMessage() for r in caplog.records)


async def test_token_link_is_logged_in_local_development(client, monkeypatch, caplog):
    caplog.set_level(logging.INFO, logger="egapro")
    monkeypatch.setattr("egapro.config.DOMAIN", "http://localhost:3000")
    monkeypatch.setattr("egapro.emails.send", mock.Mock())
    await client.post("/token", body={"email": "dev@example.org"})
    assert any("token=" in r.getMessage() for r in caplog.records)


# Client supplied values cannot forge log lines.


def test_logged_client_values_cannot_forge_lines():
    # The real server URL-decodes the path (`%0A` becomes a newline); the testing
    # client does not, so check the escaping helper every log call goes through.
    from egapro import loggers

    assert loggers.safe("/a\nFAKE LINE\r\x1b[31m") == "/a\\x0aFAKE LINE\\x0d\\x1b[31m"
    assert loggers.safe("/declaration/123456782/2024") == "/declaration/123456782/2024"


# Anonymous searches are bounded.


async def test_search_bounds_query_and_limit(client, monkeypatch):
    calls = []

    async def run(**kwargs):
        calls.append(kwargs)
        return []

    async def count(**kwargs):
        return 0

    for table in ("search", "search_representation_equilibree"):
        monkeypatch.setattr(f"egapro.db.{table}.run", run)
        monkeypatch.setattr(f"egapro.db.{table}.count", count)
    for path in ("/search", "/representation-equilibree/search"):
        resp = await client.get(f"{path}?q={'a' * 5000}&limit=100000&offset=-5")
        assert resp.status == 200
    for kwargs in calls:
        assert len(kwargs["query"]) == 100
        assert kwargs["limit"] == 100
        assert kwargs["offset"] == 0


# POST /token cannot be used to mailbomb an address.


async def test_token_requests_are_throttled_per_address(client, monkeypatch):
    send = mock.Mock()
    monkeypatch.setattr("egapro.emails.send", send)
    resp = await client.post("/token", body={"email": "victim@example.org"})
    assert resp.status == 204
    resp = await client.post("/token", body={"email": "Victim@Example.org "})
    assert resp.status == 429
    assert send.call_count == 1
    resp = await client.post("/token", body={"email": "other@example.org"})
    assert resp.status == 204


def test_token_throttle_expires_and_stays_bounded(monkeypatch):
    from egapro import views

    views._token_requests.clear()
    assert not views.token_request_throttled("a@b.c", now=0)
    assert views.token_request_throttled("a@b.c", now=30)
    assert not views.token_request_throttled("a@b.c", now=61)
    monkeypatch.setattr(views, "TOKEN_EMAIL_MAX_TRACKED", 3)
    for i in range(10):
        views.token_request_throttled(f"{i}@b.c", now=100)
    assert len(views._token_requests) <= 3


def test_full_token_throttle_only_evicts_the_oldest_addresses(monkeypatch):
    from egapro import views

    views._token_requests.clear()
    monkeypatch.setattr(views, "TOKEN_EMAIL_MAX_TRACKED", 3)
    views.token_request_throttled("oldest@b.c", now=0)
    views.token_request_throttled("victim@b.c", now=1)
    views.token_request_throttled("other@b.c", now=2)
    # The table is full of addresses still in their cooldown: a new address must not
    # reset them all, only push out the oldest one.
    assert not views.token_request_throttled("new@b.c", now=3)
    assert views.token_request_throttled("victim@b.c", now=4)
    assert "oldest@b.c" not in views._token_requests


@pytest.mark.parametrize(
    "email",
    [
        "victim@example.org, other@example.org",
        "victim@example.org;other@example.org",
        "Victim <victim@example.org>",
        "victim@example.org other@example.org",
        "victim@example.org\nBcc: other@example.org",
        "victim@example.org\x00",
        "victim",
        "@example.org",
        ["victim@example.org"],
    ],
)
async def test_token_request_accepts_a_single_address_only(client, monkeypatch, email):
    send = mock.Mock()
    monkeypatch.setattr("egapro.emails.send", send)
    resp = await client.post("/token", body={"email": email})
    assert resp.status == 400
    assert json.loads(resp.body) == {"error": "Adresse email invalide"}
    assert not send.called


async def test_token_is_sent_to_the_throttled_address(client, monkeypatch):
    send = mock.Mock()
    monkeypatch.setattr("egapro.emails.send", send)
    resp = await client.post("/token", body={"email": " Victim@Example.org "})
    assert resp.status == 204
    to, subject, body = send.call_args.args
    assert to == "victim@example.org"
    token = body.split("?token=")[1].split()[0]
    assert tokens.read(token) == "victim@example.org"
    resp = await client.post("/token", body={"email": "victim@example.org"})
    assert resp.status == 429


@pytest.mark.parametrize(
    "redirect",
    [
        "declaration/\n\nCliquez plutôt sur https://evil.com",
        "declaration/\r\nhttps://evil.com",
        "declaration/ https://evil.com",
        "declaration/?next=https://evil.com",
        "https://evil.com",
        ["declaration/"],
    ],
)
async def test_token_redirect_cannot_inject_text_in_email(
    client, monkeypatch, redirect
):
    send = mock.Mock()
    monkeypatch.setattr("egapro.emails.send", send)
    resp = await client.post(
        "/token", body={"email": "foo@bar.org", "redirectTo": redirect}
    )
    assert resp.status == 400
    assert json.loads(resp.body) == {"error": "Chemin de redirection invalide"}
    assert not send.called


async def test_token_redirect_keeps_paths(client, monkeypatch):
    send = mock.Mock()
    monkeypatch.setattr("egapro.emails.send", send)
    resp = await client.post(
        "/token",
        body={
            "email": "foo@bar.org",
            "redirectTo": "//index-egapro/tableau_de-bord.v2/",
        },
    )
    assert resp.status == 204
    to, subject, body = send.call_args.args
    assert f"{config.DOMAIN}/index-egapro/tableau_de-bord.v2/?token=" in body


# Request bodies ujson 1.35 refused, or that broke the JSON layer, are a 400.


@pytest.mark.parametrize(
    "body", ['{"a": NaN}', '{"a": [Infinity]}', '{"a": -Infinity}']
)
async def test_non_finite_numbers_in_body_are_refused(client, body):
    resp = await client.post("/simulation", body=body)
    assert resp.status == 400


async def test_deeply_nested_body_is_not_a_server_error(client):
    nested = "[" * 1000 + "]" * 1000
    resp = await client.post("/simulation", body='{"a":' + nested + "}")
    assert resp.status == 200
    resp = await client.get(f"/simulation/{json.loads(resp.body)['id']}")
    assert resp.status == 200
    assert json.loads(resp.body)["data"]["a"] == json.loads(nested)
    resp = await client.post("/simulation", body="[" * 5000 + "]" * 5000)
    assert resp.status == 400


# The anonymous public listing never loads a whole year in memory.


async def test_public_declarations_listing_is_bounded_in_sql(client, monkeypatch):
    limits = []

    async def published(year, limit):
        limits.append(limit)
        return []

    monkeypatch.setattr("egapro.db.declaration.published", published)
    resp = await client.get("/public/declaration?limit=100000")
    assert resp.status == 404  # nothing published in this test
    assert limits and all(limit <= 100 for limit in limits)


async def test_public_declarations_listing_skips_drafts(client, declaration):
    await declaration(siren="514027945", year=2019, owner="foo@bar.org")
    await declaration(siren="514027946", year=2019, owner="foo@bar.org", déclaration={"brouillon": True})
    records = await db.declaration.published(2019, 10)
    assert [r["siren"] for r in records] == ["514027945"]


async def test_security_headers_on_api_responses(client, declaration):
    await declaration(siren="514027945", year=2019, owner="foo@bar.org")
    resp = await client.get("/declaration/514027945/2019")
    assert resp.status == 200
    assert resp.headers["X-Content-Type-Options"] == "nosniff"
    assert resp.headers["X-Frame-Options"] == "DENY"
    assert resp.headers["Cache-Control"] == "no-store"
    public = await client.get("/config")
    assert public.headers["X-Content-Type-Options"] == "nosniff"
    assert "Cache-Control" not in public.headers
