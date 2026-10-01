from egapro import loggers
from unittest import mock


def test_scrub_event_removes_credentials_and_personal_data():
    event = {
        "user": {"email": "foo@bar.org", "ip_address": "1.2.3.4"},
        "request": {
            "url": "https://egapro.travail.gouv.fr/api/me",
            "method": "GET",
            "query_string": "token=secret",
            "cookies": {"api-key": "secret"},
            "data": {"déclarant": {"email": "foo@bar.org"}},
            "headers": {
                "API-KEY": "secret",
                "Authorization": "Bearer secret",
                "Cookie": "api-key=secret",
                "X-Real-Ip": "1.2.3.4",
                "User-Agent": "Mozilla",
            },
        },
        "exception": {
            "values": [{"stacktrace": {"frames": [{"vars": {"data": "REDACT_ME"}}]}}]
        },
    }
    event = loggers.scrub_event(event)
    assert "user" not in event
    assert event["request"] == {
        "url": "https://egapro.travail.gouv.fr/api/me",
        "method": "GET",
        "headers": {"User-Agent": "Mozilla"},
    }
    assert "secret" not in str(event)
    assert "REDACT_ME" not in str(event)


def test_sentry_does_not_capture_local_variables(monkeypatch):
    init = mock.Mock()
    monkeypatch.setattr(loggers.sentry_sdk, "init", init)
    loggers.init()
    assert init.call_args.kwargs["include_local_variables"] is False
